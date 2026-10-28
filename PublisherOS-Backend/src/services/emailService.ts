/**
 * Email service — abstracts transport so the app can run without SMTP in dev.
 *
 * If SMTP_HOST is configured, sends real email via nodemailer.
 * Otherwise, logs the email content to the console (dev-safe stub).
 *
 * IMPORTANT: Reset tokens and verification tokens are never included
 * in API responses. They appear only in this service's output (email or log).
 * In production, only the email transport will expose them.
 */

import { env } from '../env';
import { logger } from '../logger';

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!env.SMTP_HOST) {
    // Dev stub — safe to log token URLs in development only
    logger.info(
      {
        emailStub: {
          to: payload.to,
          subject: payload.subject,
          // Only log in development — in production SMTP_HOST is required
          ...(env.NODE_ENV === 'development' && { text: payload.text }),
        },
      },
      '[email-stub] Email not sent (no SMTP_HOST configured)',
    );
    return;
  }

  // Lazy-load nodemailer only when SMTP is configured, keeping the dependency
  // out of the hot path in development.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require('nodemailer') as typeof import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  otp: string,
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Your PublisherOS verification code',
    text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 24 hours.\n\nIf you did not create a PublisherOS account, ignore this email.`,
    html: `<p>Hi ${name},</p><p>Your verification code is:</p><h2 style="letter-spacing:8px;font-size:32px;">${otp}</h2><p>This code expires in 24 hours.</p><p>If you did not create a PublisherOS account, ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
): Promise<void> {
  const url = `${env.APP_BASE_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your PublisherOS password',
    text: `Hi ${name},\n\nReset your password by visiting:\n${url}\n\nThis link expires in 1 hour.\n\nIf you did not request a password reset, ignore this email.`,
    html: `<p>Hi ${name},</p><p>Reset your password by clicking the link below:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour.</p><p>If you did not request a password reset, ignore this email.</p>`,
  });
}

