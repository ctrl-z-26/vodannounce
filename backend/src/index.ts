import { env } from '@shared/config/env.js';
import express, { type Request, type Response } from 'express';

const app = express();
const PORT = env.PORT;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'Hello from TypeScript and Express!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
