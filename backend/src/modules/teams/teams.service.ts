import { env } from '@shared/config/env.js';


export interface TeamsMessageResult {
    id: string;
    createdDateTime?: string;
}


export async function sendTeamsChannelMessage(
    accessToken: string,
    teamId: string,
    channelId: string,
    htmlContent: string,
): Promise<TeamsMessageResult> {

    const url =
        `https://graph.microsoft.com/v1.0/teams/` +
        `${encodeURIComponent(teamId)}/channels/` +
        `${encodeURIComponent(channelId)}/messages`;


    console.log(
        'Sending delegated Teams message to:',
        url,
    );


    const response = await fetch(
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


    return JSON.parse(
        responseText,
    ) as TeamsMessageResult;
}


export async function sendTestTeamsMessage(
    accessToken: string,
): Promise<TeamsMessageResult> {

    return sendTeamsChannelMessage(
        accessToken,
        env.TEAMS_TEST_TEAM_ID,
        env.TEAMS_TEST_CHANNEL_ID,

        `
         <h2>Vodannounce Test</h2>

         <p>
            Hello from Vodannounce 👋
         </p>

         <p>
            This message was sent through
            Microsoft Graph on behalf of
            the connected Microsoft user.
         </p>
      `,
    );
}