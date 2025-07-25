import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import logging
from typing import Optional, Dict, Any
import gc
import os
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

class GemmaHandler:
    def __init__(self, model_name: str = "microsoft/DialoGPT-small"):
        """
        Initialize the Gemma handler with the specified model.
        """
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.device = "cpu"  # Force CPU for reliability
        self.logger = logging.getLogger(__name__)
        self.hf_token = os.getenv("HUGGINGFACE_TOKEN")
        
    def load_model(self) -> bool:
        """
        Load the Gemma model and tokenizer.
        """
        try:
            self.logger.info(f"Loading model: {self.model_name} on device: {self.device}")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float32,
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
        """
        if not self.model or not self.tokenizer:
            self.logger.error("Model not loaded. Call load_model() first.")
            return None
        try:
            formatted_prompt = f"{prompt}{self.tokenizer.eos_token}"
            encoded = self.tokenizer(
                formatted_prompt + self.tokenizer.eos_token,
                return_tensors="pt",
                padding=True
            )
            inputs = encoded["input_ids"].to(self.device)
            attention_mask = encoded["attention_mask"].to(self.device)
            with torch.no_grad():
                chat_history_ids = self.model.generate(
                    inputs,
                    attention_mask=attention_mask,
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
            response = self.tokenizer.decode(
                chat_history_ids[:, inputs.shape[-1]:][0], 
                skip_special_tokens=True
            )
            response = response.strip()
            if not response or len(response.strip()) < 3:
                return "Hello! I'm here to chat with you. How can I help?"
            return response
        except Exception as e:
            self.logger.error(f"Error generating response: {str(e)}")
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
        """
        from bot_prompts import get_persona_prompt
        persona_prompt = get_persona_prompt(persona, culture)
        conversation_context = ""
        if conversation_history:
            for msg in conversation_history[-3:]:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                conversation_context += f"{role.capitalize()}: {content}\n"
        example_user = "I love ice cream"
        example_assistant = self._generate_persona_response(example_user, persona, culture)
        full_prompt = (
            f"You are acting as a {persona} from {culture.title()}.\n"
            f"Respond to the user in a way that reflects this persona and culture. "
            f"Be warm, informal, and use local expressions if possible.\n\n"
            f"Example:\n"
            f"User: {example_user}\n"
            f"Assistant: {example_assistant}\n\n"
            f"{conversation_context}User: {message}\nAssistant:"
        )
        self.logger.info(f"[Prompt to model]: {full_prompt}")
        response = self.generate_response(
            full_prompt,
            max_new_tokens=150,
            temperature=0.8,
            top_p=0.9
        )
        self.logger.info(f"[Model response]: {response}")
        if not response or len(response.strip()) < 10:
            self.logger.warning("Model response too short or empty, using template fallback.")
            response = self._generate_persona_response(message, persona, culture)
        return response

    def _generate_persona_response(self, message: str, persona: str, culture: str) -> str:
        """Generate dynamic responses based on persona and culture for ANY message."""
        from bot_prompts import get_persona_prompt
        persona_context = get_persona_prompt(persona, culture)
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
        response_generator = persona_styles.get(persona, {}).get(culture)
        if response_generator:
            return response_generator(message)
        else:
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
        max_tokens: int = 512,
        persona: str = "friend",
        culture: str = "delhi"
    ) -> Optional[str]:
        """
        Generate text based on a prompt, style, persona, and culture.
        """
        style_prompts = {
            "creative": "Write in a creative and imaginative style:",
            "formal": "Write in a formal and professional style:",
            "casual": "Write in a casual and conversational style:",
            "academic": "Write in an academic and scholarly style:",
            "poetic": "Write in a poetic and artistic style:"
        }
        style_instruction = style_prompts.get(style, style_prompts["creative"])
        example_user = "Describe your favorite dessert."
        example_assistant = self._generate_persona_response(example_user, persona, culture)
        full_prompt = (
            f"{style_instruction}\n"
            f"You are acting as a {persona} from {culture.title()}.\n"
            f"Respond in a way that reflects this persona and culture. "
            f"Be warm, informal, and use local expressions if possible.\n\n"
            f"Example:\n"
            f"User: {example_user}\n"
            f"Assistant: {example_assistant}\n\n"
            f"User: {prompt}\nAssistant:"
        )
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

    def proactive_mood_response(self, mood: str, persona: str, gender: str = "female") -> str:
        """
        Get a proactive response based on mood, persona, and gender.
        """
        from bot_prompts import get_proactive_response
        persona_key = f"{persona}_{gender}"
        return get_proactive_response(mood, persona_key)

# --- OpenAI Chat Function ---

def openai_chat_response(message: str, persona: str = "friend", culture: str = "delhi", conversation_history: Optional[list] = None) -> str:
    """
    Generate a chat response using OpenAI GPT-3.5/4 API.
    """
    openai.api_key = os.getenv("OPENAI_API_KEY")
    system_prompt = f"You are a {persona} from {culture}. Respond informally, warmly, and use local expressions if possible."
    messages = [{"role": "system", "content": system_prompt}]
    if conversation_history:
        for msg in conversation_history[-3:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": message})

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",  # or "gpt-4o" if you have access
        messages=messages,
        max_tokens=150,
        temperature=0.8,
        top_p=0.9
    )
    return response.choices[0].message.content.strip()

if __name__ == "__main__":
    from bot_prompts import get_bot_prompt

    def start_chat(bot_id):
        prompt = get_bot_prompt(bot_id)
        print(prompt)  # Or use the prompt in your LLM call

    # Example usage:
    bot_id = "delhi_mentor_male"  # This can be any key from BOT_PROMPTS
    start_chat(bot_id)