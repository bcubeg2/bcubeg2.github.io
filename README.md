# bcubeg2.github.io

This is a personal website hosted on GitHub Pages featuring an Ollama Chat Interface.

## 🌐 Live Site

The site is automatically deployed to: https://bcubeg2.github.io

## 🚀 Deployment

This repository uses GitHub Actions to automatically deploy to GitHub Pages. The deployment workflow runs:
- On every push to the `main` or `master` branch
- Manually via the Actions tab (workflow_dispatch)

## 📁 Project Structure

- `index.html` - Main HTML page
- `styles.css` - Styling for the chat interface
- `app.js` - JavaScript functionality for the Ollama chat
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment workflow

## 🔧 Local Development

To run this locally, simply open `index.html` in a web browser. For the Ollama integration to work, you'll need:
1. Ollama running locally on `http://localhost:11434`
2. At least one model pulled (e.g., `ollama pull llama3.2`)

## 📝 Features

- Real-time chat interface with Ollama models
- Model selection dropdown
- Streaming responses
- Connection status indicator
- Responsive design
