const express = require("express");
const path = require("path");
// No Google AI needed anymore!

const app = express();
const port = process.env.PORT || 10000;

// --- Middleware ---
app.use(express.json());
app.use(express.static("public", { etag: false, maxAge: 0 }));

// --- HTML Page Routes ---

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/patternguard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patternguard.html"));
});

// --- NEW: Mock AI Response Function ---
// This function pretends to be the AI
function getMockResponse(endpoint, text) {
  // We add a fake delay to look like it's "thinking"
  return new Promise((resolve) => {
    setTimeout(() => {
      let response = "";
      if (endpoint === "summarize") {
        response = "This is a mock summary of your text. The real AI is not connected.";
      } else if (endpoint === "fix-grammar") {
        response = "This is a mock grammar fix. The real AI is not connected.";
      } else if (endpoint === "translate") {
        response = "This is a mock translation. The real AI is not connected.";
      } else if (endpoint === "generate") {
        response = `This is a mock response to your prompt: "${text}". The real AI is not connected.`;
      }
      resolve(response);
    }, 1000); // 1-second delay
  });
}

// --- API Endpoints ---
const apiEndpoints = ["summarize", "fix-grammar", "translate", "generate"];

apiEndpoints.forEach((endpoint) => {
  app.post(`/${endpoint}`, async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // NEW: We call our mock function instead of Google
    try {
      const aiText = await getMockResponse(endpoint, text);
      res.json({ text: aiText });
    } catch (error) {
      console.error(`Error with mock /${endpoint}:`, error);
      res.status(500).json({ error: "Failed to generate mock response." });
    }
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});
