import { describe, it, expect } from 'vitest';
import { buildSendMailPayload } from './ms-graph.service';

describe('buildSendMailPayload', () => {
  it('builds a correctly structured Graph sendMail payload', () => {
    const payload = buildSendMailPayload({
      senderEmail: 'sender@vodafone.com',
      toRecipients: ['employee1@vodafone.com', 'employee2@vodafone.com'],
      subject: 'Test Announcement',
      htmlBody: '<p>Hello</p>',
    });

    expect(payload.message.subject).toBe('Test Announcement');
    expect(payload.message.body.contentType).toBe('HTML');
    expect(payload.message.body.content).toBe('<p>Hello</p>');
    expect(payload.message.toRecipients).toEqual([
      { emailAddress: { address: 'employee1@vodafone.com' } },
      { emailAddress: { address: 'employee2@vodafone.com' } },
    ]);
  });
});