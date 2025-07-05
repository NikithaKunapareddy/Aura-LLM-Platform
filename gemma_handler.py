import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import logging
from typing import Optional, Dict, Any
import gc
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GemmaHandler:
    def __init__(self, model_name: str = "microsoft/DialoGPT-medium"):
        """
        Initialize the Gemma handler with the specified model.
        
        Args:
            model_name (str): The name of the model to load
        """
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.logger = logging.getLogger(__name__)
        self.hf_token = os.getenv("HUGGINGFACE_TOKEN")
        
    def load_model(self) -> bool:
        """
        Load the Gemma model and tokenizer.
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            self.logger.info(f"Loading model: {self.model_name} on device: {self.device}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            
            # Add pad token if it doesn't exist
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load model with appropriate settings
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float32,  # Use float32 for CPU
                trust_remote_code=True,
                low_cpu_mem_usage=True
            )
            
            if self.device == "cpu":
                self.model = self.model.to(self.device)
            
            self.logger.info("Model loaded successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load model: {str(e)}")
            return False
    
    def generate_response(
        self, 
        prompt: str, 
        max_new_tokens: int = 512, 
        temperature: float = 0.7,
        top_p: float = 0.9,
        top_k: int = 50,
        do_sample: bool = True
    ) -> Optional[str]:
        """
        Generate a response using the DialoGPT model.
        
        Args:
            prompt (str): The input prompt
            max_new_tokens (int): Maximum number of new tokens to generate
            temperature (float): Sampling temperature
            top_p (float): Top-p sampling parameter
            top_k (int): Top-k sampling parameter
            do_sample (bool): Whether to use sampling
            
        Returns:
            Optional[str]: Generated response or None if generation fails
        """
        if not self.model or not self.tokenizer:
            self.logger.error("Model not loaded. Call load_model() first.")
            return None
        
        try:
            # For DialoGPT, we need to format the conversation properly
            # Add special tokens for conversation
            formatted_prompt = f"{prompt}{self.tokenizer.eos_token}"
            
            # Tokenize input
            inputs = self.tokenizer.encode(
                formatted_prompt + self.tokenizer.eos_token, 
                return_tensors="pt"
            )
            
            # Move inputs to device
            inputs = inputs.to(self.device)
            
            # Generate response with more conservative settings for DialoGPT
            with torch.no_grad():
                chat_history_ids = self.model.generate(
                    inputs,
                    max_length=inputs.shape[-1] + max_new_tokens,
                    num_beams=3,
                    temperature=temperature,
                    do_sample=do_sample,
                    top_p=top_p,
                    top_k=top_k,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.2,
                    length_penalty=1.0,
                    no_repeat_ngram_size=3
                )
            
            # Extract only the new response (after the input)
            response = self.tokenizer.decode(
                chat_history_ids[:, inputs.shape[-1]:][0], 
                skip_special_tokens=True
            )
            
            # Clean up the response
            response = response.strip()
            
            # If response is empty or too short, provide a fallback
            if not response or len(response.strip()) < 3:
                return "Hello! I'm here to chat with you. How can I help?"
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error generating response: {str(e)}")
            # Return a fallback response instead of None
            return "I'm having trouble generating a response right now. Please try again!"
    
    def chat_response(
        self, 
        message: str, 
        persona: str = "friend", 
        culture: str = "delhi",
        conversation_history: Optional[list] = None
    ) -> Optional[str]:
        """
        Generate a chat response with persona and culture context.
        
        Args:
            message (str): User message
            persona (str): Bot persona (friend, mentor, romantic, etc.)
            culture (str): Cultural context (delhi, japanese, parisian, berlin)
            conversation_history (list): Previous conversation messages
            
        Returns:
            Optional[str]: Generated response
        """
        from bot_prompts import get_persona_prompt
        
        # Get the persona prompt for ANY message
        persona_prompt = get_persona_prompt(persona, culture)
        
        # Build conversation context
        conversation_context = ""
        if conversation_history:
            for msg in conversation_history[-3:]:  # Last 3 messages for context
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                conversation_context += f"{role.capitalize()}: {content}\n"
        
        # Create a dynamic prompt that includes persona context
        full_prompt = f"{persona_prompt}\n\nConversation:\n{conversation_context}User: {message}\nAssistant:"
        
        # Try to generate with the model first
        response = self.generate_response(
            full_prompt,
            max_new_tokens=150,
            temperature=0.8,
            top_p=0.9
        )
        
        # If model generation fails or is too short, create a persona-based response
        if not response or len(response.strip()) < 10:
            response = self._generate_persona_response(message, persona, culture)
        
        return response

    def _generate_persona_response(self, message: str, persona: str, culture: str) -> str:
        """Generate dynamic responses based on persona and culture for ANY message."""
        from bot_prompts import get_persona_prompt
        
        # Get the full persona description
        persona_context = get_persona_prompt(persona, culture)
        
        # Create a template-based response that incorporates the persona
        persona_styles = {
            "friend": {
                "delhi": lambda msg: f"Hey! {self._respond_as_friend(msg)} What do you think about this? I'm here to support you!",
                "japanese": lambda msg: f"Hello friend! {self._respond_as_friend(msg)} Please share more of your thoughts with me.",
                "parisian": lambda msg: f"Bonjour mon ami! {self._respond_as_friend(msg)} I find this quite fascinating!",
                "berlin": lambda msg: f"Hey there! {self._respond_as_friend(msg)} Let's talk about this honestly."
            },
            "mentor": {
                "delhi": lambda msg: f"I see you're thinking about: '{msg}'. This is a great learning opportunity. What insights have you gained so far?",
                "japanese": lambda msg: f"Thank you for sharing: '{msg}'. Let's explore this wisdom together mindfully.",
                "parisian": lambda msg: f"Ah, '{msg}' - how intellectually stimulating! Let me guide you through this thought.",
                "berlin": lambda msg: f"Good question about '{msg}'. Let's approach this systematically and learn together."
            },
            "romantic": {
                "delhi": lambda msg: f"My dear, when you say '{msg}', it touches my heart. Tell me more about what you're feeling.",
                "japanese": lambda msg: f"Sweetheart, '{msg}' shows your beautiful mind. I love how you think about things.",
                "parisian": lambda msg: f"Mon amour, '{msg}' is so poetic. Share more of your beautiful thoughts with me.",
                "berlin": lambda msg: f"My love, I appreciate you sharing '{msg}' with me. You always make me think."
            },
            "therapist": {
                "delhi": lambda msg: f"Thank you for sharing '{msg}' with me. How does this make you feel? I'm here to listen.",
                "japanese": lambda msg: f"I hear you saying '{msg}'. Let's explore these feelings together in this safe space.",
                "parisian": lambda msg: f"You mentioned '{msg}' - that sounds important to you. What emotions are you experiencing?",
                "berlin": lambda msg: f"When you say '{msg}', I want to understand. Can you tell me more about this honestly?"
            },
            "professional": {
                "delhi": lambda msg: f"Regarding '{msg}' - let's analyze this professionally. What are your objectives here?",
                "japanese": lambda msg: f"About '{msg}' - I think we can work on this efficiently. What's our next step?",
                "parisian": lambda msg: f"Concerning '{msg}' - this is an excellent point. How shall we proceed creatively?",
                "berlin": lambda msg: f"About '{msg}' - let's be direct and solution-focused. What do you need to achieve?"
            }
        }
        
        # Get the response generator for this persona and culture
        response_generator = persona_styles.get(persona, {}).get(culture)
        
        if response_generator:
            return response_generator(message)
        else:
            # Fallback for unknown persona/culture combinations
            return f"Thank you for sharing '{message}' with me. I'd love to hear more about your thoughts on this topic!"

    def _respond_as_friend(self, message: str) -> str:
        """Generate friendly responses to any message."""
        if "?" in message:
            return "That's a really interesting question!"
        elif any(word in message.lower() for word in ["sad", "upset", "worried", "stressed"]):
            return "I can hear that you're going through something tough."
        elif any(word in message.lower() for word in ["happy", "excited", "good", "great", "awesome"]):
            return "I love hearing positive energy from you!"
        elif any(word in message.lower() for word in ["work", "job", "career"]):
            return "Work stuff can be really challenging sometimes."
        elif any(word in message.lower() for word in ["love", "relationship", "partner"]):
            return "Relationships are such an important part of life."
        else:
            return "I find what you're saying really interesting."
    
    def generate_text(
        self, 
        prompt: str, 
        style: str = "creative",
        max_tokens: int = 512
    ) -> Optional[str]:
        """
        Generate text based on a prompt and style.
        
        Args:
            prompt (str): The text generation prompt
            style (str): Writing style (creative, formal, casual, etc.)
            max_tokens (int): Maximum tokens to generate
            
        Returns:
            Optional[str]: Generated text
        """
        style_prompts = {
            "creative": "Write in a creative and imaginative style:",
            "formal": "Write in a formal and professional style:",
            "casual": "Write in a casual and conversational style:",
            "academic": "Write in an academic and scholarly style:",
            "poetic": "Write in a poetic and artistic style:"
        }
        
        style_instruction = style_prompts.get(style, style_prompts["creative"])
        full_prompt = f"{style_instruction}\n\n{prompt}\n\n"
        
        return self.generate_response(
            full_prompt,
            max_new_tokens=max_tokens,
            temperature=0.8 if style == "creative" else 0.6
        )
    
    def unload_model(self):
        """Unload the model to free memory."""
        if self.model:
            del self.model
            self.model = None
        if self.tokenizer:
            del self.tokenizer
            self.tokenizer = None
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        self.logger.info("Model unloaded successfully")
    
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        return self.model is not None and self.tokenizer is not None
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        return {
            "model_name": self.model_name,
            "device": self.device,
            "is_loaded": self.is_loaded(),
            "cuda_available": torch.cuda.is_available()
        }
