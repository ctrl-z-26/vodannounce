import {
    PublicClientApplication,
    type Configuration,
} from '@azure/msal-browser';


const clientId =
    import.meta.env.VITE_AZURE_CLIENT_ID;

const tenantId =
    import.meta.env.VITE_AZURE_TENANT_ID;


if (!clientId) {
    throw new Error(
        'VITE_AZURE_CLIENT_ID is missing'
    );
}

if (!tenantId) {
    throw new Error(
        'VITE_AZURE_TENANT_ID is missing'
    );
}


export const msalConfig: Configuration = {
    auth: {
        clientId,

        authority:
            `https://login.microsoftonline.com/${tenantId}`,

        redirectUri:
            `${window.location.origin}/redirect.html`,

        postLogoutRedirectUri:
            `${window.location.origin}/redirect.html`,
    },

    cache: {
        cacheLocation: 'sessionStorage',
    },
};


export const msalInstance =
    new PublicClientApplication(
        msalConfig
    );


export const teamsLoginRequest = {
    scopes: [
        'ChannelMessage.Send',
    ],
};


export const teamsTokenRequest = {
    scopes: [
        'ChannelMessage.Send',
    ],
};