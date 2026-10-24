
require("dotenv").config();

const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

// Model ka naam .env file se set kar sakte ho.
// Apne Google AI Studio mein available model ID use karo.
const TEXT_MODEL = process.env.GEMINI_MODEL;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Agar index.html project ke main folder mein hai,
// to public folder ki jagah project folder serve karo.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "SkillSphere server is running"
  });
});

app.post("/api/chat", async (req, res) => {
  console.log("POST /api/chat received");
  try {
    const question = req.body?.question;

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Pehle apna question type karo."
      });
    }

    if (question.length > 4000) {
      return res.status(400).json({
        error: "Question bahut lamba hai. 4000 characters se kam rakho."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "GEMINI_API_KEY .env file mein set nahi hai."
      });
    }

    if (!TEXT_MODEL) {
      return res.status(503).json({
        error: "GEMINI_MODEL .env file mein set nahi hai."
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "You are SkillSphere AI Coach. Give accurate, helpful answers " +
                "in simple Hinglish when the user writes in Hinglish. " +
                "Explain school topics clearly and safely. Question: " +
                question.trim()
            }
          ]
        }
      ]
    });

    // Google GenAI SDK ke text output ko safely read karo.
    const answer =
      typeof result.text === "string"
        ? result.text.trim()
        : (result.candidates?.[0]?.content?.parts || [])
            .map((part) => part.text || "")
            .join("")
            .trim();

    if (!answer) {
      console.error(
        "AI response mein text nahi mila. Candidate finish reason:",
        result.candidates?.[0]?.finishReason
      );

      return res.status(502).json({
        error: "AI ne readable answer nahi diya. Dobara try karo."
      });
    }

    return res.json({ answer });
  } catch (error) {
    console.error(
      "AI backend error:",
      error?.message || error
    );
    console.error(error);

    const message = String(error?.message || "");

    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED")
    ) {
      return res.status(429).json({
        error:
          "AI quota khatam hai ya request limit pahunch gayi. " +
          "Google AI Studio mein quota check karo."
      });
    }

    if (
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid") ||
      message.includes("401") ||
      message.includes("403")
    ) {
      return res.status(502).json({
        error:
          "API key reject hui. .env mein key aur uski permissions check karo."
      });
    }

    if (
      message.includes("404") ||
      message.includes("NOT_FOUND")
    ) {
      return res.status(502).json({
        error:
          "Model nahi mila. Google AI Studio mein available model ID check karo."
      });
    }

    return res.status(500).json({
      error:
        "AI server mein error aaya. Terminal mein AI backend error dekho."
    });
  }
});

app.listen(PORT, () => {
  console.log(`SkillSphere running at http://localhost:${PORT}`);
  console.log(`Text model: ${TEXT_MODEL || "not configured"}`);
});
