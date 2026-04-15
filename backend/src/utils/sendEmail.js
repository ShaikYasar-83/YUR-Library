const nodemailer = require("nodemailer");

/**
 * Utility to send emails via SMTP
 * @param {Object} options - { email, subject, message }
 */
const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2) Define email options
  const mailOptions = {
    from: `"${process.env.APP_NAME || 'YUR LIBRARY'}" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 3) Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
