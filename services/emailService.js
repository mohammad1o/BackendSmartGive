const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ✅ Verification Email
const sendVerificationEmail = async (email, name, code) => {
  try {
    const mailOptions = {
      from: `"SmartGive 💚" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - SmartGive',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #00897b, #00bfa5); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">💚 SmartGive</h1>
            <p style="color: white; margin: 10px 0 0; opacity: 0.9;">Welcome to our community!</p>
          </div>
          <div style="padding: 30px 20px; background: white;">
            <h2 style="color: #333;">Hello ${name}! 👋</h2>
            <p style="color: #555; line-height: 1.6;">
              Thank you for joining <strong>SmartGive</strong>. To complete your registration, 
              please verify your email address using the code below:
            </p>
            <div style="background: linear-gradient(135deg, #e0f2f1, #b2dfdb); padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
              <p style="color: #555; margin: 0 0 10px; font-size: 14px;">Your verification code:</p>
              <div style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #00695c;">
                ${code}
              </div>
            </div>
            <p style="color: #777; font-size: 14px;">⏰ This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 13px; margin-top: 30px;">If you didn't sign up for SmartGive, please ignore this email.</p>
          </div>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 0;">© 2026 SmartGive. Helping communities, one donation at a time.</p>
          </div>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    throw new Error("Failed to send verification email");
  }
};

// ✅ Reset Password Email
const sendResetPasswordEmail = async (email, name, resetUrl) => {
  try {
    const mailOptions = {
      from: `"SmartGive 💚" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - SmartGive',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">💚 SmartGive</h1>
            <p style="color: white; margin: 10px 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          <div style="padding: 30px 20px; background: white;">
            <h2 style="color: #333;">Hello ${name}! 👋</h2>
            <p style="color: #555; line-height: 1.6;">
              We received a request to reset your password. Click the button below to reset it:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #777; font-size: 14px;">⏰ This link will expire in <strong>15 minutes</strong>.</p>
            <p style="color: #999; font-size: 13px; margin-top: 30px;">
              If you didn't request a password reset, please ignore this email.
            </p>
          </div>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 0;">© 2026 SmartGive. Helping communities, one donation at a time.</p>
          </div>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log("✅ Reset password email sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ Reset email error:", error.message);
    throw new Error("Failed to send reset email");
  }
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };