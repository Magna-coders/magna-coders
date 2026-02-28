"""
MagnaAgent Core - ReAct Pattern Implementation

This module implements the central orchestration component for the Magna AI Agent
using the ReAct (Reason + Act) pattern for structured decision-making.

The ReAct cycle follows: Analyze → Plan → Act → Respond

**Validates: Requirements 7.1-7.7**
"""

import json
import logging
import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Any, AsyncIterator, Dict, List, Optional
from uuid import uuid4

from ..llm.orchestrator import LLMOrchestrator
from ..memory.system import MemorySystem
from ..tools.base import ToolRegistry, ToolResult
from ..matching.opportunity import OpportunityMatcher
from ..matching.collaboration import CollaborationMatcher
from ..interview.preparation import InterviewPreparationModule
from ..documents.manager import DocumentManager
from ..documents.consent import ConsentManager
from ..utils.performance import ProgressIndicator, ProgressUpdate, RequestCache, ParallelExecutor
from .prompts import (
    BASE_SYSTEM_PROMPT,
    build_system_prompt,
    get_analysis_prompt,
    get_planning_prompt,
)

logger = logging.getLogger(__name__)


@dataclass
class Context:
    """Context for agent processing."""
    user_id: str
    conversation_id: str
    message: str
    memory_entries: List[Any]
    metadata: Dict[str, Any]


@dataclass
class Analysis:
    """Result of the Analyze phase."""
    intent: str  # User's primary intent
    required_information: List[str]  # What info is needed
    entities: Dict[str, Any]  # Extracted entities
    confidence: float  # Confidence in analysis (0-1)


@dataclass
class ActionPlan:
    """Result of the Plan phase."""
    tools_to_use: List[str]  # Tool names in execution order
    tool_parameters: Dict[str, Dict[str, Any]]  # Parameters for each tool
    execution_strategy: str  # "sequential" or "parallel"
    reasoning: str  # Why this plan was chosen


@dataclass
class ActionResults:
    """Result of the Act phase."""
    tool_results: Dict[str, ToolResult]  # Tool name -> result
    success: bool  # Overall success
    errors: List[str]  # Any errors encountered


@dataclass
class AgentResponse:
    """Response from agent processing."""
    content: str  # Response text
    conversation_id: str
    metadata: Dict[str, Any]  # Tool calls, results, etc.
    timestamp: datetime
    tool_calls: Optional[List[Any]] = None  # Tool calls made during processing
    results: Optional[List[Any]] = None  # Results from tool executions
    requires_consent: Optional[Any] = None  # Consent request if needed


