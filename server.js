const express = require("express");
const path = require("path");

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

// --- NEW: Smart Mock AI Response Function ---
function getMockResponse(endpoint, text, mode = "student", subject = "general") {
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
        
        // --- NEW: Smart mock response using mode and subject ---
        const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
        
        if (mode === "student") {
          response = `[MOCK STUDENT | ${capitalizedSubject}] You asked about: "${text}". That's a great question for ${subject}! What do you think is the first step?`;
        } else if (mode === "teacher") {
          response = `[MOCK TEACHER | ${capitalizedSubject}] Here is a lesson plan for "${text}" in your ${subject} class.\n\n1. Objective\n2. Materials\n3. Activity`;
        } else {
          response = `This is a mock response to your prompt: "${text}". The real AI is not connected.`;
        }
        // --- END NEW ---
      }
      resolve(response);
    }, 1000); // 1-second delay
  });
}

// --- API Endpoints ---
const apiEndpoints = ["summarize", "fix-grammar", "translate", "generate"];

apiEndpoints.forEach((endpoint) => {
  app.post(`/${endpoint}`, async (req, res) => {
    // --- NEW: Read text, mode, AND subject from the request ---
    const { text, mode, subject } = req.body;
    // --- END NEW ---

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // NEW: We call our mock function (now with mode and subject)
    try {
      const aiText = await getMockResponse(endpoint, text, mode, subject);
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
