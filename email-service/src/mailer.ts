import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_SECURE,
  SMTP_FROM,
  APP_PUBLIC_URL,
} = process.env;

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: SMTP_SECURE === 'true' || SMTP_PORT === '465',
    auth: SMTP_USER && SMTP_PASSWORD ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  });
  console.log(`SMTP Transport configured: ${SMTP_HOST}:${SMTP_PORT}`);
} else {
  console.warn('SMTP_HOST not set. Email sending will be simulated.');
}

interface SendMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export const sendMail = async ({ to, subject, html, text }: SendMailOptions): Promise<void> => {
  if (!transporter) {
    console.log(`[SIMULATION] Email to ${to}: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  console.log(`Email sent to ${to}: ${subject}`);
};

const getBaseUrl = (): string => {
  if (APP_PUBLIC_URL) {
    return APP_PUBLIC_URL;
  }
  return 'https://profit-case.ru';
};

const buildVerificationLink = (token: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

const buildPasswordResetLink = (token: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

export const sendEmailVerification = async (to: string, token: string): Promise<void> => {
  const link = buildVerificationLink(token);
  const subject = 'Подтверждение адреса электронной почты';
  const text = `Для подтверждения email перейдите по ссылке: ${link}`;
  const html = `<p>Для подтверждения email перейдите по ссылке:</p><p><a href="${link}">${link}</a></p>`;

  await sendMail({ to, subject, text, html });
};

export const sendPasswordReset = async (to: string, token: string): Promise<void> => {
  const link = buildPasswordResetLink(token);
  const subject = 'Восстановление пароля';
  const text = `Для восстановления пароля перейдите по ссылке: ${link}`;
  const html = `<p>Для восстановления пароля перейдите по ссылке:</p><p><a href="${link}">${link}</a></p>`;

  await sendMail({ to, subject, text, html });
};
