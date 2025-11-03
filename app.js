// Configuration
const OLLAMA_BASE_URL = "http://localhost:11434";

// DOM Elements
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const modelSelect = document.getElementById("modelSelect");
const typingIndicator = document.getElementById("typingIndicator");
const statusIndicator = document.getElementById("statusIndicator");

// State
let isGenerating = false;
let conversationHistory = [];

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  checkOllamaConnection();
  refreshModels();

  // Auto-resize textarea
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
});

// Check if Ollama is running
async function checkOllamaConnection() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (response.ok) {
      statusIndicator.className = "status-indicator status-connected";
      return true;
    }
  } catch (error) {
    console.error("Ollama connection failed:", error);
  }

  statusIndicator.className = "status-indicator status-disconnected";
  showError(
    "Cannot connect to Ollama. Make sure Ollama is running on localhost:11434"
  );
  return false;
}

// Refresh available models
async function refreshModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];

      // Clear existing options
      modelSelect.innerHTML = "";

      // Add available models
      if (models.length > 0) {
        models.forEach((model) => {
          const option = document.createElement("option");
          option.value = model.name;
          option.textContent = model.name;
          modelSelect.appendChild(option);
        });
      } else {
        // Default models if none found
        const defaultModels = [
          "llama3.2",
          "llama3.1",
          "mistral",
          "codellama",
          "phi3",
        ];
        defaultModels.forEach((model) => {
          const option = document.createElement("option");
          option.value = model;
          option.textContent = model;
          modelSelect.appendChild(option);
        });
      }

      statusIndicator.className = "status-indicator status-connected";
    }
  } catch (error) {
    console.error("Failed to refresh models:", error);
    statusIndicator.className = "status-indicator status-disconnected";
  }
}

// Handle Enter key
function handleKeyDown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Send message to Ollama
async function sendMessage() {
  const message = messageInput.value.trim();
  if (message === "" || isGenerating) return;

  // Add user message to chat
  addMessage("user", message);

  // Clear input and disable send button
  messageInput.value = "";
  messageInput.style.height = "auto";
  isGenerating = true;
  sendButton.disabled = true;
  sendButton.textContent = "Sending...";

  // Show typing indicator
  showTypingIndicator();

  try {
    // Add to conversation history
    conversationHistory.push({ role: "user", content: message });

    // Send to Ollama
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelSelect.value,
        messages: conversationHistory,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = "";
    let messageElement = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message && data.message.content) {
            assistantMessage += data.message.content;

            if (!messageElement) {
              hideTypingIndicator();
              messageElement = addMessage("assistant", assistantMessage);
            } else {
              updateMessage(messageElement, assistantMessage);
            }
          }

          if (data.done) {
            // Add to conversation history
            conversationHistory.push({
              role: "assistant",
              content: assistantMessage,
            });
            break;
          }
        } catch (e) {
          // Skip invalid JSON lines
          continue;
        }
      }
    }
  } catch (error) {
    hideTypingIndicator();
    console.error("Error:", error);
    showError(
      "Failed to get response from Ollama. Please check your connection and try again."
    );
  } finally {
    isGenerating = false;
    sendButton.disabled = false;
    sendButton.textContent = "Send";
  }
}

// Add message to chat
function addMessage(sender, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "user" ? "👤" : "🤖";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = content;

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);

  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  return contentDiv;
}

// Update message content (for streaming)
function updateMessage(messageElement, content) {
  messageElement.textContent = content;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
  typingIndicator.style.display = "block";
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
  typingIndicator.style.display = "none";
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;

  messagesDiv.appendChild(errorDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

// Clear conversation
function clearConversation() {
  if (confirm("Are you sure you want to clear the conversation?")) {
    conversationHistory = [];
    messagesDiv.innerHTML = `
      <div class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          Hello! I'm your local Ollama assistant. How can I help you today?
        </div>
      </div>
    `;
  }
}

// Add clear button functionality (you can add this to the UI if desired)
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "l") {
    event.preventDefault();
    clearConversation();
  }
});
