import {
    InteractionRequiredAuthError,
    type AccountInfo,
    type IPublicClientApplication,
} from '@azure/msal-browser';

import { teamsTokenRequest } from './microsoft.config';


export async function getTeamsAccessToken(
    instance: IPublicClientApplication,
    account: AccountInfo,
): Promise<string> {

    try {
        const result =
            await instance.acquireTokenSilent({
                ...teamsTokenRequest,
                account,
            });

        return result.accessToken;

    } catch (error) {

        if (
            error instanceof
            InteractionRequiredAuthError
        ) {
            const result =
                await instance.acquireTokenPopup({
                    ...teamsTokenRequest,
                    account,
                });

            return result.accessToken;
        }

        throw error;
    }
}