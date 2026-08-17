import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeAnnouncement } from "./llmService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/campaigns/analyze", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json({ error: "A valid 'prompt' string is required." });
    }

    const result = await analyzeAnnouncement(prompt);
    return res.status(200).json(result);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: "Failed to analyze announcement.",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});