import {
    Router,
} from 'express';

import {
    handleTestTeamsMessage,
} from './teams.controller.js';


const router =
    Router();


/*
 * TEMPORARY DEVELOPMENT ROUTE
 *
 * Remove this after Teams delivery
 * is connected to announcements.
 */
router.post(
    '/test',
    handleTestTeamsMessage,
);


export const teamsRoutes =
    router;