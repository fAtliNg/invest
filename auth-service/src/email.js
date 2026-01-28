const axios = require('axios');

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:5003';

// Helper to make HTTP requests to email service
const sendToEmailService = async (endpoint, data) => {
  try {
    await axios.post(`${EMAIL_SERVICE_URL}${endpoint}`, data);
  } catch (error) {
    console.error(`Error sending to email service (${endpoint}):`, error.message);
    // Don't throw to avoid crashing the auth flow, but log the error
  }
};

const sendMail = async ({ to, subject, html, text }) => {
  await sendToEmailService('/send', { to, subject, html, text });
};

const sendEmailVerification = async (to, token) => {
  await sendToEmailService('/send-verification', { to, token });
};

const sendPasswordReset = async (to, token) => {
  await sendToEmailService('/send-password-reset', { to, token });
};

// Keep these helpers here if they are used elsewhere or just for reference,
// though technically the logic for building links is now in email-service (implicitly) 
// or should be. Wait, email-service implementation of /send-verification uses mailer.js 
// which has buildVerificationLink. So we don't need to build link here.
// But to keep interface consistent if it was used elsewhere:

const getBaseUrl = () => {
  if (process.env.APP_PUBLIC_URL) {
    return process.env.APP_PUBLIC_URL;
  }
  return 'https://profit-case.ru';
};

const buildVerificationLink = (token) => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

const buildPasswordResetLink = (token) => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

module.exports = {
  sendMail,
  sendEmailVerification,
  sendPasswordReset,
  buildVerificationLink,
  buildPasswordResetLink,
};
