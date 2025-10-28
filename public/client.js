// Get all the elements we need
const summarizeBtn = document.getElementById("summarize-btn");
const fixGrammarBtn = document.getElementById("fix-grammar-btn");
const translateBtn = document.getElementById("translate-btn");
const generateBtn = document.getElementById("generate-btn");
const copyBtn = document.getElementById("copy-btn");

const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");

// NEW: Get the status and loading message elements
const statusMessage = document.getElementById("status-message");
const loadingMessage = document.getElementById("loading-message");

// --- Event Listeners for Buttons ---

summarizeBtn.addEventListener("click", () => {
  const text = inputText.value;
  if (text) {
    callApi("summarize", text);
  }
});

fixGrammarBtn.addEventListener("click", () => {
  const text = inputText.value;
  if (text) {
    callApi("fix-grammar", text);
  }
});

translateBtn.addEventListener("click", () => {
  const text = inputText.value;
  if (text) {
    callApi("translate", text);
  }
});

generateBtn.addEventListener("click", () => {
  const text = inputText.value;
  if (text) {
    callApi("generate", text);
  }
});

copyBtn.addEventListener("click", () => {
  copyToClipboard(outputText.value);
});

// --- Main API Call Function ---
async function callApi(endpoint, text) {
  // NEW: Show loading, hide status
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
    // NEW: Show error in status
    statusMessage.innerText = "Error: " + error.message;
    statusMessage.style.display = "block";
  } finally {
    // NEW: Hide loading message when done
    loadingMessage.style.display = "none";
  }
}

// --- Helper Function ---
function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // NEW: Show status message
      statusMessage.innerText = "Copied to clipboard!";
      statusMessage.style.display = "block";
      setTimeout(() => {
        statusMessage.style.display = "none";
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
      // NEW: Show error in status
      statusMessage.innerText = "Failed to copy.";
      statusMessage.style.display = "block";
    });
}
