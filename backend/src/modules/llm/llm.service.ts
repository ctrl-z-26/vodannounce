import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '@shared/config/env.js';
import type { TargetContext, TargetingExpression } from '@root-shared/types/campaign.js';
import {
    campaignAnalysisSchema,
    targetSchema,
    type CampaignAnalysis,
} from './llm.schema.js';

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
- Each cell should target a cohesive audience unit. Use separate cells when
  different groups need to know for different reasons. Example: a fire at
  Main Street targets [Main Street] as one cell and [Security] as another —
  they are targeted for different reasons (location-based vs. role-based).
- Do NOT combine unrelated groups into a single cell. A single cell means
  all targets must apply simultaneously — this rarely makes sense for more
  than 2-3 closely related targets.

- Avoid umbrella groups (Management, HR) by default. Include them only when the announcement's
  scope genuinely warrants it: HR for staff-facing operational changes (office closure, layoffs,
  policy), Management for high-impact or company-wide crises.
- "All" targets every employee. Use it ONLY when the announcement is genuinely
  relevant to every single employee (e.g., office closure, holiday, benefits change).
  Do NOT use "All" for incidents that only affect a subset of the company — target
  the specific groups instead. "All" must always appear as a standalone cell —
  never ANDed nor ORed with other targets. To target everyone at a location,
  use the location name on its own instead.
- Impact drives management: localized or medium-urgency announcements usually do not include
  management; critical or company-wide ones may.
- Err on the side of fewer targets. Over-targeting causes notification fatigue.
  When deciding whether to include a group, ask: 'Would members of this group
  need to take action or change behavior because of this announcement?'
  If the answer is no, exclude them — even if the incident is critical.
  Severity does not equal relevance.
- A location target already expands to every group at that location — do not
  redundantly add individual groups from that location.
- Only use exact names from the provided groups/locations lists, correctly tagged by type.
  Deduplicate names.
- Match targeting to the announcement's nature: location-based for physical
  area issues, group-based for organizational audiences. Let the system
  handle expansion — do not enumerate sub-targets manually.
Common scenarios:
- Physical issues (fire, network down, no place to reserve) → the location plus security team and facilities.
- Cyber security attacks → guilds and the cyber security team.
- Phishing emails (received or clicked) → guilds, market groups, and the cyber security team. For phishing announcements, append a distinct section at the end of the email body instructing recipients who received or clicked the phishing email to report immediately to csoc@vodafone.com. Use a clear heading like "⚠ Phishing Report Required" and keep the instruction concise.
- Global incidents (e.g., GitHub down) → guilds and market groups.

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
 * Builds the full system instruction by appending the exact group/location
 * names Gemini may reference as targets.
 */
function buildSystemInstruction(targetContext: TargetContext): string {
    const groupList = targetContext.groups
        .map((g) => (g.description ? `${g.name} (${g.description})` : g.name))
        .join(', ');
    return `${SYSTEM_INSTRUCTION}

Groups: ${groupList || '(none)'}
Locations: ${targetContext.locations.join(', ') || '(none)'}`;
}

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
    targetContext: TargetContext,
): Promise<CampaignAnalysis> {
    const response = await ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: `Analyze this announcement prompt:\n\n"${promptText}"`,
        config: {
            systemInstruction: buildSystemInstruction(targetContext),
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

/** Zod schema for the targets-only repair response. */
const repairedTargetsSchema = z.array(z.array(targetSchema)).min(1);

/**
 * Asks Gemini to correct invalid audience targets from a previous analysis.
 *
 * Replays the original exchange as conversation history and appends a
 * corrective user turn naming the invalid targets; the response is constrained
 * to a targets-only JSON schema so valid content fields stay untouched.
 *
 * @param promptText - The original manager's announcement draft.
 * @param previousAnalysis - The analysis whose targets contained invalid names.
 * @param invalidNames - Target names rejected by validation.
 * @param targetContext - The exact group/location names Gemini may reference.
 * @returns A validated DNF targeting expression using exact names.
 */
export async function repairTargets(
    promptText: string,
    previousAnalysis: CampaignAnalysis,
    invalidNames: string[],
    targetContext: TargetContext,
): Promise<TargetingExpression> {
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
            {
                role: 'user',
                parts: [{ text: `Analyze this announcement prompt:\n\n"${promptText}"` }],
            },
            {
                role: 'model',
                parts: [{ text: JSON.stringify(previousAnalysis) }],
            },
            {
                role: 'user',
                parts: [
                    {
                        text:
                            `Targets ${invalidNames.map((name) => `'${name}'`).join(', ')} do not exist. ` +
                            'Return corrected targets only, using exact names from the Groups/Locations lists.',
                    },
                ],
            },
        ],
        config: {
            systemInstruction: buildSystemInstruction(targetContext),
            responseMimeType: 'application/json',
            responseJsonSchema: z.toJSONSchema(repairedTargetsSchema),
            temperature: 0.2,
        },
    });

    if (!response.text) {
        throw new Error('Gemini returned an empty response');
    }
    return repairedTargetsSchema.parse(JSON.parse(response.text));
}
