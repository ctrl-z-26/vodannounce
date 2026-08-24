import { env } from '@shared/config/env.js';
import express, { type Request, type Response } from 'express';
import { getGraphAccessToken } from './modules/teams/teams.config.js';
import cors from 'cors';
import { fcmRoutes } from './modules/fcm/index.js';
import { campaignsRoutes } from './modules/campaigns/campaigns.routes.js';
import { errorHandler } from '@shared/middleware/error-handler.js';
import { teamsRoutes } from './modules/teams/index.js';
const app = express();
app.use(cors());
const PORT = env.PORT;

app.use(express.json());

app.use('/api/fcm', fcmRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/teams', teamsRoutes);
app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'Hello from TypeScript and Express!' });
});

app.use(errorHandler);
app.get('/api/teams/auth-test', async (_req, res) => {

    try {

        const token =
            await getGraphAccessToken();

        res.status(200).json({
            success: true,
            message:
                'Microsoft Graph authentication successful',
            tokenReceived:
                Boolean(token),
        });

    } catch (error: any) {

        console.error(
            'Microsoft Graph authentication failed:',
            error,
        );

        res.status(500).json({
            success: false,
            error: error.message,
        });

    }

});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
