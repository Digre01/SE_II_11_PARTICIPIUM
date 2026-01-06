import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email, code) => {
  /*
  const user = 'resend';
  const key = process.env.SMTP_KEY;
  */
  const user = process.env.GOOGLE_APP_MAIL;
  const key = process.env.GOOGLE_APP_PASSWORD;



  if (!user || !key) {
    const reason = `Missing SMTP credentials: EMAIL_USER=${Boolean(user)}, SMTP_KEY=${Boolean(key)}`;
    console.error('[email] Not sending email:', reason);
    return { sent: false, reason };
  }

  /*
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
        user: 'resend',            
        pass: process.env.RESEND_SMTP_KEY, 
    },
  });
  */

  const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_APP_MAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});




  const mailOptions = {
    from: `Participium Team <${process.env.GOOGLE_APP_MAIL}>`, 
    to: email,
    subject: 'Welcome to Participium (Verification Code)',
    text: `Hi,\n\nThanks for signing up to Participium.\n\nYour verification code is: ${code}\n\nIf you did not request this code, please ignore this email.\n\nBest regards,\nThe Participium Team`, 
    html: `<p>Hi,</p><p>Thanks for signing up to Participium.</p><p>Your verification code is: <strong>${code}</strong></p><p>If you did not request this code, please ignore this email.</p><p>Best regards,<br>The Participium Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent");
    return { sent: true };
  } catch (err) {
    console.error('[email] sendMail failed:', err?.message || err);
    return { sent: false, reason: err?.message || String(err) };
  }
};