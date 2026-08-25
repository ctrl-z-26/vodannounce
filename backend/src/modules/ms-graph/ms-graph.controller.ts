import { Request, Response } from 'express';
import { sendMail } from './ms-graph.service';

export async function sendEmailHandler(req: Request, res: Response) {
  const { senderEmail, toRecipients, subject, htmlBody } = req.body;

  // TODO: validate this with your project's Zod schema convention (per Rule 2/AGENTS.md)
  if (!senderEmail || !toRecipients?.length || !subject || !htmlBody) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await sendMail({ senderEmail, toRecipients, subject, htmlBody });
    res.status(202).json({ status: 'SENT' });
  } catch (error) {
    res.status(502).json({ error: 'Failed to send email via Microsoft Graph' });
  }
}