import { useState } from 'react';
import { useMsal } from '@azure/msal-react';

import {
    teamsLoginRequest,
} from '../auth/microsoft.config';

import {
    getTeamsAccessToken,
} from '../auth/microsoft.service';

import * as api from '../api/api';


const MicrosoftTeamsConnection = () => {

    const {
        instance,
        accounts,
    } = useMsal();


    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');


    /*
     * Prefer the active Microsoft account.
     * Fall back to the first MSAL account.
     */
    const account =
        instance.getActiveAccount() ??
        accounts[0] ??
        null;


    /*
     * ----------------------------------------
     * CONNECT MICROSOFT ACCOUNT
     * ----------------------------------------
     */

    const connectMicrosoft = async () => {

        setError('');
        setSuccess('');
        setLoading(true);


        try {

            const result =
                await instance.loginPopup({
                    ...teamsLoginRequest,

                    prompt:
                        'select_account',
                });


            if (!result.account) {

                throw new Error(
                    'Microsoft account was not returned.',
                );

            }


            instance.setActiveAccount(
                result.account,
            );


            console.log(
                'Microsoft connected:',
                result.account.username,
            );


            setSuccess(
                'Microsoft Teams connected successfully.',
            );


        } catch (error) {

            console.error(
                'Microsoft login failed:',
                error,
            );


            setError(
                error instanceof Error
                    ? error.message
                    : 'Microsoft login failed.',
            );


        } finally {

            setLoading(false);

        }

    };


    /*
     * ----------------------------------------
     * SEND TEST TEAMS MESSAGE
     * ----------------------------------------
     */

    const handleTestMessage = async () => {

        if (!account) {

            setError(
                'Connect Microsoft Teams first.',
            );

            return;

        }


        setError('');
        setSuccess('');
        setLoading(true);


        try {

            /*
             * Get a delegated Microsoft Graph token
             * for the currently connected user.
             *
             * Token contains:
             * ChannelMessage.Send
             */
            const accessToken =
                await getTeamsAccessToken(
                    instance,
                    account,
                );


            console.log(
                'Microsoft Graph delegated token acquired',
            );


            /*
             * Send token to Express backend.
             *
             * Backend then calls:
             *
             * POST
             * /teams/{teamId}/channels/{channelId}/messages
             */
            const result =
                await api.sendTeamsTestMessage(
                    accessToken,
                );


            console.log(
                'Teams delivery result:',
                result,
            );


            setSuccess(
                'Test message sent to Microsoft Teams successfully.',
            );


        } catch (error) {

            console.error(
                'Teams test message failed:',
                error,
            );


            setError(
                error instanceof Error
                    ? error.message
                    : 'Teams test message failed.',
            );


        } finally {

            setLoading(false);

        }

    };


    /*
     * ----------------------------------------
     * DISCONNECT MICROSOFT ACCOUNT
     * ----------------------------------------
     */

    const disconnectMicrosoft = async () => {

        setError('');
        setSuccess('');
        setLoading(true);


        try {

            if (!account) {
                return;
            }


            await instance.logoutPopup({
                account,

                postLogoutRedirectUri:
                    window.location.origin,
            });


            instance.setActiveAccount(
                null,
            );


            console.log(
                'Microsoft account disconnected',
            );


        } catch (error) {

            console.error(
                'Microsoft logout failed:',
                error,
            );


            setError(
                error instanceof Error
                    ? error.message
                    : 'Microsoft logout failed.',
            );


        } finally {

            setLoading(false);

        }

    };


    /*
     * ----------------------------------------
     * CONNECTED UI
     * ----------------------------------------
     */

    if (account) {

        return (

            <div>

                <p>
                    Microsoft Teams connected
                </p>


                <strong>
                    {account.username}
                </strong>


                <br />
                <br />


                <button
                    onClick={
                        handleTestMessage
                    }
                    disabled={
                        loading
                    }
                >

                    {loading
                        ? 'Sending...'
                        : 'Send Test Teams Message'}

                </button>


                <br />
                <br />


                <button
                    onClick={
                        disconnectMicrosoft
                    }
                    disabled={
                        loading
                    }
                >

                    Disconnect Microsoft

                </button>


                {success && (

                    <p
                        style={{
                            color: 'green',
                            marginTop: '12px',
                        }}
                    >
                        {success}
                    </p>

                )}


                {error && (

                    <p
                        style={{
                            color: 'red',
                            marginTop: '12px',
                        }}
                    >
                        {error}
                    </p>

                )}

            </div>

        );

    }


    /*
     * ----------------------------------------
     * NOT CONNECTED UI
     * ----------------------------------------
     */

    return (

        <div>

            <button
                onClick={
                    connectMicrosoft
                }
                disabled={
                    loading
                }
            >

                {loading
                    ? 'Connecting...'
                    : 'Connect Microsoft Teams'}

            </button>


            {error && (

                <p
                    style={{
                        color: 'red',
                        marginTop: '12px',
                    }}
                >
                    {error}
                </p>

            )}

        </div>

    );

};


export default
    MicrosoftTeamsConnection;