# Ollama Chat Interface

A clean, modern web interface for interacting with Ollama AI models.

## Features

- 🦙 Connect to local Ollama instance
- 🎨 Beautiful, responsive UI
- 💬 Real-time chat interface
- 🔄 Multiple model support
- 📱 Mobile-friendly design

## Deployment

This site is automatically deployed to GitHub Pages when changes are pushed to the `main` or `master` branch.

The deployment workflow:
1. Checks out the repository
2. Prepares static files (HTML, CSS, JS)
3. Uploads artifacts to GitHub Pages
4. Deploys the site

You can also manually trigger a deployment using the "Actions" tab on GitHub.

## Local Development

1. Clone this repository
2. Open `index.html` in your browser
3. Make sure Ollama is running locally on `http://localhost:11434`

For more information about setting up Ollama, see [OLLAMA_SETUP.md](OLLAMA_SETUP.md).

## Usage

1. Visit the deployed site at `https://bcubeg2.github.io`
2. Ensure Ollama is running on your local machine
3. Select your preferred model from the dropdown
4. Start chatting!

## Files

- `index.html` - Main HTML structure
- `app.js` - Application logic and Ollama API integration
- `styles.css` - Styling and layout
- `OLLAMA_SETUP.md` - Setup instructions for Ollama
