# Ollama Chat Interface

A beautiful web interface to interact with your local Ollama instance.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [ollama.ai](https://ollama.ai)
2. **Start Ollama**: Make sure Ollama is running on your system
3. **Download Models**: Pull at least one model (e.g., `ollama pull llama3.2`)

## Quick Start

1. **Start Ollama** (if not already running):

   ```bash
   ollama serve
   ```

2. **Download a model** (if you haven't already):

   ```bash
   ollama pull llama3.2
   # or other models like:
   # ollama pull mistral
   # ollama pull codellama
   # ollama pull phi3
   ```

3. **Open the Interface**: Open `index.html` in your browser or serve it locally

4. **Enable CORS** (if needed): If you encounter CORS issues, start Ollama with:

   ```bash
   OLLAMA_ORIGINS=* ollama serve
   ```

## Features

- 🎨 **Beautiful UI**: Modern, responsive design
- 🔄 **Real-time Streaming**: See responses as they're generated
- 🤖 **Model Selection**: Switch between different Ollama models
- 💬 **Conversation History**: Maintains context throughout the chat
- 📱 **Mobile Friendly**: Works great on all devices
- 🚀 **Fast & Local**: All processing happens on your machine

## Available Models

The interface will automatically detect your installed models. Common models include:

- **llama3.2**: Latest Llama model (recommended)
- **llama3.1**: Previous Llama version
- **mistral**: Fast and efficient
- **codellama**: Specialized for coding tasks
- **phi3**: Microsoft's compact model

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line
- **Ctrl + L**: Clear conversation

## Troubleshooting

### Connection Issues

- Make sure Ollama is running (`ollama serve`)
- Check that Ollama is accessible at `http://localhost:11434`
- Enable CORS if needed: `OLLAMA_ORIGINS=* ollama serve`

### No Models Available

- Download models: `ollama pull llama3.2`
- Check installed models: `ollama list`

### Performance Issues

- Smaller models (like phi3) run faster on limited hardware
- Adjust your system resources allocated to Ollama

## Development

This is a static HTML file that communicates directly with your local Ollama instance via its REST API. No server setup required!

### API Endpoints Used

- `GET /api/tags` - List available models
- `POST /api/chat` - Send chat messages (streaming)

## Security Note

This interface only communicates with your local Ollama instance. No data is sent to external servers.

---

Enjoy chatting with your local AI! 🦙
