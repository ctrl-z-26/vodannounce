import { describe, it, expect } from 'vitest';
import { findUnknownTargets, expandStandaloneLocationTargets } from './campaigns.utils.js';
import type { Target, TargetContext } from '@root-shared/types/campaign.js';

function target(type: Target['type'], name: string): Target {
    return { type, name };
}

describe('findUnknownTargets', () => {
    const targetContext: TargetContext = {
        groups: [
            { name: 'Security', description: null },
            { name: 'HR', description: null },
            { name: 'Full Stack Guild', description: null },
        ],
        locations: ['Main Street', 'Harbor Point'],
    };

    it('accepts exact group and location names across cells', () => {
        const targets = [
            [target('group', 'Security')],
            [target('location', 'Main Street'), target('group', 'HR')],
        ];
        expect(findUnknownTargets(targets, targetContext)).toEqual([]);
    });

    it('flags names missing from their typed list', () => {
        const targets = [[target('group', 'Cyber Security')]];
        expect(findUnknownTargets(targets, targetContext)).toEqual(['Cyber Security']);
    });

    it('flags a real name tagged with the wrong type', () => {
        const targets = [[target('group', 'Main Street')]];
        expect(findUnknownTargets(targets, targetContext)).toEqual(['Main Street']);
    });

    it('is case-sensitive', () => {
        const targets = [[target('group', 'security')]];
        expect(findUnknownTargets(targets, targetContext)).toEqual(['security']);
    });

    it('deduplicates repeated unknown names across cells', () => {
        const targets = [[target('group', 'Ghost')], [target('location', 'Ghost')]];
        expect(findUnknownTargets(targets, targetContext)).toEqual(['Ghost']);
    });

    it('returns empty for empty targets', () => {
        expect(findUnknownTargets([], targetContext)).toEqual([]);
    });
});
describe('expandStandaloneLocationTargets', () => {
    const groupsByLocation = new Map<string, string[]>([
        ['Dallah Maadi', ['Full Stack Guild', 'Backend Guild']],
        ['Smart Village', ['Frontend Guild', 'Mobile Guild']],
    ]);

    it('replaces a standalone Dallah Maadi location with its groups', () => {
        expect(
            expandStandaloneLocationTargets(
                [[target('location', 'Dallah Maadi')]],
                groupsByLocation,
            ),
        ).toEqual([
            [target('group', 'Full Stack Guild')],
            [target('group', 'Backend Guild')],
        ]);
    });

    it('replaces a standalone Smart Village location with its groups', () => {
        expect(
            expandStandaloneLocationTargets(
                [[target('location', 'Smart Village')]],
                groupsByLocation,
            ),
        ).toEqual([
            [target('group', 'Frontend Guild')],
            [target('group', 'Mobile Guild')],
        ]);
    });

    it('keeps non-location cells unchanged', () => {
        const targeting = [[target('group', 'Security')]];
        expect(expandStandaloneLocationTargets(targeting, groupsByLocation)).toEqual(targeting);
    });
});
