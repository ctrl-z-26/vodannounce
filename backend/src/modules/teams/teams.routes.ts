import {
    Router,
} from 'express';

import {
    handleTeamsOAuthCallback,
    handleTeamsOAuthConnect,
    handleTeamsSenderStatus,
    handleTestTeamsMessage,
} from './teams.controller.js';


const router =
    Router();


router.get(
    '/oauth/connect',
    handleTeamsOAuthConnect,
);


router.get(
    '/oauth/callback',
    handleTeamsOAuthCallback,
);


router.get(
    '/sender/status',
    handleTeamsSenderStatus,
);


/*
 * Temporary testing endpoint.
 */
router.post(
    '/test',
    handleTestTeamsMessage,
);


export const teamsRoutes =
    router;