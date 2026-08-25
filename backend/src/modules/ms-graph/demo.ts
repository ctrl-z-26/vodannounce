import 'dotenv/config';
import { sendMail } from './ms-graph.service';

async function main() {
  await sendMail({
    senderEmail: 'REPLACE_WITH_REAL_SENDER_EMAIL', // must be a real mailbox your app is allowed to send as
    toRecipients: ['REPLACE_WITH_YOUR_OWN_TEST_EMAIL'],
    subject: 'Vodannounce test email',
    htmlBody: '<h1>Test</h1><p>If you see this, MS Graph sendMail works.</p>',
  });

  console.log('Email sent successfully.');
}

main().catch((error) => {
  console.error('Demo failed:', error);
});