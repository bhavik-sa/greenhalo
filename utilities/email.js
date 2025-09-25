import nodemailer from 'nodemailer'
import config from '../config/index.js'

// Create a reusable transporter using Gmail SMTP with env credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: config.EMAIL.USER,
    pass: config.EMAIL.PASS,
  },
})

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!config.EMAIL?.USER || !config.EMAIL?.PASS) {
    throw new Error('Email credentials are not configured')
  }

  const mailOptions = {
    from: `GreenHalo <${config.EMAIL.USER}>`,
    to,
    subject,
    text,
    html,
  }

  return transporter.sendMail(mailOptions)
}

export const sendMfaEmail = async ({ to, code, expiresAt }) => {
  const subject = 'Your GreenHalo verification code'
  const text = `Your verification code is ${code}. It expires at ${new Date(expiresAt).toLocaleString()}.`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
      <h2>Your verification code</h2>
      <p>Use the following code to complete your sign in. This code will expire in 10 minutes.</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;padding:12px 16px;border:1px solid #e5e7eb;display:inline-block;border-radius:8px;background:#f9fafb">${code}</div>
      <p style="margin-top:16px;color:#555">If you didn't attempt to sign in, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#888">GreenHalo Security</p>
    </div>
  `

  return sendEmail({ to, subject, text, html })
}



export const sendForgotPasswordEmail = async ({ to, resetUrl }) => {
  const subject = "GreenHalo Password Reset Request";
  const text = `We received a request to reset your GreenHalo account password.
If you made this request, click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour. If you did not request a password reset, please ignore this email.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#16a34a">Reset Your GreenHalo Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your GreenHalo account. If you made this request, please click the button below:</p>
      
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}" 
           style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 20px;font-size:16px;font-weight:bold;border-radius:6px;display:inline-block">
          Reset Password
        </a>
      </div>
      
      <p>This link will expire in <strong>1 hour</strong>. If you didn’t request a password reset, you can safely ignore this email.</p>
      
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#888;text-align:center">GreenHalo Security Team</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

