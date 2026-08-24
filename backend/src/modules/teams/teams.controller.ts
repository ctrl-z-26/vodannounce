import {
    type Request,
    type Response,
} from 'express';

import {
    sendTestTeamsMessage,
} from './teams.service.js';


export async function handleTestTeamsMessage(
    req: Request,
    res: Response,
): Promise<void> {

    const authHeader =
        req.headers.authorization;


    if (
        !authHeader ||
        !authHeader.startsWith('Bearer ')
    ) {
        res.status(401).json({
            success: false,
            error:
                'Microsoft access token missing',
        });

        return;
    }


    const accessToken =
        authHeader.substring(7);


    try {

        const message =
            await sendTestTeamsMessage(
                accessToken,
            );


        res.status(200).json({
            success: true,
            message:
                'Teams message sent successfully',
            teamsMessageId:
                message.id,
        });

    } catch (error: any) {

        console.error(
            'Teams delivery failed:',
            error,
        );


        res.status(500).json({
            success: false,
            error: error.message,
        });

    }
}