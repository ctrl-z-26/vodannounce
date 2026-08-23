import { env } from '@shared/config/env.js';
import express, { type Request, type Response } from 'express';

import cors from 'cors';
import { fcmRoutes } from './modules/fcm/index.js';
import { campaignsRoutes } from './modules/campaigns/campaigns.routes.js';
import { errorHandler } from '@shared/middleware/error-handler.js';

const app = express();
app.use(cors());
const PORT = env.PORT;

app.use(express.json());

app.use('/api/fcm', fcmRoutes);
app.use('/api/campaigns', campaignsRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'Hello from TypeScript and Express!' });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