class MagnaAgent:
    """
    Central orchestration component implementing the ReAct pattern.
    
    The agent processes user messages through a structured cycle:
    1. ANALYZE: Parse intent and identify required information
    2. PLAN: Select tools and determine execution order
    3. ACT: Execute tool calls with error handling
    4. RESPOND: Generate final response using LLM
    
    The agent integrates with:
    - LLM Orchestrator for response generation
    - Memory System for context retrieval
    - Tool Registry for action execution
    - Matching engines for opportunity/collaboration recommendations
    - Interview preparation for career guidance
    - Document management for file handling
    - Consent management for user approval
    
    **Validates: Requirements 7.1-7.7**
    """
    
    # System prompt defining agent persona and behavior
    # Note: This is kept for backward compatibility. Use prompts.py for new implementations.
    SYSTEM_PROMPT = BASE_SYSTEM_PROMPT

    def __init__(
        self,
        llm_orchestrator: LLMOrchestrator,
        memory_system: MemorySystem,
        tool_registry: ToolRegistry,
        opportunity_matcher: Optional[OpportunityMatcher] = None,
        collaboration_matcher: Optional[CollaborationMatcher] = None,
        interview_module: Optional[InterviewPreparationModule] = None,
        document_manager: Optional[DocumentManager] = None,
        consent_manager: Optional[ConsentManager] = None,
        mcp_server: Optional[Any] = None,
        system_prompt: Optional[str] = None,
        progress_threshold_seconds: float = 2.0
    ):
        """
        Initialize MagnaAgent with dependencies.
        
        Args:
            llm_orchestrator: LLM orchestrator for response generation
            memory_system: Memory system for context retrieval
            tool_registry: Tool registry for action execution
            opportunity_matcher: Optional opportunity matching engine
            collaboration_matcher: Optional collaboration matching engine
            interview_module: Optional interview preparation module
            document_manager: Optional document management system
            consent_manager: Optional consent management system
            mcp_server: Optional MCP server for backend data access
            system_prompt: Optional custom system prompt (uses default if None)
            progress_threshold_seconds: Time threshold for progress indicators (default: 2.0s)
        """
        self.llm_orchestrator = llm_orchestrator
        self.memory_system = memory_system
        self.tool_registry = tool_registry
        self.opportunity_matcher = opportunity_matcher
        self.collaboration_matcher = collaboration_matcher
        self.interview_module = interview_module
        self.document_manager = document_manager
        self.consent_manager = consent_manager
        self.mcp_server = mcp_server
        self.system_prompt = system_prompt or self.SYSTEM_PROMPT
        self.progress_indicator = ProgressIndicator(threshold_seconds=progress_threshold_seconds)
        self.request_cache = RequestCache(default_ttl_seconds=300)  # 5 minute cache
        
        # Register MCP tools with tool registry if MCP server is provided
        if self.mcp_server:
            self._register_mcp_tools()
        
        logger.info("MagnaAgent initialized with ReAct pattern")
    
    def _register_mcp_tools(self) -> None:
        """
        Register MCP tools with the agent's tool registry.
        
        This creates wrapper tools that invoke the MCP server's tools,
        making them available to the agent during the Plan and Act phases.
        """
        from ..tools.base import Tool, ToolResult
        
        # Get list of available MCP tools
        mcp_tools = self.mcp_server.get_tool_list()
        
        logger.info(f"Registering {len(mcp_tools)} MCP tools with agent")
        
        for mcp_tool_info in mcp_tools:
            tool_name = mcp_tool_info['name']
            tool_description = mcp_tool_info['description']
            
            # Create a wrapper tool that invokes the MCP server
            class MCPToolWrapper(Tool):
                """Wrapper tool that invokes MCP server."""
                
                def __init__(self, mcp_server, mcp_tool_name: str, mcp_tool_description: str):
                    self.mcp_server = mcp_server
                    self.mcp_tool_name = mcp_tool_name
                    self.mcp_tool_description = mcp_tool_description
                
                @property
                def name(self) -> str:
                    return f"mcp_{self.mcp_tool_name}"
                
                @property
                def description(self) -> str:
                    return f"[MCP] {self.mcp_tool_description}"
                
                @property
                def parameters_schema(self) -> Dict[str, Any]:
                    """Return JSON schema for MCP tool parameters."""
                    return {
                        "type": "object",
                        "properties": {
                            "user_id": {
                                "type": "string",
                                "description": "User ID for the authenticated user"
                            }
                        },
                        "required": ["user_id"]
                    }
                
                async def execute(self, **parameters) -> ToolResult:
                    """Execute the MCP tool."""
                    import time
                    start_time = time.time()
                    
                    try:
                        # Extract user_id from parameters (required for MCP tools)
                        user_id = parameters.get('user_id')
                        if not user_id:
                            return ToolResult(
                                success=False,
                                data=None,
                                error="user_id parameter is required for MCP tools",
                                execution_time_ms=int((time.time() - start_time) * 1000)
                            )
                        
                        # Remove user_id from parameters before passing to MCP server
                        # (it's passed separately)
                        mcp_params = {k: v for k, v in parameters.items() if k != 'user_id'}
                        
                        # Execute MCP tool
                        result = await self.mcp_server.execute_tool(
                            tool_name=self.mcp_tool_name,
                            user_id=user_id,
                            parameters=mcp_params
                        )
                        
                        execution_time = int((time.time() - start_time) * 1000)
                        
                        return ToolResult(
                            success=True,
                            data=result,
                            error=None,
                            execution_time_ms=execution_time
                        )
                    
                    except Exception as e:
                        execution_time = int((time.time() - start_time) * 1000)
                        logger.error(f"MCP tool execution failed: {self.mcp_tool_name} - {str(e)}")
                        
                        return ToolResult(
                            success=False,
                            data=None,
                            error=str(e),
                            execution_time_ms=execution_time
                        )
            
            # Create and register the wrapper tool
            wrapper_tool = MCPToolWrapper(
                mcp_server=self.mcp_server,
                mcp_tool_name=tool_name,
                mcp_tool_description=tool_description
            )
            
            self.tool_registry.register_tool(wrapper_tool)
            logger.info(f"Registered MCP tool wrapper: {wrapper_tool.name}")
    
    async def _fetch_user_context(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch user context from MCP server with caching.
        
        This method retrieves user profile information including name, role,
        skills, experience level, location, and subscription tier. The context
        is cached for 5 minutes to reduce database queries.
        
        Args:
            user_id: User ID to fetch context for
            
        Returns:
            Dict with user context or None if fetch fails
            
        **Validates: Requirements 9.1, 9.6, 14.4**
        """
        if not self.mcp_server:
            logger.warning("MCP server not available, cannot fetch user context")
            return None
        
        # Check cache first (using request_cache which has 5-minute TTL)
        cache_key = f"user_context:{user_id}"
        cached_context = self.request_cache.get(cache_key, {"user_id": user_id})
        
        if cached_context is not None:
            logger.info(f"User context cache hit for user {user_id}")
            return cached_context
        
        # Fetch from MCP server
        try:
            logger.info(f"Fetching user context from MCP server for user {user_id}")
            
            context = await self.mcp_server.execute_tool(
                tool_name="get_user_context",
                user_id=user_id,
                parameters={}
            )
            
            # Cache the context for 5 minutes
            self.request_cache.set(
                query=cache_key,
                response=context,
                context={"user_id": user_id},
                ttl_seconds=300  # 5 minutes
            )
            
            logger.info(f"User context fetched and cached for user {user_id}")
            return context
            
        except Exception as e:
            logger.error(f"Failed to fetch user context for user {user_id}: {e}")
            return None
    
    async def process_message(
        self,
        user_id: str,
        message: str,
        conversation_id: str,
        stream: bool = True
    ) -> AsyncIterator[AgentResponse]:
        """
        Process user message through ReAct cycle.
        
        This is the main entry point for agent processing. It orchestrates
        the complete ReAct cycle: Analyze → Plan → Act → Respond.
        
        Shows progress indicators when processing takes longer than threshold.
        Checks cache for frequently asked questions before processing.
        
        Args:
            user_id: User ID
            message: User's input message
            conversation_id: Conversation ID for context
            stream: Whether to stream response chunks
            
        Yields:
            Progress updates (if slow), then AgentResponse chunks if streaming,
            or complete response
            
        **Validates: Requirements 7.1, 10.2, 10.3**
        """
        request_id = str(uuid4())
        start_time = datetime.now()
        
        logger.info(
            f"Processing message: request_id={request_id}, user={user_id}, "
            f"conversation={conversation_id}, stream={stream}"
        )
        
        # Check cache first
        cache_context = {"user_id": user_id}
        cached_response = self.request_cache.get(message, cache_context)
        
        if cached_response is not None:
            logger.info(f"[{request_id}] Cache hit for query")
            # Return cached response
            cached_response.metadata["request_id"] = request_id
            cached_response.metadata["from_cache"] = True
            cached_response.timestamp = datetime.now()
            yield cached_response
            return
        
        logger.debug(f"[{request_id}] Cache miss, processing query")
        
        async def _process_internal():
            """Internal processing function for progress tracking."""
            try:
                # Fetch user context at session start
                user_context = await self._fetch_user_context(user_id)
                
                # Retrieve memory context
                memory_entries = await self.memory_system.retrieve_context(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    query=message,
                    max_results=5
                )
                
                # Build context with user profile information
                context = Context(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    message=message,
                    memory_entries=memory_entries,
                    metadata={
                        "request_id": request_id,
                        "start_time": start_time.isoformat(),
                        "user_context": user_context  # Add user context to metadata
                    }
                )
                
                # FAST PATH: Check if this is a simple conversational query
                # Skip Analyze and Plan phases for better performance
                is_simple_query = self._is_simple_conversational_query(message)
                
                if is_simple_query:
                    logger.debug(f"[{request_id}] Using fast path for simple query")
                    
                    # Skip directly to RESPOND phase
                    response_chunks = []
                    async for response_chunk in self._respond_simple(
                        message=message,
                        context=context,
                        stream=stream
                    ):
                        response_chunks.append(response_chunk)
                    
                    execution_time = (datetime.now() - start_time).total_seconds()
                    logger.info(
                        f"[{request_id}] Message processing complete (fast path) in {execution_time:.2f}s"
                    )
                    
                    # Cache simple responses
                    if len(response_chunks) > 0:
                        self.request_cache.set(
                            query=message,
                            response=response_chunks[0],
                            context=cache_context,
                            ttl_seconds=300
                        )
                    
                    return response_chunks
                
                # FULL ReAct PATH: For complex queries requiring tools
                # PHASE 1: ANALYZE
                logger.debug(f"[{request_id}] Starting ANALYZE phase")
                analysis = await self._analyze(message, context)
                logger.info(
                    f"[{request_id}] Analysis complete: intent={analysis.intent}, "
                    f"confidence={analysis.confidence:.2f}"
                )
                
                # PHASE 2: PLAN
                logger.debug(f"[{request_id}] Starting PLAN phase")
                plan = await self._plan(analysis, context)
                logger.info(
                    f"[{request_id}] Plan complete: tools={plan.tools_to_use}, "
                    f"strategy={plan.execution_strategy}"
                )
                
                # PHASE 3: ACT
                logger.debug(f"[{request_id}] Starting ACT phase")
                results = await self._act(plan, context)
                logger.info(
                    f"[{request_id}] Action complete: success={results.success}, "
                    f"tools_executed={len(results.tool_results)}"
                )
                
                # PHASE 4: RESPOND
                logger.debug(f"[{request_id}] Starting RESPOND phase")
                response_chunks = []
                async for response_chunk in self._respond(
                    analysis=analysis,
                    plan=plan,
                    results=results,
                    context=context,
                    stream=stream
                ):
                    response_chunks.append(response_chunk)
                
                # Store interaction in memory
                logger.debug(f"[{request_id}] Storing interaction in memory")
                
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.info(
                    f"[{request_id}] Message processing complete in {execution_time:.2f}s"
                )
                
                # Cache the response if it's cacheable (no tool calls or simple queries)
                if len(response_chunks) > 0 and not plan.tools_to_use:
                    logger.debug(f"[{request_id}] Caching response")
                    # Cache the first/main response
                    self.request_cache.set(
                        query=message,
                        response=response_chunks[0],
                        context=cache_context,
                        ttl_seconds=300  # 5 minutes
                    )
                
                return response_chunks
                
            except Exception as e:
                logger.error(
                    f"[{request_id}] Error processing message: {e}",
                    exc_info=True
                )
                
                # Generate error response
                error_response = AgentResponse(
                    content=self._generate_error_message(e),
                    conversation_id=conversation_id,
                    metadata={
                        "request_id": request_id,
                        "error": str(e),
                        "error_type": type(e).__name__
                    },
                    timestamp=datetime.now()
                )
                
                return [error_response]
        
        # Track request with progress indicator
        async for item in self.progress_indicator.track_request(
            request_id=request_id,
            operation=_process_internal
        ):
            # Check if it's a progress update or actual response
            if isinstance(item, ProgressUpdate):
                # Yield progress update as a special response
                progress_response = AgentResponse(
                    content="",
                    conversation_id=conversation_id,
                    metadata={
                        "request_id": request_id,
                        "progress": item.to_dict(),
                        "is_progress_update": True
                    },
                    timestamp=item.timestamp
                )
                yield progress_response
            else:
                # Yield actual response chunks
                for response in item:
                    yield response
    
    async def _analyze(self, message: str, context: Context) -> Analysis:
        """
        Analyze user intent and identify required information.
        
        This phase parses the user's message to understand:
        - What they want to accomplish (intent)
        - What information is needed to fulfill the request
        - Key entities mentioned (skills, locations, roles, etc.)
        - Confidence in the analysis
        
        Args:
            message: User's input message
            context: Processing context with memory
            
        Returns:
            Analysis with intent, required info, and entities
            
        **Validates: Requirements 7.2**
        """
        logger.debug(f"Analyzing message: {message[:100]}...")
        
        # Build analysis prompt with memory context
        memory_context = self._format_memory_context(context.memory_entries)
        
        analysis_prompt = f"""Analyze the following user message and determine their intent.

User message: "{message}"

Recent conversation context:
{memory_context}

Identify:
1. Primary intent (what does the user want?)
2. Required information (what data/tools are needed?)
3. Key entities (skills, locations, roles, companies, etc.)
4. Confidence level (0.0-1.0)

Respond in JSON format:
{{
  "intent": "brief description of user's goal",
  "required_information": ["info1", "info2"],
  "entities": {{"entity_type": "value"}},
  "confidence": 0.85
}}

Common intents:
- find_opportunities: User wants job/project/gig recommendations (use mcp_get_job_matches)
- find_collaborators: User wants to find team members (use mcp_search_community_posts)
- interview_prep: User wants interview practice or questions
- document_help: User wants to upload/submit documents
- career_advice: User wants general career guidance (may need mcp_get_user_context, mcp_get_user_skills)
- learning_recommendations: User wants course suggestions (use mcp_get_user_learning)
- project_help: User wants project ideas or feedback (use mcp_get_user_projects)
- skill_assessment: User wants to know their skills (use mcp_get_user_skills)
- profile_inquiry: User asks about their profile (use mcp_get_user_context)
- clarification_needed: User's request is unclear

Required information examples:
- "user_profile": Need user context from MCP
- "user_skills": Need skills data from MCP
- "user_learning": Need learning progress from MCP
- "user_projects": Need project data from MCP
- "job_matches": Need job recommendations from MCP
- "community_posts": Need community content from MCP"""

        # Generate analysis using LLM
        response_chunks = []
        async for chunk in self.llm_orchestrator.generate(
            prompt=analysis_prompt,
            system_prompt=get_analysis_prompt(),
            temperature=0.3,  # Lower temperature for more consistent analysis
            max_tokens=512
        ):
            response_chunks.append(chunk)
        
        response_text = "".join(response_chunks)
        
        # Parse JSON response
        analysis_data = self._parse_json_response(response_text)
        
        return Analysis(
            intent=analysis_data.get("intent", "unknown"),
            required_information=analysis_data.get("required_information", []),
            entities=analysis_data.get("entities", {}),
            confidence=float(analysis_data.get("confidence", 0.5))
        )
    
    async def _plan(self, analysis: Analysis, context: Context) -> ActionPlan:
        """
        Plan which tools to use and in what order.
        
        This phase determines:
        - Which tools are needed to fulfill the request
        - What parameters to pass to each tool
        - Whether tools should run sequentially or in parallel
        - Reasoning for the chosen plan
        
        Args:
            analysis: Result from analyze phase
            context: Processing context
            
        Returns:
            ActionPlan with tools, parameters, and strategy
            
        **Validates: Requirements 7.3**
        """
        logger.debug(f"Planning actions for intent: {analysis.intent}")
        
        # Get available tools
        available_tools = self.tool_registry.list_tools()
        tools_description = "\n".join([
            f"- {tool.name}: {tool.description}"
            for tool in available_tools
        ])
        
        planning_prompt = f"""Based on the user's intent, plan which tools to use.

Intent: {analysis.intent}
Required information: {', '.join(analysis.required_information)}
Entities: {json.dumps(analysis.entities)}
User ID: {context.user_id}

Available tools:
{tools_description}

IMPORTANT: MCP tools (prefixed with 'mcp_') provide access to user data from the backend:
- mcp_get_user_context: Get user profile (name, role, skills, experience, location, subscription)
- mcp_get_user_skills: Get detailed skills with proficiency levels
- mcp_get_user_learning: Get course enrollments and learning progress
- mcp_get_user_projects: Get user's project portfolio
- mcp_search_community_posts: Search public community posts
- mcp_get_job_matches: Get job opportunities matching user skills

All MCP tools require user_id parameter. Always include {{"user_id": "{context.user_id}"}} in tool parameters.

Determine:
1. Which tools to use (in order)
2. Parameters for each tool (MUST include user_id for MCP tools)
3. Execution strategy (sequential or parallel)
4. Reasoning for this plan

Respond in JSON format:
{{
  "tools_to_use": ["tool1", "tool2"],
  "tool_parameters": {{
    "tool1": {{"user_id": "{context.user_id}", "param": "value"}},
    "tool2": {{"user_id": "{context.user_id}", "param": "value"}}
  }},
  "execution_strategy": "sequential",
  "reasoning": "explanation of why this plan"
}}

Guidelines:
- Use mcp_get_user_context first if user profile data is needed
- Use mcp_get_user_skills for skill-based recommendations
- Use mcp_get_user_learning for course/learning recommendations
- Use mcp_get_user_projects for project-related queries
- Use mcp_get_job_matches for job search requests
- Use mcp_search_community_posts for community content searches
- Use parallel execution only if tools are independent
- If no tools needed, return empty tools_to_use array
- ALWAYS include user_id in parameters for MCP tools"""

        # Generate plan using LLM
        response_chunks = []
        async for chunk in self.llm_orchestrator.generate(
            prompt=planning_prompt,
            system_prompt=get_planning_prompt(),
            temperature=0.3,
            max_tokens=512
        ):
            response_chunks.append(chunk)
        
        response_text = "".join(response_chunks)
        
        # Parse JSON response
        plan_data = self._parse_json_response(response_text)
        
        return ActionPlan(
            tools_to_use=plan_data.get("tools_to_use", []),
            tool_parameters=plan_data.get("tool_parameters", {}),
            execution_strategy=plan_data.get("execution_strategy", "sequential"),
            reasoning=plan_data.get("reasoning", "No reasoning provided")
        )
    
    async def _act(self, plan: ActionPlan, context: Context) -> ActionResults:
        """
        Execute planned actions using tools.
        
        This phase executes the tool calls specified in the plan with:
        - Error handling for each tool
        - Timeout protection
        - Retry logic (handled by ToolRegistry)
        - Result validation
        - Parallel execution for independent tools
        
        Args:
            plan: Action plan from plan phase
            context: Processing context
            
        Returns:
            ActionResults with tool results and success status
            
        **Validates: Requirements 7.4, 10.5**
        """
        logger.debug(
            f"Executing {len(plan.tools_to_use)} tools with "
            f"{plan.execution_strategy} strategy"
        )
        
        tool_results: Dict[str, ToolResult] = {}
        errors: List[str] = []
        
        if not plan.tools_to_use:
            # No tools to execute
            logger.debug("No tools to execute")
            return ActionResults(
                tool_results={},
                success=True,
                errors=[]
            )
        
        # Execute tools based on strategy
        if plan.execution_strategy == "parallel":
            # Execute tools in parallel using ParallelExecutor
            logger.info(f"Executing {len(plan.tools_to_use)} tools in parallel")
            
            async def execute_tool(tool_name: str) -> tuple[str, ToolResult]:
                """Execute a single tool and return name with result."""
                parameters = plan.tool_parameters.get(tool_name, {})
                logger.debug(f"Executing tool: {tool_name} with params: {parameters}")
                
                result = await self.tool_registry.execute_tool(
                    tool_name=tool_name,
                    parameters=parameters,
                    timeout_seconds=30
                )
                return (tool_name, result)
            
            # Create callables for each tool
            tool_operations = [
                lambda tn=tool_name: execute_tool(tn)
                for tool_name in plan.tools_to_use
            ]
            
            # Execute in parallel with concurrency limit
            results = await ParallelExecutor.execute_parallel(
                operations=tool_operations,
                max_concurrent=5  # Limit concurrent tool executions
            )
            
            # Process results
            for result in results:
                if isinstance(result, Exception):
                    error_msg = f"Tool execution failed: {str(result)}"
                    errors.append(error_msg)
                    logger.error(error_msg)
                else:
                    tool_name, tool_result = result
                    tool_results[tool_name] = tool_result
                    
                    if not tool_result.success:
                        errors.append(
                            f"Tool {tool_name} failed: {tool_result.error}"
                        )
        
        else:
            # Execute tools sequentially
            logger.info(f"Executing {len(plan.tools_to_use)} tools sequentially")
            
            for tool_name in plan.tools_to_use:
                try:
                    parameters = plan.tool_parameters.get(tool_name, {})
                    
                    logger.debug(
                        f"Executing tool: {tool_name} with params: {parameters}"
                    )
                    
                    result = await self.tool_registry.execute_tool(
                        tool_name=tool_name,
                        parameters=parameters,
                        timeout_seconds=30
                    )
                    
                    tool_results[tool_name] = result
                    
                    if not result.success:
                        error_msg = f"Tool {tool_name} failed: {result.error}"
                        errors.append(error_msg)
                        logger.warning(error_msg)
                        
                        # Continue with other tools even if one fails
                        # This allows partial results
                
                except Exception as e:
                    error_msg = f"Tool {tool_name} execution error: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg, exc_info=True)
        
        # Determine overall success
        # Success if at least one tool succeeded or no tools were needed
        success = (
            len(tool_results) > 0 and
            any(result.success for result in tool_results.values())
        ) or len(plan.tools_to_use) == 0
        
        logger.info(
            f"Action execution complete: success={success}, "
            f"tools_executed={len(tool_results)}, errors={len(errors)}"
        )
        
        return ActionResults(
            tool_results=tool_results,
            success=success,
            errors=errors
        )
    
    async def _respond(
        self,
        analysis: Analysis,
        plan: ActionPlan,
        results: ActionResults,
        context: Context,
        stream: bool
    ) -> AsyncIterator[AgentResponse]:
        """
        Generate final response using LLM.
        
        This phase synthesizes all information into a natural language response:
        - Combines tool results with context
        - Generates user-friendly explanation
        - Provides actionable recommendations
        - Handles errors gracefully
        
        Args:
            analysis: Analysis from analyze phase
            plan: Plan from plan phase
            results: Results from act phase
            context: Processing context
            stream: Whether to stream response
            
        Yields:
            AgentResponse chunks if streaming, or complete response
            
        **Validates: Requirements 7.5**
        """
        logger.debug("Generating response")
        
        # Build response prompt with all context
        tool_results_summary = self._format_tool_results(results.tool_results)
        memory_context = self._format_memory_context(context.memory_entries)
        user_context = context.metadata.get("user_context", {})
        
        # Format user context for prompt
        user_context_str = self._format_user_context(user_context)
        
        # Extract user name for personalization
        user_name = user_context.get('name', 'there') if user_context else 'there'
        
        response_prompt = f"""Generate a helpful response to the user based on the following information.

User's message: "{context.message}"

{user_context_str}

Analysis:
- Intent: {analysis.intent}
- Confidence: {analysis.confidence:.2f}

Action plan:
- Tools used: {', '.join(plan.tools_to_use) if plan.tools_to_use else 'None'}
- Reasoning: {plan.reasoning}

Tool results:
{tool_results_summary}

Errors (if any):
{chr(10).join(f'- {error}' for error in results.errors) if results.errors else 'None'}

Recent conversation context:
{memory_context}

IMPORTANT: Always address the user by their name "{user_name}" from the profile above. Start your response with "Hello {user_name}" or "Hi {user_name}".

Generate a response that:
1. Directly addresses the user's request
2. Presents tool results in a clear, actionable way
3. Provides specific recommendations or next steps
4. Acknowledges any limitations or errors honestly
5. Maintains a professional but friendly tone
6. References previous conversation context when relevant
7. Uses the user's actual name "{user_name}" and profile information for personalization

If tools failed or no results were found, explain why and suggest alternatives."""

        # Generate response using LLM
        response_content = []
        
        async for chunk in self.llm_orchestrator.generate(
            prompt=response_prompt,
            system_prompt=self.system_prompt,
            temperature=0.7,
            max_tokens=2048,
            stream=stream
        ):
            response_content.append(chunk)
            
            if stream:
                # Yield streaming chunk
                yield AgentResponse(
                    content=chunk,
                    conversation_id=context.conversation_id,
                    metadata={
                        "request_id": context.metadata.get("request_id"),
                        "streaming": True
                    },
                    timestamp=datetime.now()
                )
        
        # Build complete response
        full_response = "".join(response_content)
        
        # Build metadata
        metadata = {
            "request_id": context.metadata.get("request_id"),
            "intent": analysis.intent,
            "confidence": analysis.confidence,
            "tools_used": plan.tools_to_use,
            "tool_results": {
                name: {
                    "success": result.success,
                    "execution_time_ms": result.execution_time_ms
                }
                for name, result in results.tool_results.items()
            },
            "errors": results.errors,
            "streaming": False
        }
        
        # Store interaction in memory
        await self.memory_system.store_interaction(
            user_id=context.user_id,
            conversation_id=context.conversation_id,
            user_message=context.message,
            agent_response=full_response,
            metadata=metadata
        )
        
        if not stream:
            # Yield complete response
            yield AgentResponse(
                content=full_response,
                conversation_id=context.conversation_id,
                metadata=metadata,
                timestamp=datetime.now()
            )
    
    def _format_memory_context(self, memory_entries: List[Any]) -> str:
        """Format memory entries for prompt context."""
        if not memory_entries:
            return "No previous context"
        
        formatted = []
        for entry in memory_entries[:3]:  # Limit to 3 most relevant
            formatted.append(
                f"User: {entry.user_message}\n"
                f"Agent: {entry.agent_response}"
            )
        
        return "\n\n".join(formatted)
    
    def _format_user_context(self, user_context: Optional[Dict[str, Any]]) -> str:
        """
        Format user context for prompt inclusion.
        
        Args:
            user_context: User profile information from MCP server
            
        Returns:
            Formatted string with user context
        """
        if not user_context:
            return "User profile: Not available"
        
        # Extract key information
        name = user_context.get('name', 'User')
        role = user_context.get('role', 'Unknown')
        skills = user_context.get('skills', [])
        experience_level = user_context.get('experienceLevel', 'Unknown')
        location = user_context.get('location', 'Unknown')
        subscription_tier = user_context.get('subscriptionTier', 'free')
        
        # Format skills list
        skills_str = ', '.join(skills[:5]) if skills else 'None listed'
        if len(skills) > 5:
            skills_str += f' (and {len(skills) - 5} more)'
        
        return f"""User profile:
- Name: {name}
- Role: {role}
- Experience Level: {experience_level}
- Skills: {skills_str}
- Location: {location}
- Subscription: {subscription_tier}"""
    
    def _format_tool_results(self, tool_results: Dict[str, ToolResult]) -> str:
        """Format tool results for prompt context."""
        if not tool_results:
            return "No tools were executed"
        
        formatted = []
        for tool_name, result in tool_results.items():
            if result.success:
                # Format successful result
                data_summary = str(result.data)[:500]  # Limit length
                formatted.append(
                    f"Tool: {tool_name}\n"
                    f"Status: Success\n"
                    f"Data: {data_summary}"
                )
            else:
                # Format error
                formatted.append(
                    f"Tool: {tool_name}\n"
                    f"Status: Failed\n"
                    f"Error: {result.error}"
                )
        
        return "\n\n".join(formatted)
    
    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON from LLM response, handling markdown code blocks."""
        import re
        
        # Try to extract JSON from markdown code block
        json_match = re.search(
            r'```(?:json)?\s*(\{.*?\})\s*```',
            response_text,
            re.DOTALL
        )
        
        if json_match:
            json_text = json_match.group(1)
        else:
            # Try to find JSON object directly
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                logger.warning(f"Could not extract JSON from response: {response_text[:200]}")
                return {}
        
        try:
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return {}
    
    def _generate_error_message(self, error: Exception) -> str:
        """Generate user-friendly error message."""
        error_type = type(error).__name__
        
        if "timeout" in str(error).lower():
            return (
                "I'm sorry, but my response is taking longer than expected. "
                "Please try again in a moment."
            )
        elif "rate limit" in str(error).lower():
            return (
                "I'm currently experiencing high demand. "
                "Please wait a moment and try again."
            )
        elif "authentication" in str(error).lower():
            return (
                "I'm having trouble connecting to my services. "
                "Please contact support if this persists."
            )
        else:
            return (
                "I encountered an unexpected issue while processing your request. "
                "Please try rephrasing your question or contact support if the problem continues."
            )
    
    def _is_simple_conversational_query(self, message: str) -> bool:
        """
        Determine if a query is simple conversational and doesn't need full ReAct.
        
        Simple queries include:
        - Greetings (hello, hi, hey)
        - General questions about the platform
        - Clarification requests
        - Simple factual questions
        
        Complex queries that need full ReAct:
        - Job search requests
        - Builder/collaborator matching
        - Document uploads
        - Interview preparation
        """
        message_lower = message.lower().strip()
        
        # Greetings and simple interactions
        simple_patterns = [
            'hello', 'hi', 'hey', 'good morning', 'good afternoon',
            'how are you', 'what can you do', 'help', 'what is',
            'tell me about', 'explain', 'who are you', 'what are you',
            'thanks', 'thank you', 'bye', 'goodbye'
        ]
        
        # Complex patterns that need tools
        complex_patterns = [
            'find job', 'search job', 'job opportunit', 'looking for work',
            'find builder', 'find collaborator', 'search developer',
            'upload', 'submit', 'resume', 'cv', 'portfolio',
            'interview prep', 'practice interview', 'mock interview',
            'match me', 'recommend', 'suggest project'
        ]
        
        # Check for complex patterns first
        for pattern in complex_patterns:
            if pattern in message_lower:
                return False
        
        # Check for simple patterns
        for pattern in simple_patterns:
            if pattern in message_lower:
                return True
        
        # Short messages are usually simple
        if len(message.split()) <= 5:
            return True
        
        # Default to simple for safety (can be adjusted based on usage)
        return True
    
    async def _respond_simple(
        self,
        message: str,
        context: Context,
        stream: bool
    ) -> AsyncIterator[AgentResponse]:
        """
        Generate a simple response without full ReAct cycle.
        
        This is used for conversational queries that don't require
        tool usage or complex reasoning.
        """
        logger.debug("Generating simple response (fast path)")
        
        # Build simple prompt with user context
        memory_context = self._format_memory_context(context.memory_entries)
        user_context = context.metadata.get("user_context", {})
        user_context_str = self._format_user_context(user_context)
        
        # Extract user name for personalization
        user_name = user_context.get('name', 'there') if user_context else 'there'
        
        simple_prompt = f"""You are Magna AI, a career assistant for the Magna platform with a fun, casual personality.

{user_context_str}

User's message: "{message}"

Previous context:
{memory_context if memory_context else "No previous context"}

IMPORTANT: Always greet the user by their actual name "{user_name}" from the profile above. Start your response with "Hey {user_name}!" or "What's up {user_name}!" Keep it casual and fun!

Provide a helpful, friendly response with personality. Keep it concise and conversational. Use emojis when appropriate 🚀.
If the user is asking about what you can do, mention:
- Finding job opportunities that match their vibe
- Connecting them with cool builders and collaborators
- Helping them crush interviews
- Managing career docs and making them shine

Use the user's actual name "{user_name}" and profile information to personalize your response. Keep it real and engaging!

Response:"""
        
        # Generate response
        response_text = ""
        async for chunk in self.llm_orchestrator.generate(
            prompt=simple_prompt,
            system_prompt=BASE_SYSTEM_PROMPT,
            stream=stream
        ):
            response_text += chunk
            
            # Yield chunk if streaming
            if stream:
                yield AgentResponse(
                    content=chunk,
                    conversation_id=context.conversation_id,
                    metadata={
                        "request_id": context.metadata.get("request_id"),
                        "fast_path": True
                    },
                    timestamp=datetime.now()
                )
        
        # Yield complete response if not streaming
        if not stream:
            yield AgentResponse(
                content=response_text,
                conversation_id=context.conversation_id,
                metadata={
                    "request_id": context.metadata.get("request_id"),
                    "fast_path": True
                },
                timestamp=datetime.now()
            )
