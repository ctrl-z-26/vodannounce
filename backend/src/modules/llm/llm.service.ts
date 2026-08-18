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
Produce channel-specific content: an email subject/body, a mobile push notification
(keep it concise, aim for <=150 characters - best practice for push display, short
subject-line style), and a Teams message (null when Teams is not selected).

Determine the audience from the announcement's NATURE, not from explicit group names:
- Announcements rarely name every group. Classify what the announcement is about and infer who needs to know.
- A location name targets everyone whose group is based at that location. For area-based announcements
  (fire, outage, facilities), prefer a location target and let the system expand it to every group
  there - do not enumerate guilds.
- A group name targets the members of that group. Use groups for organizational audiences
  (technical incident -> technical guilds, security threat -> security team).
- targets is a list of cells. Each cell is an AND of its targets; cells are OR-ed together (union).
  Example: [["Security"], ["B1"]] means "Security group OR everyone at B1".

- Avoid umbrella groups (Management, HR, All) by default. Include them only when the announcement's
  scope genuinely warrants it: HR for staff-facing operational changes (office closure, layoffs,
  policy), Management for high-impact or company-wide crises.
- Impact drives management: localized or medium-urgency announcements usually do not include
  management; critical or company-wide ones may.
- Only use exact names from the provided groups/locations lists, correctly tagged by type.
  Deduplicate names.
Common scenarios:
- Physical issues (fire, network down, no place to reserve) -> the location plus security team and facilities.
- Cyber security attacks -> guilds and the cyber security team.
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
