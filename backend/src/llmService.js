import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Zod Schema for backend validation
export const campaignAnalysisZodSchema = z.object({
  urgency: z.enum(["NORMAL", "IMPORTANT", "CRITICAL"]),
  recommended_audiences: z.array(z.string()),
  missing_info_detected: z.boolean(),
  clarification_questions: z.array(z.string()),
  formatted_messages: z.object({
    outlook_email_html: z.string(),
    teams_markdown: z.string(),
    mobile_push: z.string().max(150),
    sms: z.string().max(160),
  }),
});

// Gemini JSON Response Schema
const campaignResponseSchema = {
  type: Type.OBJECT,
  properties: {
    urgency: {
      type: Type.STRING,
      enum: ["NORMAL", "IMPORTANT", "CRITICAL"],
    },
    recommended_audiences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    missing_info_detected: {
      type: Type.BOOLEAN,
    },
    clarification_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    formatted_messages: {
      type: Type.OBJECT,
      properties: {
        outlook_email_html: { type: Type.STRING },
        teams_markdown: { type: Type.STRING },
        mobile_push: { type: Type.STRING },
        sms: { type: Type.STRING },
      },
      required: ["outlook_email_html", "teams_markdown", "mobile_push", "sms"],
    },
  },
  required: [
    "urgency",
    "recommended_audiences",
    "missing_info_detected",
    "clarification_questions",
    "formatted_messages",
  ],
};

const SYSTEM_INSTRUCTION = `
You are the AI engine for CommsFlow AI.
Analyze raw corporate announcement prompts and output JSON matching the strict schema.
Detect if essential parameters (date, time, exact locations, systems) are missing. If so, set missing_info_detected to true and ask clarification questions.
Classify urgency (NORMAL, IMPORTANT, CRITICAL) and provide channel-specific messages.
`;

export async function analyzeAnnouncement(promptText) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Analyze this announcement prompt:\n\n"${promptText}"`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: campaignResponseSchema,
      temperature: 0.2,
    },
  });

  const rawJson = JSON.parse(response.text);
  return campaignAnalysisZodSchema.parse(rawJson);
}