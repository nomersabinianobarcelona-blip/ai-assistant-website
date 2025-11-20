// This function detects which page we're on by looking at the <body> id
document.addEventListener("DOMContentLoaded", () => {
  const bodyId = document.body.id;

  if (bodyId === "page-gmail-helper") {
    setupGmailHelper();
  } else if (bodyId === "page-patternguard") {
    setupPatternGuard();
  }
});

// --- SECTION 1: GmAIl Helper Page ---
function setupGmailHelper() {
  const summarizeBtn = document.getElementById("summarize-btn");
  const fixGrammarBtn = document.getElementById("fix-grammar-btn");
  const translateBtn = document.getElementById("translate-btn");
  const copyBtn = document.getElementById("copy-btn");
  const inputText = document.getElementById("input-text");
  const outputText = document.getElementById("output-text");

  if (summarizeBtn) {
    summarizeBtn.addEventListener("click", () =>
      handleApiCall("summarize", inputText, outputText)
    );
  }
  if (fixGrammarBtn) {
    fixGrammarBtn.addEventListener("click", () =>
      handleApiCall("fix-grammar", inputText, outputText)
    );
  }
  if (translateBtn) {
    translateBtn.addEventListener("click", () =>
      handleApiCall("translate", inputText, outputText)
    );
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", () =>
      copyToClipboard(outputText.value)
    );
  }
}

// --- SECTION 2: PatternGuard Page ---
function setupPatternGuard() {
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatWindow = document.getElementById("chat-window");
  const subjectTabsContainer = document.querySelector(".subject-tabs");

  if (!chatForm) return; // Make sure the elements exist

  // --- NEW: Handle Subject Tab Clicks ---
  let activeSubject = "general"; // Default subject
  
  if (subjectTabsContainer) {
    subjectTabsContainer.addEventListener("click", (e) => {
      // Check if a tab button was clicked
      if (e.target.classList.contains("subject-tab")) {
        // Remove 'active' class from all tabs
        document.querySelectorAll(".subject-tab").forEach(tab => {
          tab.classList.remove("active");
        });
        
        // Add 'active' class to the clicked tab
        e.target.classList.add("active");
        
        // Update the active subject
        activeSubject = e.target.dataset.subject;
      }
    });
  }
  // --- END NEW ---

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Stop the page from reloading
    const message = chatInput.value.trim();

    if (message === "") return; // Don't send empty messages

    // Get the selected mode
    const selectedMode = document.querySelector(
      'input[name="mode"]:checked'
    ).value;

    // 1. Add user's message to the chat window
    addMessageToChat(message, "user");
    chatInput.value = ""; // Clear the input box

    // 2. Show a "loading" or "typing" indicator
    showLoading(true);

    try {
      // 3. Send to the server (NOW WITH MODE AND SUBJECT)
      const response = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // --- NEW: Send text, mode, and subject ---
        body: JSON.stringify({ 
          text: message, 
          mode: selectedMode,
          subject: activeSubject // Send the active subject
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get a response.");
      }

      const data = await response.json();
      const aiText = data.text;

      // 4. Hide loading and add AI's message to the window
      showLoading(false);
      addMessageToChat(aiText, "ai");
    } catch (error) {
      showLoading(false);
      addMessageToChat(
        "Error: Could not get a response from the server.",
        "ai"
      );
    }
  });

  // Helper function to add a new bubble to the chat window
  function addMessageToChat(text, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.classList.add(sender); // 'user' or 'ai'
    messageElement.textContent = text;
    chatWindow.appendChild(messageElement);

    // Automatically scroll to the bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

// --- SECTION 3: Shared Helper Functions ---

// This function calls our server (for GmAIl Helper)
async function handleApiCall(endpoint, inputEl, outputEl) {
  const text = inputEl.value;
  if (!text) {
    showStatus("Please enter some text.", "error");
    return;
  }

  showLoading(true);
  outputEl.value = ""; // Clear old output

  try {
    const response = await fetch(`/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate AI response.");
    }

    const data = await response.json();
    outputEl.value = data.text;
  } catch (error) {
    console.error(`Error with /${endpoint}:`, error);
    outputEl.value = `Error: ${error.message}`;
  } finally {
    showLoading(false);
  }
}

// Shows/hides the "Loading..." message
function showLoading(isLoading) {
  const loading = document.getElementById("loading-message");
  if (loading) {
    loading.style.display = isLoading ? "block" : "none";
  }
}

// Shows a status message (like "Copied!")
function showStatus(message, type = "success") {
  const status = document.getElementById("status-message");
  if (status) {
    status.textContent = message;
    status.style.color = type === "error" ? "#dc3545" : "#28a745";
    status.style.display = "block";
    setTimeout(() => {
      status.style.display = "none";
    }, 3000);
  }
}

// Copies text to the clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showStatus("Copied to clipboard!");
    })
    .catch((err) => {
      showStatus("Failed to copy.", "error");
    });
}
