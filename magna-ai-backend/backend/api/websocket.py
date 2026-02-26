"""
WebSocket endpoints for real-time chat with Magna AI Agent.
"""

import json
import uuid
from typing import Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError, jwt

from ..config import settings
from ..agent.core import MagnaAgent
from ..utils.logging import get_logger

logger = get_logger(__name__)

# Create router
router = APIRouter()


class ConnectionManager:
    """Manage WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"WebSocket connected for user {user_id}")
    
    def disconnect(self, user_id: str):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_message(self, user_id: str, message: dict):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)
    
    async def send_text(self, user_id: str, text: str):
        """Send text to a specific user."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(text)


# Global connection manager
manager = ConnectionManager()


def authenticate_websocket(token: str) -> Optional[str]:
    """
    Authenticate WebSocket connection using JWT token.
    
    Args:
        token: JWT token from query parameter
        
    Returns:
        User ID if authentication successful, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"]
        )
        user_id: str = payload.get("sub")
        return user_id
    except JWTError as e:
        logger.warning(f"WebSocket authentication failed: {e}")
        return None


# TODO: Replace with actual agent initialization
def get_agent() -> MagnaAgent:
    """Get or create MagnaAgent instance."""
    raise NotImplementedError("Agent initialization not yet implemented")


@router.websocket("/ws/chat")
async def websocket_chat(
    websocket: WebSocket,
    token: str = Query(..., description="JWT authentication token")
):
    """
    WebSocket endpoint for real-time chat with AI agent.
    
    Protocol:
    - Client sends: {"type": "message", "message": "...", "conversation_id": "..."}
    - Server sends: {"type": "chunk", "content": "..."} (streaming chunks)
    - Server sends: {"type": "done"} (completion signal)
    - Server sends: {"type": "error", "error": "..."} (error notification)
    
    Args:
        websocket: WebSocket connection
        token: JWT authentication token from query parameter
        
    Connection Flow:
    1. Client connects with JWT token
    2. Server authenticates and accepts connection
    3. Client sends messages
    4. Server streams responses
    5. Connection maintained until client disconnects
    """
    # Authenticate user
    user_id = authenticate_websocket(token)
    
    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Accept connection
    await manager.connect(websocket, user_id)
    
    try:
        # Get agent instance
        agent = get_agent()
        
        while True:
            # Receive message from client
            try:
                data = await websocket.receive_json()
            except json.JSONDecodeError:
                await manager.send_message(user_id, {
                    "type": "error",
                    "error": "Invalid JSON format"
                })
                continue
            
            # Validate message format
            if not isinstance(data, dict) or "type" not in data:
                await manager.send_message(user_id, {
                    "type": "error",
                    "error": "Invalid message format. Expected {type: ..., ...}"
                })
                continue
            
            message_type = data.get("type")
            
            if message_type == "message":
                # Process chat message
                message = data.get("message")
                conversation_id = data.get("conversation_id") or str(uuid.uuid4())
                
                if not message:
                    await manager.send_message(user_id, {
                        "type": "error",
                        "error": "Message content is required"
                    })
                    continue
                
                try:
                    # Send conversation ID first
                    await manager.send_message(user_id, {
                        "type": "conversation_id",
                        "conversation_id": conversation_id
                    })
                    
                    # Stream agent response
                    async for chunk in agent.process_message(
                        user_id=user_id,
                        message=message,
                        conversation_id=conversation_id,
                        stream=True
                    ):
                        # Send chunk to client
                        await manager.send_message(user_id, {
                            "type": "chunk",
                            "content": chunk.content
                        })
                        
                        # Send tool calls if present
                        if chunk.tool_calls:
                            await manager.send_message(user_id, {
                                "type": "tool_calls",
                                "tool_calls": chunk.tool_calls
                            })
                        
                        # Send results if present
                        if chunk.results:
                            await manager.send_message(user_id, {
                                "type": "results",
                                "results": chunk.results
                            })
                        
                        # Send consent request if present
                        if chunk.requires_consent:
                            await manager.send_message(user_id, {
                                "type": "consent_required",
                                "consent_request": chunk.requires_consent
                            })
                    
                    # Send completion signal
                    await manager.send_message(user_id, {
                        "type": "done"
                    })
                
                except Exception as e:
                    logger.error(f"Error processing WebSocket message: {e}", exc_info=True)
                    await manager.send_message(user_id, {
                        "type": "error",
                        "error": f"Failed to process message: {str(e)}"
                    })
            
            elif message_type == "ping":
                # Respond to ping with pong
                await manager.send_message(user_id, {
                    "type": "pong"
                })
            
            else:
                await manager.send_message(user_id, {
                    "type": "error",
                    "error": f"Unknown message type: {message_type}"
                })
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
        manager.disconnect(user_id)
    
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}", exc_info=True)
        manager.disconnect(user_id)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass

