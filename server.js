const express = require("express");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 10000;

// --- Middleware ---
app.use(express.json());

// Serves your frontend (public folder) and disables all caching
app.use(express.static("public", { etag: false, maxAge: 0 }));

// --- API Key Setup ---
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

// --- HTML Page Routes ---

// Serve the main page (GmAIl Helper)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// NEW: Serve the PatternGuard page
app.get("/patternguard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patternguard.html"));
});

// --- API Endpoints ---
const apiEndpoints = ["summarize", "fix-grammar", "translate", "generate"];

apiEndpoints.forEach((endpoint) => {
  app.post(`/${endpoint}`, async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const prompts = {
      summarize: `Summarize this text: "${text}"`,
      "fix-grammar": `Fix the grammar of this text: "${text}"`,
      translate: `Translate this text to English: "${text}"`,
      generate: text, // For 'generate', the text *is* the prompt
    };

    try {
      const prompt = prompts[endpoint];
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();
      res.json({ text: aiText });
    } catch (error) {
      console.error(`Error with /${endpoint}:`, error);
      res.status(500).json({ error: "Failed to generate AI response." });
    }
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});




