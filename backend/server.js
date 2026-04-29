// Load .env file first so API key is available
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const companies = require("./data/companies.json");

const app = express();
const PORT = 3001;

// Allow React frontend to talk to this server
app.use(cors());
// Let Express read JSON from requests
app.use(express.json());

// Create the AI client (reads API key from .env)
const client = new Anthropic();

// Health check — visit http://localhost:3001 to confirm it works
app.get("/", (req, res) => {
  res.json({ status: "Server is running!" });
});

// Main route — frontend sends a query, we return top 3 companies
app.post("/search", async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Please provide a search query." });
  }

  try {
    // Step 1: Ask AI to understand the user's request
    const parsed = await parseWithAI(query);
    console.log("AI understood:", parsed);

    // Step 2: Find matching companies
    const results = matchCompanies(parsed);
    console.log("Matches found:", results.length);

    // Step 3: Send results back to frontend
    res.json({ parsed, results });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Something went wrong. Check your API key." });
  }
});

// Ask Claude to convert plain text into structured data
async function parseWithAI(userInput) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `
You are a home service request parser for Spain (Madrid area).
Return ONLY a raw JSON object. No explanation. No markdown. No backticks.

User request: "${userInput}"

Return exactly this format:
{
  "service": "cleaning|plumbing|aircon|painting|electrician|unknown",
  "location": "madrid|getafe|unknown",
  "urgency": "today|tomorrow|this week|flexible",
  "budget": "cheap|normal|premium"
}

Rules:
- service: "sink","leak","pipe" = plumbing. "clean","dust","mop" = cleaning. "ac","air con","aire" = aircon.
- location: extract city in lowercase if mentioned, else "unknown"
- urgency: "asap","today","hoy" = today. "tomorrow","mañana" = tomorrow. else flexible.
- budget: "cheap","barato" = cheap. "best","top","premium" = premium. else normal.
        `.trim(),
      },
    ],
  });

  // Get text from Claude's response
  const rawText = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  // Remove any accidental backticks and parse as JSON
  const cleanJson = rawText.replace(/```json|```/gi, "").trim();
  return JSON.parse(cleanJson);
}

// Filter and sort companies from our JSON file
function matchCompanies({ service, location, budget }) {
  let matches = companies.filter((company) => {
    const serviceMatch = company.service === service;
    const locationMatch =
      location === "unknown" ||
      company.location === location.toLowerCase();
    return serviceMatch && locationMatch;
  });

  // Fallback: if no local match, show any company with that service
  if (matches.length === 0) {
    matches = companies.filter((c) => c.service === service);
  }

  // Sort by rating (cheap = lowest price first, else highest rated first)
  if (budget === "cheap") {
    matches.sort((a, b) => a.rating - b.rating);
  } else {
    matches.sort((a, b) => b.rating - a.rating);
  }

  return matches.slice(0, 3);
}
// Free address autocomplete using OpenStreetMap
app.get("/autocomplete", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const url = "https://nominatim.openstreetmap.org/search?format=json&countrycodes=es&limit=5&q=" + encodeURIComponent(query);
    const response = await fetch(url, {
      headers: { "User-Agent": "AIHomeServiceMatcher/1.0" }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});