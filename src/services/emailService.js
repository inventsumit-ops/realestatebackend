const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Real Estate Platform',
    html: `
      <h2>Email Verification</h2>
      <p>Thank you for registering with our Real Estate Platform. Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Verify Email</a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>Real Estate Platform Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - Real Estate Platform',
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset for your Real Estate Platform account. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #f44336; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Reset Password</a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>Real Estate Platform Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendInquiryNotification = async (agentEmail, agentName, propertyName, customerName, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: agentEmail,
    subject: `New Inquiry for ${propertyName}`,
    html: `
      <h2>New Property Inquiry</h2>
      <p>Hello ${agentName},</p>
      <p>You have received a new inquiry for your property: <strong>${propertyName}</strong></p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <p>Please log in to your dashboard to respond to this inquiry.</p>
      <p>Best regards,<br>Real Estate Platform Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendAppointmentConfirmation = async (userEmail, userName, propertyName, appointmentDate) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Appointment Confirmation - Real Estate Platform',
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Hello ${userName},</p>
      <p>Your appointment has been confirmed for the following property:</p>
      <p><strong>Property:</strong> ${propertyName}</p>
      <p><strong>Date & Time:</strong> ${new Date(appointmentDate).toLocaleString()}</p>
      <p>Please make sure to arrive on time. If you need to reschedule, please contact the agent directly.</p>
      <p>Best regards,<br>Real Estate Platform Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInquiryNotification,
  sendAppointmentConfirmation
};
