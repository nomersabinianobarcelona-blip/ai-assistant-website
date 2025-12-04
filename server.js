const express = require("express");
const path = require("path");
// --- NEW: Import the Google AI SDK ---
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 10000;

// --- NEW: Initialize Google AI ---
const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

let genAI;
let model;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: MODEL_NAME });
  console.log("Google AI Initialized successfully.");
} else {
  console.error(
    "FATAL ERROR: GEMINI_API_KEY environment variable is not set."
  );
}

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

// --- NEW: This is the REAL AI Function ---
async function getRealAIResponse(endpoint, text, mode = "student", subject = "general") {
  // 1. Check if the AI model is available
  if (!model) {
    throw new Error("AI model is not initialized. Check API key.");
  }

  // 2. Build the "prompt" (the instructions for the AI)
  let prompt = "";
  const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);

  if (endpoint === "summarize") {
    prompt = `Summarize this text in a few concise sentences: "${text}"`;
  } else if (endpoint === "fix-grammar") {
    prompt = `Correct the grammar and spelling of this text. Only return the corrected text: "${text}"`;
  } else if (endpoint === "translate") {
    prompt = `Translate this text to English. Only return the translated text: "${text}"`;
  } else if (endpoint === "generate") {
    // This is for our chatbot
    if (mode === "student") {
      prompt = `You are a helpful and encouraging tutor. A student is asking about "${text}" in a ${capitalizedSubject} context. Do not give the answer directly. Instead, ask a guiding question to help them think about the first step.`;
    } else if (mode === "teacher") {
      prompt = `You are an expert curriculum assistant. A teacher needs a simple lesson plan idea for "${text}" for their ${capitalizedSubject} class. Provide a brief, 3-step lesson plan (Objective, Activity, Assessment).`;
    }
  }

  if (prompt === "") {
    throw new Error("Invalid endpoint or mode.");
  }

  // 3. Set safety configurations
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  // 4. Call the AI
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    const aiText = response.candidates[0].content.parts[0].text;
    return aiText;

  } catch (error) {
    console.error("Error calling Google AI:", error);
    if (error.message.includes("403")) {
       throw new Error("API key is not valid or does not have Vertex AI permission.");
    }
    if (error.message.includes("API key not valid")) {
       throw new Error("The API key is invalid. Please check it again.");
    }
    throw new Error("The AI service failed to respond.");
  }
}

// --- API Endpoints ---
const apiEndpoints = ["summarize", "fix-grammar", "translate", "generate"];

apiEndpoints.forEach((endpoint) => {
  app.post(`/${endpoint}`, async (req, res) => {
    const { text, mode, subject } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // --- NEW: We call the REAL AI function ---
    try {
      const aiText = await getRealAIResponse(endpoint, text, mode, subject);
      res.json({ text: aiText });
    } catch (error) {
      console.error(`Error with /${endpoint}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});



