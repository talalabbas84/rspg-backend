import httpx
import logging
from app.core.config import settings
from anthropic import Anthropic, APIStatusError, APIConnectionError, RateLimitError, APIError
from fastapi import HTTPException # Add this if not already imported at module level

logger = logging.getLogger(__name__)

# Initialize the Anthropic client
# It's better to initialize it once and reuse, or manage its lifecycle if needed.
# For simplicity here, creating it per call, but consider a global client or dependency injection.

async def call_claude_api(prompt: str, model: str = "claude-3-opus-20240229", max_tokens: int = 2048, temperature: float = 0.7) -> str:
    if not settings.CLAUDE_API_KEY:
        logger.error("CLAUDE_API_KEY not set in environment variables.")
        raise ValueError("CLAUDE_API_KEY is not configured.")

    client = Anthropic(api_key=settings.CLAUDE_API_KEY)

    try:
        # Using the Messages API (recommended over legacy Text Completions)
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # The response structure for messages API:
        # response.content is a list of content blocks. For text, it's usually one block.
        if response.content and isinstance(response.content, list) and hasattr(response.content[0], 'text'):
            return response.content[0].text
        else:
            logger.error(f"Unexpected response structure from Claude API: {response}")
            return "Error: Could not parse LLM response."

    except APIStatusError as e:
        logger.error(f"Claude API returned an APIStatusError: {e.status_code} - {e.response}", exc_info=True)
        raise HTTPException(status_code=e.status_code, detail=f"LLM API Error: {e.message}")
    except APIConnectionError as e:
        logger.error(f"Failed to connect to Claude API: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="LLM Service Unavailable: Connection Error")
    except RateLimitError as e:
        logger.error(f"Claude API rate limit exceeded: {e}", exc_info=True)
        raise HTTPException(status_code=429, detail="LLM Rate Limit Exceeded. Please try again later.")
    except APIError as e: # Catch other Anthropic API errors
        logger.error(f"An unexpected error occurred with the Claude API: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLM API Internal Error: {e.message}")
    except Exception as e:
        logger.error(f"An unexpected error occurred while calling Claude API: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred with the LLM service.")

# Example of how to use this (e.g., in a service or route):
# async def some_function():
#     try:
#         result = await call_claude_api("Translate this to French: Hello World")
#         print(result)
#     except HTTPException as http_exc:
#         # Handle FastAPI HTTP exceptions if re-raised
#         print(f"HTTP Exception: {http_exc.detail}")
#     except ValueError as val_err:
#         # Handle configuration errors
#         print(f"Configuration Error: {val_err}")
