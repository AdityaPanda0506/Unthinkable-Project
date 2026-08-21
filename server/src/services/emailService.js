const nodemailer = require('nodemailer');

let transporter = null;
const useSMTP =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

if (useSMTP) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('SMTP service configured for transactional notifications.');
} else {
  console.log('SMTP credentials missing. Notifications will run in console logging simulation mode.');
}

/**
 * Helper to dispatch emails asynchronously
 */
const sendMailAsync = (to, subject, text, html) => {
  setImmediate(async () => {
    try {
      const from = process.env.SMTP_FROM || '"Society Tracker" <noreply@society.com>';

      if (useSMTP && transporter) {
        await transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        console.log(`[Email Service] Notification successfully sent to: ${to}`);
      } else {
        console.log(`
=========================================
[EMAIL SIMULATION LOGGER]
To: ${Array.isArray(to) ? to.join(', ') : to}
From: ${from}
Subject: ${subject}
Date: ${new Date().toISOString()}
-----------------------------------------
${text}
=========================================
        `);
      }
    } catch (error) {
      console.error('[Email Service Error]: Failed to send notification:', error);
    }
  });
};

/**
 * @desc    Sends ticket progress/status updates to the resident
 */
const sendStatusChangeNotification = (userEmail, complaintTitle, oldStatus, newStatus, adminNote) => {
  const subject = `Update on Complaint: "${complaintTitle}"`;
  const text = `Dear Resident,\n\nThe status of your complaint "${complaintTitle}" has changed from ${oldStatus || 'OPEN'} to ${newStatus}.\n\n${
    adminNote ? `Admin Comment: ${adminNote}\n\n` : ''
  }Check the Resident Dashboard for more details.\n\nBest Regards,\nSociety Management`;

  const html = `
    <h3>Complaint Status Updated</h3>
    <p>Dear Resident,</p>
    <p>The status of your complaint <strong>"${complaintTitle}"</strong> has changed:</p>
    <ul>
      <li><strong>Old Status:</strong> ${oldStatus || 'OPEN'}</li>
      <li><strong>New Status:</strong> ${newStatus}</li>
    </ul>
    ${adminNote ? `<p><strong>Admin Note:</strong> ${adminNote}</p>` : ''}
    <p>Check the Resident Dashboard to review the resolution details.</p>
    <br/>
    <p>Best Regards,<br/><strong>Society Management Team</strong></p>
  `;

  sendMailAsync(userEmail, subject, text, html);
};

/**
 * @desc    Sends bulk broadcast emails to all resident accounts when an important notice is posted
 */
const sendImportantNoticeBroadcast = (recipientEmails, noticeTitle, noticeContent) => {
  if (!recipientEmails || recipientEmails.length === 0) return;

  const subject = `[IMPORTANT NOTICE] ${noticeTitle}`;
  const text = `Hello Resident,\n\nAn important announcement has been posted on the notice board:\n\nTitle: ${noticeTitle}\n\nAnnouncement Details:\n${noticeContent}\n\nCheck the Notice Board in the Portal for more details.\n\nBest Regards,\nSociety Management`;

  const html = `
    <h3 style="color: #dc2626;">Important Society Announcement</h3>
    <hr/>
    <h4>${noticeTitle}</h4>
    <p>${noticeContent.replace(/\n/g, '<br/>')}</p>
    <hr/>
    <p>Please log in to the notice board to view all current society updates.</p>
    <br/>
    <p>Best Regards,<br/><strong>Society Management Team</strong></p>
  `;

  // For simulation we log, for SMTP we send to the recipients (comma-separated or individually)
  sendMailAsync(recipientEmails, subject, text, html);
};

module.exports = {
  sendStatusChangeNotification,
  sendImportantNoticeBroadcast,
};
