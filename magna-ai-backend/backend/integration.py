"""
Integration module for wiring all Magna AI Agent components together.

This module initializes and connects:
- LLM Orchestrator with multi-provider support
- Memory System with hybrid storage
- Tool Registry with all built-in tools
- Opportunity and Collaboration Matchers
- Interview Preparation Module
- Document Management and Consent System
- Agent Core with ReAct pattern
"""

from typing import Optional
import asyncio

from .config import settings
from .utils.logging import get_logger

# LLM Components
from .llm.orchestrator import LLMOrchestrator
from .llm.providers import GeminiProvider, GPT4Provider, OllamaProvider
from .llm.factory import create_llm_orchestrator

# Memory Components
from .memory.system import MemorySystem
from .memory.storage import FileStorageBackend
from .memory.embeddings import EmbeddingModel

# Tool Components
from .tools.base import ToolRegistry
from .tools.web_search_tool import WebSearchTool
from .tools.profile_retrieval_tool import ProfileRetrievalTool
from .tools.opportunity_match_tool import OpportunityMatchTool
from .tools.document_upload_tool import DocumentUploadTool

# Matching Components
from .matching.opportunity import OpportunityMatcher
from .matching.collaboration import CollaborationMatcher

# Interview Preparation
from .interview.preparation import InterviewPreparationModule

# Document Management
from .documents.manager import DocumentManager
from .documents.consent import ConsentManager

# Agent Core
from .agent.core import MagnaAgent
from .agent.prompts import BASE_SYSTEM_PROMPT

# MCP Server
from .mcp.server import MagnaBackendMCPServer
from .mcp.tools import (
    GetUserContextTool,
    GetUserSkillsTool,
    GetUserLearningTool,
    GetUserProjectsTool,
    SearchCommunityPostsTool,
    GetJobMatchesTool
)

# Analytics
from .analytics.tracker import AnalyticsTracker
from .analytics.alerting import QualityAlerter

logger = get_logger(__name__)


