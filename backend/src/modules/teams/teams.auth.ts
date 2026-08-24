import crypto from 'node:crypto';

import {
    ConfidentialClientApplication,
    type Configuration,
} from '@azure/msal-node';

import { env } from '@shared/config/env.js';


const graphScopes = [
    'ChannelMessage.Send',
];


const msalConfig: Configuration = {
    auth: {
        clientId: env.AZURE_CLIENT_ID,

        authority:
            `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}`,

        clientSecret:
            env.AZURE_CLIENT_SECRET,
    },
};


const msalClient =
    new ConfidentialClientApplication(
        msalConfig,
    );


/*
 * Temporary in-memory state protection.
 *
 * This prevents somebody from calling
 * our callback with an arbitrary OAuth code.
 */
const pendingStates =
    new Set<string>();


/*
 * ------------------------------------------------
 * CREATE MICROSOFT LOGIN URL
 * ------------------------------------------------
 */

export async function createTeamsSenderAuthUrl():
    Promise<string> {

    const state =
        crypto.randomUUID();


    pendingStates.add(
        state,
    );


    const authUrl =
        await msalClient.getAuthCodeUrl({
            scopes:
                graphScopes,

            redirectUri:
                env.TEAMS_OAUTH_REDIRECT_URI,

            state,

            prompt:
                'select_account',

            loginHint:
                env.TEAMS_SENDER_EMAIL,
        });


    return authUrl;
}


/*
 * ------------------------------------------------
 * HANDLE MICROSOFT CALLBACK
 * ------------------------------------------------
 */

export async function connectTeamsSender(
    code: string,
    state: string,
): Promise<string> {

    /*
     * Verify the OAuth request belongs
     * to a login flow started by us.
     */
    if (
        !pendingStates.has(state)
    ) {
        throw new Error(
            'Invalid Microsoft OAuth state',
        );
    }


    pendingStates.delete(
        state,
    );


    const result =
        await msalClient.acquireTokenByCode({
            code,

            scopes:
                graphScopes,

            redirectUri:
                env.TEAMS_OAUTH_REDIRECT_URI,
        });


    if (!result.account) {
        throw new Error(
            'Microsoft account was not returned',
        );
    }


    const connectedEmail =
        result.account.username
            .toLowerCase();


    const expectedEmail =
        env.TEAMS_SENDER_EMAIL
            .toLowerCase();


    /*
     * We specifically want ONE dedicated
     * Microsoft sender account.
     */
    if (
        connectedEmail !==
        expectedEmail
    ) {
        throw new Error(
            `Wrong Microsoft account connected. ` +
            `Expected ${env.TEAMS_SENDER_EMAIL}`,
        );
    }


    console.log(
        'Dedicated Teams sender connected:',
        result.account.username,
    );


    return result.account.username;
}


/*
 * ------------------------------------------------
 * GET TOKEN FOR FUTURE TEAMS MESSAGES
 * ------------------------------------------------
 */

export async function getDedicatedTeamsAccessToken():
    Promise<string> {

    const accounts =
        await msalClient
            .getTokenCache()
            .getAllAccounts();


    const account =
        accounts.find(
            (item) =>
                item.username
                    .toLowerCase() ===
                env.TEAMS_SENDER_EMAIL
                    .toLowerCase(),
        );


    if (!account) {
        throw new Error(
            'Dedicated Teams sender is not connected',
        );
    }


    /*
     * MSAL checks its token cache first.
     *
     * If the access token expired and a
     * refresh token can be used, MSAL handles
     * the refresh automatically.
     */
    const result =
        await msalClient.acquireTokenSilent({
            account,

            scopes:
                graphScopes,
        });


    if (!result.accessToken) {
        throw new Error(
            'Could not acquire Teams access token',
        );
    }


    return result.accessToken;
}


/*
 * ------------------------------------------------
 * CONNECTION STATUS
 * ------------------------------------------------
 */

export async function getTeamsSenderStatus() {

    const accounts =
        await msalClient
            .getTokenCache()
            .getAllAccounts();


    const account =
        accounts.find(
            (item) =>
                item.username
                    .toLowerCase() ===
                env.TEAMS_SENDER_EMAIL
                    .toLowerCase(),
        );


    return {
        connected:
            Boolean(account),

        email:
            account?.username ??
            env.TEAMS_SENDER_EMAIL,
    };
}