
require("dotenv").config();

const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

const TEXT_MODEL = process.env.GEMINI_MODEL;

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// JSON support
app.use(express.json({ limit: "20kb" }));

// ==========================================
// GOOGLE SEARCH ENGINE - SEO ROUTES
// ==========================================

// robots.txt
app.get("/robots.txt", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.type("text/plain");

  res.send(
    "User-agent: *\n" +
    "Allow: /\n\n" +
    "Sitemap: https://skillsphere-1fzr.onrender.com/sitemap.xml"
  );
});

// sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.type("application/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://skillsphere-1fzr.onrender.com/</loc>
  </url>
</urlset>`);
});

// ==========================================
// WEBSITE FILES
// ==========================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "SkillSphere server is running"
  });
});

// ==========================================
// AI STUDENT COACH
// ==========================================

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
    console.error("AI backend error:", error?.message || error);
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
          "API key reject hui. .env mein key aur permissions check karo."
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

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`SkillSphere running on port ${PORT}`);
  console.log(`Text model: ${TEXT_MODEL || "not configured"}`);
  console.log("SEO routes: robots.txt and sitemap.xml enabled");
});
