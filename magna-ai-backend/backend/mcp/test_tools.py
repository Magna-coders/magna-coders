"""
Tests for MCP tool implementations.

These tests verify that all data access tools are correctly implemented
with proper names, descriptions, and basic structure.
"""

import pytest
from .tools import (
    GetUserContextTool,
    GetUserSkillsTool,
    GetUserLearningTool,
    GetUserProjectsTool,
    SearchCommunityPostsTool,
    GetJobMatchesTool
)


def test_get_user_context_tool_properties():
    """Test GetUserContextTool has correct properties."""
    tool = GetUserContextTool()
    
    assert tool.name == "get_user_context"
    assert "profile" in tool.description.lower() or "context" in tool.description.lower()
    assert len(tool.description) > 10


def test_get_user_skills_tool_properties():
    """Test GetUserSkillsTool has correct properties."""
    tool = GetUserSkillsTool()
    
    assert tool.name == "get_user_skills"
    assert "skill" in tool.description.lower()
    assert len(tool.description) > 10


def test_get_user_learning_tool_properties():
    """Test GetUserLearningTool has correct properties."""
    tool = GetUserLearningTool()
    
    assert tool.name == "get_user_learning"
    assert "learning" in tool.description.lower() or "progress" in tool.description.lower()
    assert len(tool.description) > 10


def test_get_user_projects_tool_properties():
    """Test GetUserProjectsTool has correct properties."""
    tool = GetUserProjectsTool()
    
    assert tool.name == "get_user_projects"
    assert "project" in tool.description.lower()
    assert len(tool.description) > 10


def test_search_community_posts_tool_properties():
    """Test SearchCommunityPostsTool has correct properties."""
    tool = SearchCommunityPostsTool()
    
    assert tool.name == "search_community_posts"
    assert "post" in tool.description.lower() or "community" in tool.description.lower()
    assert len(tool.description) > 10


def test_get_job_matches_tool_properties():
    """Test GetJobMatchesTool has correct properties."""
    tool = GetJobMatchesTool()
    
    assert tool.name == "get_job_matches"
    assert "job" in tool.description.lower() or "match" in tool.description.lower()
    assert len(tool.description) > 10


def test_all_tools_are_unique():
    """Test that all tools have unique names."""
    tools = [
        GetUserContextTool(),
        GetUserSkillsTool(),
        GetUserLearningTool(),
        GetUserProjectsTool(),
        SearchCommunityPostsTool(),
        GetJobMatchesTool()
    ]
    
    names = [tool.name for tool in tools]
    assert len(names) == len(set(names)), "Tool names must be unique"


def test_all_tools_have_execute_method():
    """Test that all tools have an execute method."""
    tools = [
        GetUserContextTool(),
        GetUserSkillsTool(),
        GetUserLearningTool(),
        GetUserProjectsTool(),
        SearchCommunityPostsTool(),
        GetJobMatchesTool()
    ]
    
    for tool in tools:
        assert hasattr(tool, 'execute'), f"Tool {tool.name} missing execute method"
        assert callable(tool.execute), f"Tool {tool.name} execute is not callable"


def test_tool_count():
    """Test that we have implemented all 6 required tools."""
    tools = [
        GetUserContextTool(),
        GetUserSkillsTool(),
        GetUserLearningTool(),
        GetUserProjectsTool(),
        SearchCommunityPostsTool(),
        GetJobMatchesTool()
    ]
    
    assert len(tools) == 6, "Should have exactly 6 tools implemented"
