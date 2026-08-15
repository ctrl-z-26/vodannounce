import { Router } from 'express';
import { handleDeviceRegistration } from './fcm.controller.js';

const router = Router();

router.post('/register', handleDeviceRegistration);

export const fcmRoutes = router;
