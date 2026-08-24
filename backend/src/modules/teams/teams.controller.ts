import {
    type Request,
    type Response,
} from 'express';

import {
    connectTeamsSender,
    createTeamsSenderAuthUrl,
    getTeamsSenderStatus,
} from './teams.auth.js';

import {
    sendTestTeamsMessage,
} from './teams.service.js';


/*
 * ------------------------------------------------
 * CONNECT DEDICATED SENDER
 * ------------------------------------------------
 */

export async function handleTeamsOAuthConnect(
    _req: Request,
    res: Response,
): Promise<void> {

    try {

        const authUrl =
            await createTeamsSenderAuthUrl();


        res.redirect(
            authUrl,
        );


    } catch (error: any) {

        console.error(
            'Could not start Microsoft OAuth:',
            error,
        );


        res.status(500).json({
            success: false,
            error:
                error.message,
        });

    }

}


/*
 * ------------------------------------------------
 * MICROSOFT CALLBACK
 * ------------------------------------------------
 */

export async function handleTeamsOAuthCallback(
    req: Request,
    res: Response,
): Promise<void> {

    const code =
        typeof req.query.code === 'string'
            ? req.query.code
            : null;


    const state =
        typeof req.query.state === 'string'
            ? req.query.state
            : null;


    const microsoftError =
        typeof req.query.error === 'string'
            ? req.query.error
            : null;


    if (microsoftError) {

        const description =
            typeof req.query.error_description ===
                'string'
                ? req.query.error_description
                : microsoftError;


        res.status(400).send(
            `Microsoft authentication failed: ${description}`,
        );

        return;
    }


    if (!code || !state) {

        res.status(400).send(
            'Microsoft authorization code or state is missing.',
        );

        return;
    }


    try {

        const email =
            await connectTeamsSender(
                code,
                state,
            );


        /*
         * Simple confirmation page for now.
         *
         * Later this can redirect directly
         * back to the Vodannounce settings page.
         */
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Teams Sender Connected</title>
                </head>

                <body
                    style="
                        font-family: Arial, sans-serif;
                        padding: 40px;
                    "
                >

                    <h2>
                        Microsoft Teams sender connected
                    </h2>

                    <p>
                        ${email}
                    </p>

                    <p>
                        You can close this tab and return
                        to Vodannounce.
                    </p>

                </body>
            </html>
        `);


    } catch (error: any) {

        console.error(
            'Teams sender OAuth callback failed:',
            error,
        );


        res.status(500).send(
            `Could not connect Teams sender: ${error.message}`,
        );

    }

}


/*
 * ------------------------------------------------
 * CONNECTION STATUS
 * ------------------------------------------------
 */

export async function handleTeamsSenderStatus(
    _req: Request,
    res: Response,
): Promise<void> {

    try {

        const status =
            await getTeamsSenderStatus();


        res.status(200).json(
            status,
        );


    } catch (error: any) {

        res.status(500).json({
            connected: false,
            error:
                error.message,
        });

    }

}


/*
 * ------------------------------------------------
 * TEST DELIVERY
 * ------------------------------------------------
 */

export async function handleTestTeamsMessage(
    _req: Request,
    res: Response,
): Promise<void> {

    try {

        const message =
            await sendTestTeamsMessage();


        res.status(200).json({
            success: true,

            message:
                'Teams message sent successfully',

            teamsMessageId:
                message.id,

            teamsMessageUrl:
                message.webUrl,
        });


    } catch (error: any) {

        console.error(
            'Teams delivery failed:',
            error,
        );


        res.status(500).json({
            success: false,
            error:
                error.message,
        });

    }

}