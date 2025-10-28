// Get all the elements we need
const summarizeBtn = document.getElementById("summarize-btn");
const fixGrammarBtn = document.getElementById("fix-grammar-btn");
const translateBtn = document.getElementById("translate-btn");
const generateBtn = document.getElementById("generate-btn");
const copyBtn = document.getElementById("copy-btn");

const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");

const statusMessage = document.getElementById("status-message");
const loadingMessage = document.getElementById("loading-message");

// --- Event Listeners for Buttons (with safety checks) ---

// These buttons only exist on the "GmAIl Helper" page
if (summarizeBtn) {
  summarizeBtn.addEventListener("click", () => {
    const text = inputText.value;
    if (text) {
      callApi("summarize", text);
    }
  });
}

if (fixGrammarBtn) {
  fixGrammarBtn.addEventListener("click", () => {
    const text = inputText.value;
    if (text) {
      callApi("fix-grammar", text);
    }
  });
}

if (translateBtn) {
  translateBtn.addEventListener("click", () => {
    const text = inputText.value;
    if (text) {
      callApi("translate", text);
    }
  });
}

// This button only exists on the "PatternGuard" page
if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    const text = inputText.value;
    if (text) {
      callApi("generate", text);
    }
  });
}

// This button exists on both pages
if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    copyToClipboard(outputText.value);
  });
}

// --- Main API Call Function ---
async function callApi(endpoint, text) {
  loadingMessage.style.display = "block";
  statusMessage.style.display = "none";
  outputText.value = ""; // Clear old output

  try {
    const response = await fetch(`/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "An unknown error occurred");
    }

    const data = await response.json();
    outputText.value = data.text.trim();
  } catch (error) {
    console.error("Error:", error);
    statusMessage.innerText = "Error: " + error.message;
    statusMessage.style.display = "block";
  } finally {
    loadingMessage.style.display = "none";
  }
}

// --- Helper Function ---
function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      statusMessage.innerText = "Copied to clipboard!";
      statusMessage.style.display = "block";
      setTimeout(() => {
        statusMessage.style.display = "none";
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
      statusMessage.innerText = "Failed to copy.";
      statusMessage.style.display = "block";
    });
}
