import { describe, it, expect } from 'vitest';
import { findUnknownTargets } from './campaigns.utils.js';
import type { Target } from '@root-shared/types/campaign.js';

function target(type: Target['type'], name: string): Target {
    return { type, name };
}

describe('findUnknownTargets', () => {
    const groups = ['Security', 'HR', 'Full Stack Guild'];
    const locations = ['Main Street', 'Harbor Point'];

    it('accepts exact group and location names across cells', () => {
        const targets = [
            [target('group', 'Security')],
            [target('location', 'Main Street'), target('group', 'HR')],
        ];
        expect(findUnknownTargets(targets, groups, locations)).toEqual([]);
    });

    it('flags names missing from their typed list', () => {
        const targets = [[target('group', 'Cyber Security')]];
        expect(findUnknownTargets(targets, groups, locations)).toEqual(['Cyber Security']);
    });

    it('flags a real name tagged with the wrong type', () => {
        const targets = [[target('group', 'Main Street')]];
        expect(findUnknownTargets(targets, groups, locations)).toEqual(['Main Street']);
    });

    it('is case-sensitive', () => {
        const targets = [[target('group', 'security')]];
        expect(findUnknownTargets(targets, groups, locations)).toEqual(['security']);
    });

    it('deduplicates repeated unknown names across cells', () => {
        const targets = [[target('group', 'Ghost')], [target('location', 'Ghost')]];
        expect(findUnknownTargets(targets, groups, locations)).toEqual(['Ghost']);
    });

    it('returns empty for empty targets', () => {
        expect(findUnknownTargets([], groups, locations)).toEqual([]);
    });
});
