"""
FastAPI backend for the LLM chat application.
Provides endpoints for chat responses and text generation using Gemma model.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from contextlib import asynccontextmanager
import uvicorn

from gemma_handler import GemmaHandler
from bot_prompts import (
    get_persona_prompt, 
    get_all_personas, 
    get_all_cultures,
    get_text_generation_prompt,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global model handler
gemma_handler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the application lifespan - load model on startup, cleanup on shutdown."""
    global gemma_handler
    
    # Startup
    logger.info("Starting up LLM Chat API...")
    gemma_handler = GemmaHandler()
    
    # Load the model
    if not gemma_handler.load_model():
        logger.error("Failed to load LLM model")
        raise RuntimeError("Could not load the LLM model")
    
    logger.info("LLM model loaded successfully")
    yield
    
    # Shutdown
    logger.info("Shutting down LLM Chat API...")
    if gemma_handler:
        gemma_handler.unload_model()

# Create FastAPI app
app = FastAPI(
    title="LLM Chat API",
    description="A multi-persona chat API using Gemma LLM with cultural variations",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    persona: str = "friend"
    culture: str = "delhi"
    conversation_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    persona: str
    culture: str
    success: bool
    error_message: Optional[str] = None

class TextGenerationRequest(BaseModel):
    prompt: str
    style: str = "creative"
    max_tokens: int = 512

class TextGenerationResponse(BaseModel):
    generated_text: str
    style: str
    success: bool
    error_message: Optional[str] = None

class PersonaInfo(BaseModel):
    persona: str
    culture: str
    persona_name: str
    culture_name: str
    description: str

class ModelInfo(BaseModel):
    model_name: str
    device: str
    is_loaded: bool
    cuda_available: bool

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "LLM Chat API with Multiple Personas",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/chat",
            "generate": "/generate",
            "personas": "/personas",
            "cultures": "/cultures",
            "combinations": "/combinations",
            "styles": "/styles",
            "health": "/health"
        }
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Generate a chat response based on persona and culture.
    
    Args:
        request: ChatRequest containing message, persona, culture, and conversation history
        
    Returns:
        ChatResponse with the generated response
    """
    try:
        if not gemma_handler or not gemma_handler.is_loaded():
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Convert conversation history to the format expected by gemma_handler
        history = []
        if request.conversation_history:
            for msg in request.conversation_history:
                history.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Generate response
        response = gemma_handler.chat_response(
            message=request.message,
            persona=request.persona,
            culture=request.culture,
            conversation_history=history
        )
        
        if response is None:
            raise HTTPException(status_code=500, detail="Failed to generate response")
        
        return ChatResponse(
            response=response,
            persona=request.persona,
            culture=request.culture,
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return ChatResponse(
            response="",
            persona=request.persona,
            culture=request.culture,
            success=False,
            error_message=str(e)
        )

@app.post("/generate", response_model=TextGenerationResponse)
async def generate_text(request: TextGenerationRequest):
    """
    Generate text based on a prompt and style.
    
    Args:
        request: TextGenerationRequest containing prompt, style, and max_tokens
        
    Returns:
        TextGenerationResponse with the generated text
    """
    try:
        if not gemma_handler or not gemma_handler.is_loaded():
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Generate text
        generated_text = gemma_handler.generate_text(
            prompt=request.prompt,
            style=request.style,
            max_tokens=request.max_tokens
        )
        
        if generated_text is None:
            raise HTTPException(status_code=500, detail="Failed to generate text")
        
        return TextGenerationResponse(
            generated_text=generated_text,
            style=request.style,
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error in generate endpoint: {str(e)}")
        return TextGenerationResponse(
            generated_text="",
            style=request.style,
            success=False,
            error_message=str(e)
        )

@app.get("/personas")
async def get_personas():
    """Get all available personas."""
    try:
        personas = get_all_personas()
        return {"personas": personas, "success": True}
    except Exception as e:
        logger.error(f"Error getting personas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cultures")
async def get_cultures():
    """Get all available cultures."""
    try:
        cultures = get_all_cultures()
        return {"cultures": cultures, "success": True}
    except Exception as e:
        logger.error(f"Error getting cultures: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/combinations", response_model=List[PersonaInfo])
async def get_combinations():
    """Get all valid persona-culture combinations."""
    try:
        combinations = get_persona_culture_combinations()
        return combinations
    except Exception as e:
        logger.error(f"Error getting combinations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/styles")
async def get_styles():
    """Get all available text generation styles."""
    try:
        styles = get_text_generation_styles()
        return {"styles": styles, "success": True}
    except Exception as e:
        logger.error(f"Error getting styles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        if not gemma_handler:
            return {
                "status": "unhealthy",
                "message": "Model handler not initialized",
                "model_loaded": False
            }
        
        model_info = gemma_handler.get_model_info()
        
        return {
            "status": "healthy" if model_info["is_loaded"] else "unhealthy",
            "message": "API is running",
            "model_info": model_info
        }
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return {
            "status": "unhealthy",
            "message": str(e),
            "model_loaded": False
        }

@app.get("/model-info", response_model=ModelInfo)
async def get_model_info():
    """Get information about the loaded model."""
    try:
        if not gemma_handler:
            raise HTTPException(status_code=503, detail="Model handler not initialized")
        
        info = gemma_handler.get_model_info()
        return ModelInfo(**info)
        
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Additional utility endpoints

@app.post("/reload-model")
async def reload_model():
    """Reload the Gemma model (useful for debugging)."""
    try:
        global gemma_handler
        
        if gemma_handler:
            gemma_handler.unload_model()
        
        gemma_handler = GemmaHandler()
        
        if not gemma_handler.load_model():
            raise HTTPException(status_code=500, detail="Failed to reload model")
        
        return {"message": "Model reloaded successfully", "success": True}
        
    except Exception as e:
        logger.error(f"Error reloading model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-persona/{persona}/{culture}")
async def test_persona(persona: str, culture: str):
    """Test a specific persona-culture combination with a sample prompt."""
    try:
        prompt = get_persona_prompt(persona, culture)
        return {
            "persona": persona,
            "culture": culture,
            "prompt": prompt,
            "success": True
        }
    except Exception as e:
        logger.error(f"Error testing persona: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "gemma_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
