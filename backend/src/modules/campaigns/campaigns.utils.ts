import type { TargetType } from '@root-shared/types/campaign.js';

/**
 * Collects target names that do not exist in the provided group/location
 * name lists.
 *
 * A name counts as unknown when it is missing from the list matching its
 * `type` tag — e.g. a location name tagged as `group` is unknown even though
 * the name exists as a location. Matching is exact and case-sensitive.
 *
 * @param targets - DNF targeting expression from the AI analysis.
 * @param groupNames - Exact group names available in the database.
 * @param locationNames - Exact location names available in the database.
 * @returns Deduplicated unknown names; empty when every target is valid.
 */
export function findUnknownTargets(
    targets: { type: TargetType; name: string }[][],
    groupNames: string[],
    locationNames: string[],
): string[] {
    const groups = new Set(groupNames);
    const locations = new Set(locationNames);
    const unknown = new Set<string>();
    for (const cell of targets) {
        for (const target of cell) {
            const known =
                target.type === 'group' ? groups.has(target.name) : locations.has(target.name);
            if (!known) unknown.add(target.name);
        }
    }
    return [...unknown];
}
