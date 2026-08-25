import { Router } from 'express';
import { sendEmailHandler } from './ms-graph.controller';

const router = Router();

router.post('/send', sendEmailHandler);

export default router;