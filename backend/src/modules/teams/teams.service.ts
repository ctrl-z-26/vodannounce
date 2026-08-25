import { env } from '@shared/config/env.js';

import {
    createDeliveryLog,
    markDeliveryLogFailed,
    markDeliveryLogSent,
} from '../delivery-logs/delivery-logs.service.js';

import {
    getDedicatedTeamsAccessToken,
} from './teams.auth.js';


export interface TeamsMessageResult {
    id: string;
    createdDateTime?: string;
    webUrl?: string;
}

export type TeamsMessageImportance =
    | 'normal'
    | 'high'
    | 'urgent';
/*
 * ------------------------------------------------
 * RAW MICROSOFT GRAPH SEND
 * ------------------------------------------------
 *
 * This function only communicates with Graph.
 * It does not create delivery logs.
 */

async function sendTeamsGraphMessage(
    accessToken: string,
    teamId: string,
    channelId: string,
    htmlContent: string,
    importance: TeamsMessageImportance = 'normal',
): Promise<TeamsMessageResult> {

    const url =
        `https://graph.microsoft.com/v1.0/teams/` +
        `${encodeURIComponent(teamId)}/channels/` +
        `${encodeURIComponent(channelId)}/messages`;


    console.log(
        'Sending Teams message to:',
        url,
    );


    const response =
        await fetch(
            url,
            {
                method: 'POST',

                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,

                    'Content-Type':
                        'application/json',
                },

                body: JSON.stringify({
                    importance,

                    body: {
                        contentType: 'html',
                        content: htmlContent,
                    },
                }),
            },
        );


    const responseText =
        await response.text();


    if (!response.ok) {

        console.error(
            'Microsoft Graph error:',
            response.status,
            responseText,
        );


        throw new Error(
            `Microsoft Graph ${response.status}: ${responseText}`,
        );
    }


    const message =
        JSON.parse(
            responseText,
        ) as TeamsMessageResult;


    console.log(
        'Teams message sent successfully:',
        message.id,
    );


    return message;
}


/*
 * ------------------------------------------------
 * SEND AN ANNOUNCEMENT TO TEAMS
 * ------------------------------------------------
 *
 * This is the function the real announcement
 * workflow should use.
 *
 * It:
 *
 * 1. Creates a pending delivery log
 * 2. Gets the dedicated sender token
 * 3. Sends through Microsoft Graph
 * 4. Marks the log as sent OR failed
 */

export async function sendTeamsChannelMessage(
    announcementId: string,
    teamId: string,
    channelId: string,
    htmlContent: string,
    importance: TeamsMessageImportance = 'normal',
): Promise<TeamsMessageResult> {

    const destination =
        `${teamId}/${channelId}`;


    /*
     * Create the log BEFORE attempting delivery.
     */

    const deliveryLog =
        await createDeliveryLog(
            announcementId,
            destination,
        );


    try {

        /*
         * Get token belonging to the
         * dedicated Microsoft sender.
         */

        const accessToken =
            await getDedicatedTeamsAccessToken();


        /*
         * Send to Microsoft Graph.
         */

        const message =
            await sendTeamsGraphMessage(
                accessToken,
                teamId,
                channelId,
                htmlContent,
                importance,
            );


        /*
         * Graph successfully created
         * the Teams channel message.
         */

        await markDeliveryLogSent(
            deliveryLog.id,
            message.id,
        );


        return message;

    } catch (error) {

        const errorMessage =
            error instanceof Error
                ? error.message
                : String(error);


        /*
         * Record the failed delivery.
         */

        try {

            await markDeliveryLogFailed(
                deliveryLog.id,
                errorMessage,
            );

        } catch (logError) {

            /*
             * Don't replace the original Teams
             * error with a logging error.
             */

            console.error(
                'Failed to record Teams delivery failure:',
                logError,
            );
        }


        throw error;
    }
}


/*
 * ------------------------------------------------
 * TEMPORARY CONNECTIVITY TEST
 * ------------------------------------------------
 *
 * This does NOT write to delivery_logs because
 * it is not connected to a real announcement.
 */

export async function sendTestTeamsMessage():
    Promise<TeamsMessageResult> {

    const accessToken =
        await getDedicatedTeamsAccessToken();


    return sendTeamsGraphMessage(
        accessToken,
        env.TEAMS_TEST_TEAM_ID,
        env.TEAMS_TEST_CHANNEL_ID,

        `
            <h2>Vodannounce</h2>

            <p>
                Hello from Vodannounce 👋
            </p>

            <p>
                This announcement was sent using
                the dedicated Microsoft Teams
                sender account.
            </p>
        `,
    );
}

export interface TeamsChannel {
    id: string;
    displayName: string;
    description?: string | null;
}


export async function listTeamChannels(
    teamId: string,
): Promise<TeamsChannel[]> {

    const accessToken =
        await getDedicatedTeamsAccessToken();


    const url =
        `https://graph.microsoft.com/v1.0/teams/` +
        `${encodeURIComponent(teamId)}/channels`;


    const response =
        await fetch(url, {
            headers: {
                Authorization:
                    `Bearer ${accessToken}`,
            },
        });


    const responseText =
        await response.text();


    if (!response.ok) {
        throw new Error(
            `Microsoft Graph ${response.status}: ${responseText}`,
        );
    }


    const result =
        JSON.parse(responseText) as {
            value: TeamsChannel[];
        };


    return result.value;
}