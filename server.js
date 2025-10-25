// --- 1. Setup our server ---
const express = require("express");
const fetch = require("node-fetch"); // Import node-fetch
const app = express();

app.use(express.static("public")); // Serves your frontend (public folder)
app.use(express.json()); // Lets us read JSON from requests

// --- 2. Get the Secret Key ---
// process.env.HF_KEY is how Render securely reads your secret key
const HUGGING_FACE_KEY = process.env.HF_KEY;
const HF_API_URL = "https://router.huggingface.co/hf-inference/models/";
const LT_API_URL = "https://api.languagetool.org/v2/check";

// --- 3. Create API Endpoints ---
// This is where our frontend (client.js) will send its requests

// Endpoint for Summarize
app.post("/api/summarize", async (req, res) => {
  try {
    const text = req.body.text;
    const prompt = getSafeSummarizePrompt(text);
    
    const aiResponse = await fetch(HF_API_URL + "facebook/bart-large-cnn", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HUGGING_FACE_KEY}` },
      body: JSON.stringify({ "inputs": prompt, "options": { "wait_for_model": true } })
    });
    
    if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`Summarize API Error: ${errorText}`);
    }
    
    const data = await aiResponse.json();
    const summary = parseSummary(data);
    res.json({ result: summary });
    
  } catch (error) {
    console.error("Summarize Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for Fix Grammar
app.post("/api/fixGrammar", async (req, res) => {
  try {
    const text = req.body.text;
    
    const ltResponse = await fetch(LT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: `text=${encodeURIComponent(text)}&language=en-US`
    });
    
    if (!ltResponse.ok) {
        const errorText = await ltResponse.text();
        throw new Error(`Grammar API Error: ${errorText}`);
    }
    
    const data = await ltResponse.json();
    const correctedText = parseGrammar(text, data);
    res.json({ result: correctedText });

  } catch (error) {
    console.error("Grammar Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for AI Detector
app.post("/api/detectAI", async (req, res) => {
  try {
    const text = req.body.text;
    const prompt = getSafeDetectorPrompt(text);

    const aiResponse = await fetch(HF_API_URL + "Hello-SimpleAI/chatgpt-detector-roberta", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HUGGING_FACE_KEY}` },
      body: JSON.stringify({ "inputs": prompt, "options": { "wait_for_model": true } })
    });

    if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`AI Detector API Error: ${errorText}`);
    }
    
    const data = await aiResponse.json();
    const result = parseDetector(data);
    res.json({ result: result });
    
  } catch (error) {
    console.error("Detect AI Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for Fix & Summarize
app.post("/api/fixAndSummarize", async (req, res) => {
  try {
    const text = req.body.text;
    
    // Step 1: Fix Grammar
    const ltResponse = await fetch(LT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: `text=${encodeURIComponent(text)}&language=en-US`
    });
    if (!ltResponse.ok) throw new Error("Grammar check failed in Fix&Summarize");
    const grammarData = await ltResponse.json();
    const correctedText = parseGrammar(text, grammarData);
    
    // Step 2: Summarize the corrected text
    const prompt = getSafeSummarizePrompt(correctedText);
    const hfResponse = await fetch(HF_API_URL + "facebook/bart-large-cnn", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HUGGING_FACE_KEY}` },
      body: JSON.stringify({ "inputs": prompt, "options": { "wait_for_model": true } })
    });
    if (!hfResponse.ok) throw new Error("Summarize failed in Fix&Summarize");
    const summaryData = await hfResponse.json();
    const summary = parseSummary(summaryData);
    
    res.json({ result: summary });
    
  } catch (error) {
    console.error("Fix & Summarize Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- 4. Helper Functions (Parsing logic) ---
// We moved all the logic from the old background.js here.

function getSafeSummarizePrompt(text) {
  const MAX_SUMMARY_CHARS = 4000;
  if (text.length > MAX_SUMMARY_CHARS) {
    return text.substring(0, MAX_SUMMARY_CHARS);
  }
  return text;
}

function parseSummary(data) {
  try {
    let summaryText = data[0].summary_text.trim();
    const lastPeriod = summaryText.lastIndexOf('.');
    if (lastPeriod > -1) {
      summaryText = summaryText.substring(0, lastPeriod + 1);
    }
    return summaryText;
  } catch (e) {
    console.error("Error parsing summary:", data, e);
    return "Could not parse summary response.";
  }
}

function getSafeDetectorPrompt(text) {
  const MAX_DETECTOR_CHARS = 1800;
  if (text.length > MAX_DETECTOR_CHARS) {
    return text.substring(0, MAX_DETECTOR_CHARS);
  }
  return text;
}

function parseDetector(data) {
  try {
    const scores = data[0];
    if (!scores || !Array.isArray(scores)) {
      throw new Error("Invalid response format from AI detector.");
    }
    const aiScoreItem = scores.find(item => item.label === 'ChatGPT'); 
    const humanScoreItem = scores.find(item => item.label === 'Human');
    const aiPercent = (aiScoreItem ? aiScoreItem.score * 100 : 0).toFixed(1);
    const humanPercent = (humanScoreItem ? humanScoreItem.score * 100 : 0).toFixed(1);
    return `AI-Generated: ${aiPercent}%\nHuman-Written: ${humanPercent}%\n\n(Warning: This result is a best guess and may be inaccurate.)`;
  } catch (e) {
    console.error("Error parsing detector response:", data, e);
    return "Could not parse detector response.";
  }
}

function parseGrammar(originalText, data) {
  try {
    const matches = data.matches;
    if (!matches || !matches.length) return originalText;

    let correctedText = originalText;
    let offsetCorrection = 0; 
    for (const match of matches) {
      if (!match.replacements || !match.replacements.length) continue;
      
      const originalFragment = correctedText.substring(match.offset + offsetCorrection, match.offset + offsetCorrection + match.length);
      const replacement = match.replacements[0].value; 

      correctedText = correctedText.substring(0, match.offset + offsetCorrection) + 
                      replacement + 
                      correctedText.substring(match.offset + offsetCorrection + match.length);
      
      offsetCorrection += (replacement.length - originalFragment.length);
    }
    return correctedText;
  } catch (e) {
    console.error("Error parsing grammar response:", data, e);
    return originalText; // Return original text if parsing fails
  }
}

// --- 5. Start the server ---
// Render will provide the PORT, or we default to 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});