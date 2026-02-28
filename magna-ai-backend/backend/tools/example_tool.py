"""Example tool implementation demonstrating the Tool interface.

This module provides a simple example tool that can be used as a template
for creating new tools.
"""

import asyncio
from typing import Any, Dict

from .base import Tool, ToolResult, ToolValidationError


class EchoTool(Tool):
    """Example tool that echoes back the input message.
    
    This is a simple demonstration tool that shows how to implement
    the Tool interface. It validates input and returns the message
    with some metadata.
    """
    
    @property
    def name(self) -> str:
        """Tool identifier."""
        return "echo"
    
    @property
    def description(self) -> str:
        """Human-readable description for LLM."""
        return (
            "Echo tool that returns the input message. "
            "Useful for testing and demonstration purposes."
        )
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON schema for parameters."""
        return {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "Message to echo back"
                },
                "uppercase": {
                    "type": "boolean",
                    "description": "Whether to convert message to uppercase",
                    "default": False
                },
                "delay_ms": {
                    "type": "integer",
                    "description": "Artificial delay in milliseconds",
                    "default": 0,
                    "minimum": 0,
                    "maximum": 5000
                }
            },
            "required": ["message"]
        }
    
    async def execute(
        self,
        message: str,
        uppercase: bool = False,
        delay_ms: int = 0,
        **kwargs
    ) -> ToolResult:
        """Execute the echo operation.
        
        Args:
            message: Message to echo back
            uppercase: Whether to convert to uppercase
            delay_ms: Artificial delay in milliseconds
            **kwargs: Additional parameters (ignored)
            
        Returns:
            ToolResult with echoed message
            
        Raises:
            ToolValidationError: If message is empty
        """
        # Validate input
        if not message or not message.strip():
            raise ToolValidationError("Message cannot be empty")
        
        # Simulate processing delay if requested
        if delay_ms > 0:
            await asyncio.sleep(delay_ms / 1000.0)
        
        # Process message
        result_message = message.upper() if uppercase else message
        
        return ToolResult(
            success=True,
            data={
                "original": message,
                "result": result_message,
                "length": len(message),
                "uppercase_applied": uppercase
            },
            metadata={
                "tool": self.name,
                "delay_ms": delay_ms
            }
        )


class CalculatorTool(Tool):
    """Example calculator tool for basic arithmetic operations.
    
    Demonstrates parameter validation and error handling.
    """
    
    @property
    def name(self) -> str:
        """Tool identifier."""
        return "calculator"
    
    @property
    def description(self) -> str:
        """Human-readable description for LLM."""
        return (
            "Perform basic arithmetic operations (add, subtract, multiply, divide). "
            "Supports two operands and returns the result."
        )
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON schema for parameters."""
        return {
            "type": "object",
            "properties": {
                "operation": {
                    "type": "string",
                    "description": "Arithmetic operation to perform",
                    "enum": ["add", "subtract", "multiply", "divide"]
                },
                "a": {
                    "type": "number",
                    "description": "First operand"
                },
                "b": {
                    "type": "number",
                    "description": "Second operand"
                }
            },
            "required": ["operation", "a", "b"]
        }
    
    async def execute(
        self,
        operation: str,
        a: float,
        b: float,
        **kwargs
    ) -> ToolResult:
        """Execute the calculation.
        
        Args:
            operation: Arithmetic operation (add, subtract, multiply, divide)
            a: First operand
            b: Second operand
            **kwargs: Additional parameters (ignored)
            
        Returns:
            ToolResult with calculation result
            
        Raises:
            ToolValidationError: If operation is invalid or division by zero
        """
        # Validate operation
        valid_operations = ["add", "subtract", "multiply", "divide"]
        if operation not in valid_operations:
            raise ToolValidationError(
                f"Invalid operation '{operation}'. "
                f"Must be one of: {', '.join(valid_operations)}"
            )
        
        # Perform calculation
        try:
            if operation == "add":
                result = a + b
            elif operation == "subtract":
                result = a - b
            elif operation == "multiply":
                result = a * b
            elif operation == "divide":
                if b == 0:
                    raise ToolValidationError("Cannot divide by zero")
                result = a / b
            
            return ToolResult(
                success=True,
                data={
                    "operation": operation,
                    "operands": {"a": a, "b": b},
                    "result": result
                },
                metadata={
                    "tool": self.name,
                    "expression": f"{a} {operation} {b} = {result}"
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Calculation failed: {str(e)}"
            )


# Example usage
if __name__ == "__main__":
    import asyncio
    from .base import ToolRegistry
    
    async def main():
        """Demonstrate tool usage."""
        # Create registry
        registry = ToolRegistry()
        
        # Register example tools
        registry.register_tool(EchoTool())
        registry.register_tool(CalculatorTool())
        
        # List available tools
        print("Available tools:")
        for tool in registry.list_tools():
            print(f"  - {tool.name}: {tool.description}")
        print()
        
        # Test echo tool
        print("Testing echo tool:")
        result = await registry.execute_tool(
            tool_name="echo",
            parameters={"message": "Hello, World!", "uppercase": True}
        )
        print(f"  Success: {result.success}")
        print(f"  Result: {result.data}")
        print()
        
        # Test calculator tool
        print("Testing calculator tool:")
        result = await registry.execute_tool(
            tool_name="calculator",
            parameters={"operation": "multiply", "a": 7, "b": 6}
        )
        print(f"  Success: {result.success}")
        print(f"  Result: {result.data}")
        print()
        
        # Test error handling
        print("Testing error handling (division by zero):")
        result = await registry.execute_tool(
            tool_name="calculator",
            parameters={"operation": "divide", "a": 10, "b": 0}
        )
        print(f"  Success: {result.success}")
        print(f"  Error: {result.error}")
    
    asyncio.run(main())
