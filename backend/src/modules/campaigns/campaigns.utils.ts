import type {
    Target,
    TargetType,
    TargetContext,
    TargetingExpression,
} from '@root-shared/types/campaign.js';
import { supabase } from '@shared/supabase/supabase.js';

/**
 * Collects target names that do not exist in the provided target context.
 *
 * A name counts as unknown when it is missing from the list matching its
 * `type` tag — e.g. a location name tagged as `group` is unknown even though
 * the name exists as a location. Matching is exact and case-sensitive.
 *
 * @param targets - DNF targeting expression from the AI analysis.
 * @param targetContext - Available groups and locations from the database.
 * @returns Deduplicated unknown names; empty when every target is valid.
 */
export function findUnknownTargets(
    targets: { type: TargetType; name: string }[][],
    targetContext: TargetContext,
): string[] {
    const groups = new Set(targetContext.groups.map((g) => g.name));
    const locations = new Set(targetContext.locations);
    const unknown = new Set<string>();
    for (const cell of targets) {
        for (const target of cell) {
            const known =
                target.type === 'group'
                    ? groups.has(target.name)
                    : locations.has(target.name);
            if (!known) unknown.add(target.name);
        }
    }
    return [...unknown];
}

/**
 * Expands a standalone branch/location target into the groups mapped to that
 * branch. This keeps locations such as Dallah Maadi and Smart Village out of
 * the visible audience chips while preserving the actual recipient audience.
 */
export function expandStandaloneLocationTargets(
    targeting: TargetingExpression,
    groupsByLocation: Map<string, string[]>,
): TargetingExpression {
    const expanded: TargetingExpression = [];
    const seen = new Set<string>();

    const addCell = (cell: Target[]) => {
        const key = cell.map((target) => `${target.type}:${target.name}`).join('|');
        if (seen.has(key)) return;
        expanded.push(cell);
        seen.add(key);
    };

    for (const cell of targeting) {
        const onlyTarget = cell[0];
        if (cell.length === 1 && onlyTarget?.type === 'location') {
            const groupNames = groupsByLocation.get(onlyTarget.name) ?? [];
            if (groupNames.length > 0) {
                for (const groupName of groupNames) {
                    addCell([{ type: 'group', name: groupName }]);
                }
                continue;
            }
        }

        addCell(cell);
    }

    return expanded;
}

/**
 * Resolves a DNF targeting expression to a deduplicated set of user IDs.
 * Delegates the join logic to a Postgres function to avoid N+1 queries.
 *
 * @param targeting - DNF expression from the AI analysis.
 * @returns Deduplicated user IDs matching the targeting expression.
 */
export async function resolveAudience(targeting: TargetingExpression): Promise<string[]> {
    if (targeting.length === 0) return [];
    const { data, error } = await supabase.rpc('resolve_audience', {
        targeting,
    });
    if (error) throw new Error(`Failed to resolve audience: ${error.message}`);
    return data ?? [];
}
