import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email, code) => {
  const user = 'resend';
  const key = process.env.SMTP_KEY;

  if (!user || !key) {
    const reason = `Missing SMTP credentials: EMAIL_USER=${Boolean(user)}, SMTP_KEY=${Boolean(key)}`;
    console.error('[email] Not sending email:', reason);
    return { sent: false, reason };
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
        user: 'resend',            
        pass: process.env.SMTP_KEY, 
    },
  });


  const mailOptions = {
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'PARTICIPIUM - Verify your account',
    text: `Your verification code: ${code}. This code will expire in 30 minutes.`,
  };

  try {
    // Optional: verify transporter config quickly
    // await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log("Email sent");
    return { sent: true };
  } catch (err) {
    console.error('[email] sendMail failed:', err?.message || err);
    return { sent: false, reason: err?.message || String(err) };
  }
};