class MagnaAIIntegration:
    """
    Central integration class that wires all components together.
    
    This class manages the lifecycle of all components and provides
    a single entry point for accessing the fully configured agent.
    """
    
    def __init__(self):
        """Initialize integration (components created on demand)."""
        self._llm_orchestrator: Optional[LLMOrchestrator] = None
        self._memory_system: Optional[MemorySystem] = None
        self._tool_registry: Optional[ToolRegistry] = None
        self._opportunity_matcher: Optional[OpportunityMatcher] = None
        self._collaboration_matcher: Optional[CollaborationMatcher] = None
        self._interview_module: Optional[InterviewPreparationModule] = None
        self._document_manager: Optional[DocumentManager] = None
        self._consent_manager: Optional[ConsentManager] = None
        self._mcp_server: Optional[MagnaBackendMCPServer] = None
        self._agent: Optional[MagnaAgent] = None
        self._analytics_tracker: Optional[AnalyticsTracker] = None
        self._quality_alerter: Optional[QualityAlerter] = None
        self._initialized = False
    
    async def initialize(self) -> None:
        """
        Initialize all components and wire them together.
        
        This method should be called during application startup.
        """
        if self._initialized:
            logger.warning("Integration already initialized")
            return
        
        logger.info("Initializing Magna AI Agent components...")
        
        try:
            # 1. Initialize LLM Orchestrator
            logger.info("Initializing LLM Orchestrator...")
            self._llm_orchestrator = await self._create_llm_orchestrator()
            
            # 2. Initialize Memory System
            logger.info("Initializing Memory System...")
            self._memory_system = await self._create_memory_system()
            
            # 3. Initialize Tool Registry
            logger.info("Initializing Tool Registry...")
            self._tool_registry = await self._create_tool_registry()
            
            # 4. Initialize Matchers
            logger.info("Initializing Opportunity Matcher...")
            self._opportunity_matcher = await self._create_opportunity_matcher()
            
            logger.info("Initializing Collaboration Matcher...")
            self._collaboration_matcher = await self._create_collaboration_matcher()
            
            # 5. Initialize Interview Preparation
            logger.info("Initializing Interview Preparation Module...")
            self._interview_module = await self._create_interview_module()
            
            # 6. Initialize Document Management
            logger.info("Initializing Document Management...")
            self._document_manager, self._consent_manager = await self._create_document_management()
            
            # 7. Initialize MCP Server
            logger.info("Initializing MCP Server...")
            self._mcp_server = await self._create_mcp_server()
            
            # 8. Initialize Analytics
            if settings.enable_analytics:
                logger.info("Initializing Analytics...")
                self._analytics_tracker, self._quality_alerter = await self._create_analytics()
            
            # 9. Initialize Agent Core
            logger.info("Initializing Agent Core...")
            self._agent = await self._create_agent()
            
            self._initialized = True
            logger.info("Magna AI Agent initialization complete!")
            
        except Exception as e:
            logger.error(f"Failed to initialize Magna AI Agent: {e}", exc_info=True)
            raise
    
    async def shutdown(self) -> None:
        """
        Cleanup and shutdown all components.
        
        This method should be called during application shutdown.
        """
        if not self._initialized:
            return
        
        logger.info("Shutting down Magna AI Agent components...")
        
        try:
            # Cleanup in reverse order
            if self._agent:
                logger.info("Shutting down Agent Core...")
                # Agent cleanup if needed
            
            if self._memory_system:
                logger.info("Shutting down Memory System...")
                # Memory cleanup if needed
            
            if self._llm_orchestrator:
                logger.info("Shutting down LLM Orchestrator...")
                # LLM cleanup if needed
            
            self._initialized = False
            logger.info("Magna AI Agent shutdown complete")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {e}", exc_info=True)
    
    async def _create_llm_orchestrator(self) -> LLMOrchestrator:
        """Create and configure LLM Orchestrator with all providers."""
        # Use factory to create orchestrator with configured providers
        orchestrator = create_llm_orchestrator(settings)
        
        # Verify at least one provider is available
        status = orchestrator.get_provider_status()
        available = [name for name, s in status.items() if s.get("status") == "healthy"]
        
        if not available:
            logger.warning("No healthy LLM providers available, but continuing startup")
        else:
            logger.info(f"LLM providers available: {available}")
        
        return orchestrator
    
    async def _create_memory_system(self) -> MemorySystem:
        """Create and configure Memory System."""
        # Create storage backend (file-based storage)
        storage = FileStorageBackend(storage_dir="./memory_storage")
        
        # Create shared embedding model (use SentenceTransformer)
        # This will be reused by matchers to avoid loading twice
        from .memory.embeddings import SentenceTransformerEmbedding
        if not hasattr(self, '_shared_embedding_model'):
            self._shared_embedding_model = SentenceTransformerEmbedding()
        
        # Create memory system
        memory_system = MemorySystem(
            storage_backend=storage,
            embedding_model=self._shared_embedding_model,
            max_size_mb=settings.max_memory_size_mb
        )
        
        return memory_system
    
    async def _create_tool_registry(self) -> ToolRegistry:
        """Create and register all built-in tools."""
        registry = ToolRegistry()
        
        # Register Web Search Tool
        if settings.serpapi_api_key:
            web_search_tool = WebSearchTool(api_key=settings.serpapi_api_key)
            registry.register_tool(web_search_tool)
            logger.info("Registered WebSearchTool")
        else:
            logger.warning("SerpAPI key not configured, WebSearchTool disabled")
        
        # Register Profile Retrieval Tool
        profile_tool = ProfileRetrievalTool(
            backend_url="http://localhost:5000/api"  # Existing Magna backend
        )
        registry.register_tool(profile_tool)
        logger.info("Registered ProfileRetrievalTool")
        
        # Register Opportunity Match Tool
        opportunity_tool = OpportunityMatchTool(
            backend_url="http://localhost:5000/api"
        )
        registry.register_tool(opportunity_tool)
        logger.info("Registered OpportunityMatchTool")
        
        # Register Document Upload Tool
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            document_tool = DocumentUploadTool(
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                aws_region=settings.aws_region,
                s3_bucket_name=settings.s3_bucket_name
            )
            registry.register_tool(document_tool)
            logger.info("Registered DocumentUploadTool")
        else:
            logger.warning("AWS credentials not configured, DocumentUploadTool disabled")
        
        logger.info(f"Tool registry initialized with {len(registry.list_tools())} tools")
        return registry
    
    async def _create_opportunity_matcher(self) -> OpportunityMatcher:
        """Create and configure Opportunity Matcher."""
        matcher = OpportunityMatcher(
            min_match_score=0.7
        )
        return matcher
    
    async def _create_collaboration_matcher(self) -> CollaborationMatcher:
        """Create and configure Collaboration Matcher."""
        # Reuse shared embedding model to avoid loading twice
        if not hasattr(self, '_shared_embedding_model'):
            from .memory.embeddings import SentenceTransformerEmbedding
            self._shared_embedding_model = SentenceTransformerEmbedding()
        
        matcher = CollaborationMatcher(
            embedding_model=self._shared_embedding_model
        )
        
        return matcher
    
    async def _create_interview_module(self) -> InterviewPreparationModule:
        """Create and configure Interview Preparation Module."""
        module = InterviewPreparationModule(
            llm_orchestrator=self._llm_orchestrator
        )
        return module
    
    async def _create_document_management(self):
        """Create and configure Document Manager and Consent Manager."""
        # Create Consent Manager first
        consent_manager = ConsentManager()
        
        # Create DocumentUploadTool if AWS credentials are configured
        upload_tool = None
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            upload_tool = DocumentUploadTool(
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                aws_region=settings.aws_region,
                s3_bucket_name=settings.s3_bucket_name
            )
            logger.info("DocumentUploadTool initialized with AWS S3")
        else:
            logger.warning("AWS credentials not configured, DocumentUploadTool will use defaults")
        
        # Create Document Manager
        document_manager = DocumentManager(
            upload_tool=upload_tool,
            consent_manager=consent_manager,
            max_file_size_mb=10
        )
        
        return document_manager, consent_manager
    
    async def _create_mcp_server(self) -> MagnaBackendMCPServer:
        """Create and configure MCP Server with all tools."""
        # Create MCP server
        mcp_server = MagnaBackendMCPServer(
            backend_url=settings.backend_api_url,
            api_key=settings.backend_api_key
        )
        
        # Register all MCP tools
        mcp_server.register_tool(GetUserContextTool())
        mcp_server.register_tool(GetUserSkillsTool())
        mcp_server.register_tool(GetUserLearningTool())
        mcp_server.register_tool(GetUserProjectsTool())
        mcp_server.register_tool(SearchCommunityPostsTool())
        mcp_server.register_tool(GetJobMatchesTool())
        
        # Initialize the server
        await mcp_server.initialize()
        
        logger.info(f"MCP Server initialized with {len(mcp_server.tools)} tools")
        return mcp_server
    
    async def _create_analytics(self):
        """Create and configure Analytics components."""
        # AnalyticsTracker accepts storage_backend, not database_url
        # For now, pass None to use in-memory storage
        tracker = AnalyticsTracker(storage_backend=None)
        alerter = QualityAlerter(
            analytics_tracker=tracker,
            satisfaction_threshold=0.8,
            alert_callback=None
        )
        return tracker, alerter
    
    async def _create_agent(self) -> MagnaAgent:
        """Create and configure the main Agent Core."""
        agent = MagnaAgent(
            llm_orchestrator=self._llm_orchestrator,
            memory_system=self._memory_system,
            tool_registry=self._tool_registry,
            system_prompt=BASE_SYSTEM_PROMPT,
            opportunity_matcher=self._opportunity_matcher,
            collaboration_matcher=self._collaboration_matcher,
            interview_module=self._interview_module,
            document_manager=self._document_manager,
            consent_manager=self._consent_manager,
            mcp_server=self._mcp_server
        )
        
        logger.info("Agent initialized with MCP server integration")
        return agent
    
    # Public accessors
    
    @property
    def agent(self) -> MagnaAgent:
        """Get the configured agent instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._agent
    
    @property
    def llm_orchestrator(self) -> LLMOrchestrator:
        """Get the LLM orchestrator instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._llm_orchestrator
    
    @property
    def memory_system(self) -> MemorySystem:
        """Get the memory system instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._memory_system
    
    @property
    def tool_registry(self) -> ToolRegistry:
        """Get the tool registry instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._tool_registry
    
    @property
    def opportunity_matcher(self) -> OpportunityMatcher:
        """Get the opportunity matcher instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._opportunity_matcher
    
    @property
    def collaboration_matcher(self) -> CollaborationMatcher:
        """Get the collaboration matcher instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._collaboration_matcher
    
    @property
    def document_manager(self) -> DocumentManager:
        """Get the document manager instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._document_manager
    
    @property
    def consent_manager(self) -> ConsentManager:
        """Get the consent manager instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._consent_manager
    
    @property
    def mcp_server(self) -> MagnaBackendMCPServer:
        """Get the MCP server instance."""
        if not self._initialized:
            raise RuntimeError("Integration not initialized. Call initialize() first.")
        return self._mcp_server


# Global integration instance
_integration: Optional[MagnaAIIntegration] = None


async def get_integration() -> MagnaAIIntegration:
    """
    Get the global integration instance.
    
    Returns:
        Initialized MagnaAIIntegration instance
        
    Raises:
        RuntimeError: If integration not initialized
    """
    global _integration
    
    if _integration is None:
        raise RuntimeError("Integration not initialized. Call initialize_integration() first.")
    
    return _integration


async def initialize_integration() -> MagnaAIIntegration:
    """
    Initialize the global integration instance.
    
    This should be called during application startup.
    
    Returns:
        Initialized MagnaAIIntegration instance
    """
    global _integration
    
    if _integration is not None:
        logger.warning("Integration already initialized")
        return _integration
    
    _integration = MagnaAIIntegration()
    await _integration.initialize()
    
    return _integration


async def shutdown_integration() -> None:
    """
    Shutdown the global integration instance.
    
    This should be called during application shutdown.
    """
    global _integration
    
    if _integration is not None:
        await _integration.shutdown()
        _integration = None
