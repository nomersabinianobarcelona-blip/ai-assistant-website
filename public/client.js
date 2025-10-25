document.addEventListener('DOMContentLoaded', () => {
  // Get all elements
  const inputEl = document.getElementById('input-text');
  const outputEl = document.getElementById('output-text');
  const summarizeBtn = document.getElementById('summarize-btn');
  const fixBtn = document.getElementById('fix-btn');
  const copyBtn = document.getElementById('copy-btn');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const apiKeyInput = document.getElementById('api-key');
  const statusEl = document.getElementById('status');
  const fixSummarizeBtn = document.getElementById('fix-summarize-btn');
  const detectAiBtn = document.getElementById('detect-ai-btn');

  // We'll hide the settings section since the key is on the server
  const settingsEl = document.querySelector('.settings');
  const settingsHr = settingsEl.previousElementSibling; // Get the <hr>
  if (settingsEl) {
    settingsEl.style.display = 'none';
  }
  if (settingsHr) {
    settingsHr.style.display = 'none';
  }
  
  // --- AI Actions ---
  summarizeBtn.addEventListener('click', () => {
    // We now call our server's /api/summarize endpoint
    performAction('/api/summarize');
  });
  fixBtn.addEventListener('click', () => {
    performAction('/api/fixGrammar');
  });
  fixSummarizeBtn.addEventListener('click', () => {
    performAction('/api/fixAndSummarize');
  });
  detectAiBtn.addEventListener('click', () => {
    performAction('/api/detectAI');
  });
  
  // This function sends the text to our server
  async function performAction(apiEndpoint) {
    const text = inputEl.value;
    if (!text) {
      outputEl.value = 'Please enter some text first.';
      return;
    }
    
    if (apiEndpoint === '/api/fixAndSummarize') {
        outputEl.value = 'Working on it (this takes two steps)...';
    } else {
        outputEl.value = 'Working on it...';
    }

    try {
      // Send the text to our own server
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      outputEl.value = data.result;

    } catch (error) {
      outputEl.value = `Error: ${error.message}`;
    }
  }

  // --- Copy Button (Same as before) ---
  copyBtn.addEventListener('click', () => {
    if (!outputEl.value) return;
    navigator.clipboard.writeText(outputEl.value)
      .then(() => {
        showStatus('Result copied to clipboard!', 'green');
      })
      .catch(err => {
        showStatus('Failed to copy.', 'red');
      });
  });

  // --- Utility (Same as before) ---
  function showStatus(message, color) {
    statusEl.textContent = message;
    statusEl.style.color = color;
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  }
});
