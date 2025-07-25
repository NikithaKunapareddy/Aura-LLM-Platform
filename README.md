# Aura LLM Platform 🌟🤖

A sophisticated full-stack AI chat platform featuring multiple AI personas with cultural variations, built with FastAPI backend and React TypeScript frontend. Experience conversations with AI that adapts to different personalities and cultural contexts.

## Features ✨

### 🎭 Multiple AI Personas
- **Friend**: Warm, supportive, and encouraging companion
- **Mentor**: Wise guide providing guidance and feedback  
- **Romantic**: Affectionate and caring romantic partner
- **Professional**: Competent and collaborative colleague
- **Therapist**: Compassionate listener for emotional support

### 🌍 Cultural Variations
- **Delhi (Indian)**: Warm hospitality, family values, occasional Hindi/Urdu phrases
- **Japanese**: Polite, mindful, nature-appreciating communication
- **Parisian (French)**: Sophisticated, artistic, intellectually curious
- **Berlin (German)**: Direct, efficient, creative, and honest

### 💬 Chat Features
- Real-time conversation with AI personas
- Context-aware responses maintaining conversation history
- Cultural authenticity without stereotyping
- Persona and culture selection interface

### ✍️ Text Generation
- Multiple writing styles (Creative, Formal, Casual, Academic, Poetic, Humorous)
- Customizable text generation with style-specific prompts
- Adjustable output length

## Tech Stack 🛠️

### Backend
- **FastAPI**: Modern Python web framework
- **Transformers**: Hugging Face library for AI models
- **PyTorch**: Deep learning framework
- **Gemma-2-2B-IT**: Google's instruction-tuned language model
- **Pydantic**: Data validation and settings management

### Frontend
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library

## Project Structure 📁

```
LLM/
├── Backend Files
│   ├── gemma_handler.py      # LLM model handler
│   ├── gemma_api.py          # FastAPI endpoints
│   ├── bot_prompts.py        # Persona and culture prompts
│   └── requirements.txt      # Python dependencies
│
├── Frontend Files
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── PersonaSelection.tsx
│   │   │   └── TextGeneration.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── useChat.ts
│   │   ├── services/         # API integration
│   │   │   └── api.ts
│   │   ├── types/            # TypeScript definitions
│   │   │   └── index.ts
│   │   ├── data/             # Static data
│   │   │   └── personas.ts
│   │   ├── utils/            # Utility functions
│   │   │   └── index.ts
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # App entry point
│   │   └── index.css         # Global styles
│   │
│   ├── index.html            # HTML template
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── postcss.config.js     # PostCSS configuration
│   └── tsconfig.json         # TypeScript configuration
│
└── README.md                 # This file
```

## Installation & Setup 🚀

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** for version control
- **CUDA-compatible GPU** (optional, for faster inference)

### Backend Setup

1. **Create Python Virtual Environment**
   ```bash
   cd "c:\Users\nikit\Desktop\LLM"
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Backend Server**
   ```bash
   python start_backend.py
   ```
   
   The API will be available at `http://localhost:8000`
   API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. **Install Node.js Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

## API Endpoints 🔌

### Chat Endpoints
- `POST /chat` - Generate chat responses with persona/culture
- `GET /personas` - Get all available personas
- `GET /cultures` - Get all available cultures
- `GET /combinations` - Get all persona-culture combinations

### Text Generation
- `POST /generate` - Generate text with specified style
- `GET /styles` - Get all available writing styles

### Utility Endpoints
- `GET /health` - Health check and model status
- `GET /model-info` - Detailed model information
- `POST /reload-model` - Reload the AI model

## Usage Examples 📝

### Chat API Request
```json
{
  "message": "I'm feeling stressed about work",
  "persona": "therapist",
  "culture": "japanese",
  "conversation_history": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### Text Generation Request
```json
{
  "prompt": "Write a story about a magical forest",
  "style": "creative",
  "max_tokens": 512
}
```

## Development Notes 🔧

### Model Configuration
- **Default Model**: `google/gemma-2-2b-it` (2B parameter instruction-tuned)
- **Memory Usage**: ~4-6GB VRAM (GPU) or ~8-12GB RAM (CPU)
- **Generation Settings**: Temperature 0.7-0.9, Top-p 0.9, Top-k 50

---

### 🔑 OpenAI API Key Setup

To use OpenAI models (like GPT-3.5 or GPT-4) for chat and text generation, you must provide your OpenAI API key.

1. **Get your API key:**  
   - Sign up or log in at [OpenAI Platform](https://platform.openai.com/).
   - Go to your API keys page and create a new secret key.

2. **Add your key to the `.env` file:**  
   In the project root, open or create a file named `.env` and add:
   ```
   OPENAI_API_KEY=sk-...your-key-here...
   ```

3. **Do not share your API key publicly.**  
   Keep your `.env` file private and never commit it to public repositories.

4. **The application will automatically load this key** and use it for OpenAI-powered features.

### Performance Tips
- Use GPU acceleration when available (`CUDA_VISIBLE_DEVICES=0`)
- Adjust `max_new_tokens` based on response length needs
- Monitor memory usage during long conversations

### Customization
- Add new personas in `bot_prompts.py`
- Modify cultural characteristics in `CULTURES` dictionary
- Adjust generation parameters in `gemma_handler.py`
- Customize UI components in `src/components/`

## Available Scripts 📜

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `python start_backend.py` - Start FastAPI server at `http://localhost:8000`
- `python -c "from gemma_handler import GemmaHandler; h = GemmaHandler(); h.load_model()"` - Test model loading

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting 🔧

### Common Issues

**Model Loading Fails**
- Check available memory (RAM/VRAM)
- Verify internet connection for model download
- Try CPU-only mode: set `device = "cpu"` in `gemma_handler.py`

**CORS Errors**
- Ensure frontend URL is in `allow_origins` in `gemma_api.py`
- Check that both servers are running on correct ports

**Slow Response Times**
- Use GPU acceleration if available
- Reduce `max_new_tokens` for faster generation
- Consider model quantization for memory-constrained systems

**Frontend Build Issues**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are installed

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- **Google** for the Gemma model family
- **Hugging Face** for the Transformers library
- **FastAPI** team for the excellent web framework
- **React** and **Vite** teams for modern frontend tools

## Author 👨‍💻

**Nikitha Kunapareddy**
- GitHub: [@NikithaKunapareddy](https://github.com/NikithaKunapareddy)
- Project: [aura-llm-platform](https://github.com/NikithaKunapareddy/aura-llm-platform)

---

**Happy Chatting with Aura LLM Platform!** 🎉✨

For questions, support, or collaboration opportunities, please open an issue in the repository or reach out via GitHub.

*Built with ❤️ using cutting-edge AI technology*
