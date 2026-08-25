import { ConfidentialClientApplication } from '@azure/msal-node';
import { supabase } from '../../shared/supabase/client'; // TODO: confirm actual import path for your typed client

const msalConfig = {
  auth: {
    clientId: process.env.MS_GRAPH_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID}`,
    clientSecret: process.env.MS_GRAPH_CLIENT_SECRET!,
  },
};

const msalClient = new ConfidentialClientApplication(msalConfig);

/**
 * Acquires an app-only access token via the client credentials flow.
 * No user context involved — this authenticates as the app itself.
 */
async function getAccessToken(): Promise<string> {
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  if (!result?.accessToken) {
    throw new Error('Failed to acquire Microsoft Graph access token');
  }

  return result.accessToken;
}

interface SendEmailParams {
  senderEmail: string;
  toRecipients: string[];
  subject: string;
  htmlBody: string;
}

/**
 * Builds the Graph sendMail payload. Pure function — easy to unit test
 * without hitting the network.
 */
export function buildSendMailPayload(params: SendEmailParams) {
  return {
    message: {
      subject: params.subject,
      body: {
        contentType: 'HTML',
        content: params.htmlBody,
      },
      toRecipients: params.toRecipients.map((email) => ({
        emailAddress: { address: email },
      })),
    },
  };
}

/**
 * Sends an HTML email via Microsoft Graph as the given sender,
 * and logs the delivery outcome to delivery_logs.
 */
export async function sendMail(params: SendEmailParams): Promise<void> {
  const payload = buildSendMailPayload(params);

  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${params.senderEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.status !== 202) {
      const errorBody = await response.text();
      throw new Error(`Graph sendMail failed: ${response.status} ${errorBody}`);
    }

    await logDelivery({ params, status: 'SENT' });
  } catch (error) {
    await logDelivery({
      params,
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

interface LogDeliveryParams {
  params: SendEmailParams;
  status: 'SENT' | 'FAILED';
  error?: string;
}

/**
 * Writes one row to delivery_logs recording the outcome.
 * TODO: confirm exact column names against database.types.ts —
 * this uses reasonable guesses (recipient, status, error_message, sent_at).
 */
async function logDelivery({ params, status, error }: LogDeliveryParams): Promise<void> {
  const { error: dbError } = await supabase.from('delivery_logs').insert({
    recipient: params.toRecipients.join(', '),
    channel: 'email',
    status,
    error_message: error ?? null,
    sent_at: new Date().toISOString(),
  });

  if (dbError) {
    console.error('Failed to write delivery log:', dbError);
  }
}