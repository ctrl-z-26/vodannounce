import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '@shared/config/env.js';
import { campaignAnalysisSchema, type CampaignAnalysis } from './llm.schema.js';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are the AI engine for Vodannounce.
Analyze raw corporate announcement prompts and output JSON matching the strict schema.
Classify priority (normal, important, critical) based on urgency and impact.
Select delivery channels (email, teams, mobile_push) appropriate for the announcement.
Produce channel-specific content: an email subject/body, a mobile push notification (max 150 chars),
and a Teams message (null when Teams is not selected).

Determine the audience using the target set below:
- A group name targets the members of that group.
- A location name targets everyone whose group is based at that location.
- targets is a list of cells. Each cell is an AND of its targets; cells are OR-ed together (union).
  Example: [["Security"], ["B1"]] means "Security group OR everyone at B1".

Only use exact names from the provided groups/locations lists, correctly tagged by type.
Deduplicate names; use an empty list for a dimension you cannot infer.
Common scenarios:
- Physical issues (fire, network down, no place to reserve) -> technical guilds, security team, facilities.
- Cyber security attacks -> market groups, guilds, and the cyber security team.
- Global incidents (e.g., GitHub down) -> guilds and market groups.

Reference email format (use for tone/structure only, do not overfit to this example):

Subject: New LLMs now available in GitHub Copilot

Body:
**Dear GitHub Customer,**

We are pleased to announce that the following additional Large Language Models (LLMs) are now available for Vodafone users in GitHub Copilot:
**- OpenAI GPT-5.5**
**- Claude Sonnet 5**
**- Claude Opus 5**
These models can now be selected within GitHub Copilot to support a wider range of development and AI-assisted coding use cases.

**Not yet onboarded to GitHub Copilot?**

If you are not yet a GitHub Copilot user on GHEC, please follow the onboarding guide below:
`;

/**
 * Analyzes a raw announcement prompt via Gemini, returning a structured
 * campaign analysis (priority, channels, formatted content, audience targets).
 *
 * @param promptText - The manager's natural-language announcement draft.
 * @param targetContext - The exact group/location names Gemini may reference.
 * @returns A validated campaign analysis matching the zod schema.
 */
export async function analyzeAnnouncement(
    promptText: string,
    targetContext: { groups: string[]; locations: string[] },
): Promise<CampaignAnalysis> {
    const systemInstruction = `${SYSTEM_INSTRUCTION}

Groups: ${targetContext.groups.join(', ') || '(none)'}
Locations: ${targetContext.locations.join(', ') || '(none)'}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this announcement prompt:\n\n"${promptText}"`,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseJsonSchema: z.toJSONSchema(campaignAnalysisSchema),
            temperature: 0.2,
        },
    });

    if (!response.text) {
        throw new Error('Gemini returned an empty response');
    }
    const rawJson = JSON.parse(response.text);
    return campaignAnalysisSchema.parse(rawJson);
}
