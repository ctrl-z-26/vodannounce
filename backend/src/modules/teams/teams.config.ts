import { ClientSecretCredential } from '@azure/identity';

import { env } from '@shared/config/env.js';


const credential = new ClientSecretCredential(
    env.AZURE_TENANT_ID,
    env.AZURE_CLIENT_ID,
    env.AZURE_CLIENT_SECRET,
);


export async function getGraphAccessToken(): Promise<string> {

    const accessToken =
        await credential.getToken(
            'https://graph.microsoft.com/.default',
        );


    if (!accessToken?.token) {
        throw new Error(
            'Failed to obtain Microsoft Graph access token',
        );
    }


    return accessToken.token;
}