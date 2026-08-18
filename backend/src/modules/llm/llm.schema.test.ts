import { describe, it, expect } from 'vitest';
import { campaignAnalysisSchema, type CampaignAnalysis } from './llm.schema.js';

function validAnalysis(): CampaignAnalysis {
    return {
        title: 'Network outage',
        priority: 'important',
        channels: ['teams', 'mobile_push'],
        email_subject: 'Network Down in B1',
        email_body: 'We are investigating the network outage.',
        notification_text: 'Network down in B1',
        teams_message: '## Network outage\nInvestigating.',
        targets: [['Security'], ['Facility']].map((names) =>
            names.map((name) => ({ type: 'group', name })),
        ),
    };
}

describe('campaignAnalysisSchema', () => {
    it('accepts a well-formed analysis with typed targets', () => {
        const parsed = campaignAnalysisSchema.parse(validAnalysis());
        expect(parsed.priority).toBe('important');
        expect(parsed.targets[0]?.[0]).toEqual({ type: 'group', name: 'Security' });
    });

    it('rejects an unknown target type', () => {
        const analysis = validAnalysis();
        analysis.targets = [[{ type: 'department', name: 'HR' }]] as unknown as CampaignAnalysis['targets'];
        expect(() => campaignAnalysisSchema.parse(analysis)).toThrow();
    });

    it('rejects an empty targets list', () => {
        const analysis = validAnalysis();
        analysis.targets = [];
        expect(() => campaignAnalysisSchema.parse(analysis)).toThrow();
    });

    it('rejects an empty channels list', () => {
        const analysis = validAnalysis();
        analysis.channels = [];
        expect(() => campaignAnalysisSchema.parse(analysis)).toThrow();
    });

    it('rejects a notification text over 150 chars', () => {
        const analysis = validAnalysis();
        analysis.notification_text = 'x'.repeat(151);
        expect(() => campaignAnalysisSchema.parse(analysis)).toThrow();
    });

    it('accepts teams_message as null', () => {
        const analysis = validAnalysis();
        analysis.teams_message = null;
        expect(campaignAnalysisSchema.parse(analysis).teams_message).toBeNull();
    });

    it('rejects an invalid priority', () => {
        const analysis = validAnalysis();
        analysis.priority = 'urgent' as CampaignAnalysis['priority'];
        expect(() => campaignAnalysisSchema.parse(analysis)).toThrow();
    });
});