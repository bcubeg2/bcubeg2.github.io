// Configuration (editable at runtime via UI; persisted in localStorage)
let OLLAMA_BASE_URL = loadBaseUrl();
let API_KEY = loadApiKey();
let AUTH_SCHEME = loadAuthScheme(); // 'bearer' or 'x-api-key'

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
  // Set the base URL input from stored value
  const baseUrlInput = document.getElementById("baseUrlInput");
  if (baseUrlInput) baseUrlInput.value = OLLAMA_BASE_URL;
  const apiKeyInput = document.getElementById("apiKeyInput");
  if (apiKeyInput) apiKeyInput.value = API_KEY || "";
  const authSchemeSelect = document.getElementById("authSchemeSelect");
  if (authSchemeSelect) authSchemeSelect.value = AUTH_SCHEME || "bearer";

  checkOllamaConnection();
  refreshModels();

  // Auto-resize textarea
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
});

// ---- Auth & settings helpers ----
function loadApiKey() {
  try {
    return localStorage.getItem("ollama.apiKey") || "";
  } catch {
    return "";
  }
}

function loadAuthScheme() {
  try {
    const s = localStorage.getItem("ollama.authScheme");
    return s === "x-api-key" ? "x-api-key" : "bearer";
  } catch {
    return "bearer";
  }
}

function getAuthHeaders() {
  const headers = {};
  if (API_KEY) {
    if (AUTH_SCHEME === "x-api-key") headers["X-API-Key"] = API_KEY;
    else headers["Authorization"] = `Bearer ${API_KEY}`;
  }
  return headers;
}

function applyApiSettings() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const authSchemeSelect = document.getElementById("authSchemeSelect");
  API_KEY = (apiKeyInput?.value || "").trim();
  AUTH_SCHEME =
    authSchemeSelect?.value === "x-api-key" ? "x-api-key" : "bearer";
  try {
    if (API_KEY) localStorage.setItem("ollama.apiKey", API_KEY);
    else localStorage.removeItem("ollama.apiKey");
    localStorage.setItem("ollama.authScheme", AUTH_SCHEME);
  } catch {}
  updateServerStatusText("API settings saved", "info");
  // Re-test connection to reflect header changes
  checkOllamaConnection();
}

function clearApiKey() {
  API_KEY = "";
  try {
    localStorage.removeItem("ollama.apiKey");
  } catch {}
  const apiKeyInput = document.getElementById("apiKeyInput");
  if (apiKeyInput) apiKeyInput.value = "";
  updateServerStatusText("API key cleared", "info");
  checkOllamaConnection();
}

// Check if Ollama is running
async function checkOllamaConnection() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      headers: getAuthHeaders(),
    });
    if (response.ok) {
      statusIndicator.className = "status-indicator status-connected";
      updateServerStatusText("Connected", "connected");
      toggleConnectionHelp(false);
      return true;
    }
  } catch (error) {
    console.error("Ollama connection failed:", error);
  }

  statusIndicator.className = "status-indicator status-disconnected";
  updateServerStatusText(
    `Disconnected from ${OLLAMA_BASE_URL}. Check that Ollama is running and CORS is allowed.`,
    "disconnected"
  );
  toggleConnectionHelp(true);
  return false;
}

// Refresh available models
async function refreshModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      headers: getAuthHeaders(),
    });
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
    updateServerStatusText("Failed to load models", "disconnected");
  }
}

// Apply new base URL from input and re-check connection/models
function applyBaseUrl() {
  const input = document.getElementById("baseUrlInput");
  const url = (input?.value || "").trim().replace(/\/$/, "");
  if (!url) return;
  OLLAMA_BASE_URL = url;
  try {
    localStorage.setItem("ollama.baseUrl", OLLAMA_BASE_URL);
  } catch {}
  updateServerStatusText(`Using ${OLLAMA_BASE_URL}`, "info");
  checkOllamaConnection();
  refreshModels();
}

// Manually test the connection and show help when it fails
function testConnection() {
  updateServerStatusText("Testing...", "info");
  checkOllamaConnection();
}

function loadBaseUrl() {
  try {
    const stored = localStorage.getItem("ollama.baseUrl");
    if (stored && /^https?:\/\//i.test(stored))
      return stored.replace(/\/$/, "");
  } catch {}
  return "http://localhost:11434";
}

function updateServerStatusText(text, state) {
  const el = document.getElementById("serverStatusText");
  if (el) el.textContent = text;
}

function toggleConnectionHelp(show) {
  const help = document.getElementById("connectionHelp");
  if (!help) return;
  help.style.display = show ? "block" : "none";
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
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
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
