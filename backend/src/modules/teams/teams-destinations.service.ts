import { supabase } from '@shared/supabase/supabase.js';

import type {
    TargetingExpression,
} from '@root-shared/types/campaign.js';


export interface TeamsDestination {
    teamId: string;
    channelId: string;
    teamName: string;
    channelName: string;
}


/**
 * Resolves the AI-generated campaign targeting
 * into Microsoft Teams destinations.
 *
 * Example:
 *
 * AI target: HR
 *      ↓
 * groups table
 *      ↓
 * teams_destinations
 *      ↓
 * HR Team / Announcments
 */
export async function resolveTeamsDestinations(
    targeting: TargetingExpression,
): Promise<TeamsDestination[]> {

    /*
     * Extract unique group names selected
     * by the AI.
     */
    const groupNames =
        [
            ...new Set(
                targeting
                    .flat()
                    .filter(
                        (target) =>
                            target.type === 'group' &&
                            target.name !== 'All',
                    )
                    .map(
                        (target) => target.name,
                    ),
            ),
        ];


    /*
     * "All" is a virtual target.
     *
     * For Teams, All means send to every
     * configured Teams destination.
     */
    const containsAll =
        targeting
            .flat()
            .some(
                (target) =>
                    target.type === 'group' &&
                    target.name === 'All',
            );


    if (containsAll) {

        const { data, error } =
            await supabase
                .from('teams_destinations')
                .select(
                    `
                    team_id,
                    channel_id,
                    team_name,
                    channel_name
                    `,
                );


        if (error) {
            throw new Error(
                `Failed to resolve all Teams destinations: ${error.message}`,
            );
        }


        return data.map(
            (destination) => ({
                teamId:
                    destination.team_id,

                channelId:
                    destination.channel_id,

                teamName:
                    destination.team_name,

                channelName:
                    destination.channel_name,
            }),
        );
    }


    /*
     * If the AI did not target any group,
     * there is no Teams destination to resolve.
     */
    if (groupNames.length === 0) {
        return [];
    }


    /*
     * Convert business group names such as:
     *
     * HR
     * Full Stack Guild
     * IT
     *
     * into their database UUIDs.
     */
    const { data: groups, error: groupsError } =
        await supabase
            .from('groups')
            .select('id, name')
            .in(
                'name',
                groupNames,
            );


    if (groupsError) {
        throw new Error(
            `Failed to resolve Teams groups: ${groupsError.message}`,
        );
    }


    const groupIds =
        groups.map(
            (group) => group.id,
        );


    if (groupIds.length === 0) {
        return [];
    }


    /*
     * Look up the Microsoft Team/channel
     * mapped to those Vodannounce groups.
     */
    const { data: destinations, error } =
        await supabase
            .from('teams_destinations')
            .select(
                `
                team_id,
                channel_id,
                team_name,
                channel_name
                `,
            )
            .in(
                'group_id',
                groupIds,
            );


    if (error) {
        throw new Error(
            `Failed to resolve Teams destinations: ${error.message}`,
        );
    }


    /*
     * Remove duplicates in case multiple
     * targeting cells eventually resolve
     * to the same Teams destination.
     */
    const uniqueDestinations =
        new Map<string, TeamsDestination>();


    for (const destination of destinations) {

        const key =
            `${destination.team_id}:${destination.channel_id}`;


        uniqueDestinations.set(
            key,
            {
                teamId:
                    destination.team_id,

                channelId:
                    destination.channel_id,

                teamName:
                    destination.team_name,

                channelName:
                    destination.channel_name,
            },
        );
    }


    return [
        ...uniqueDestinations.values(),
    ];
}