const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { generateToken } = require('../config/jwt');
const { asyncHandler } = require('../middleware/errorMiddleware');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'user' } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    emailVerificationToken
  });

  await UserProfile.create({ user_id: user._id });

  await sendVerificationEmail(user.email, emailVerificationToken);

  const token = generateToken({ id: user._id });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is inactive'
    });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken({ id: user._id });

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_image: user.profile_image,
      isEmailVerified: user.isEmailVerified
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const passwordResetExpires = Date.now() + 10 * 60 * 1000;

  await User.findByIdAndUpdate(user._id, {
    passwordResetToken,
    passwordResetExpires
  });

  await sendPasswordResetEmail(user.email, resetToken);

  res.json({
    success: true,
    message: 'Password reset email sent'
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification token'
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email already verified'
    });
  }

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = emailVerificationToken;
  await user.save();

  await sendVerificationEmail(user.email, emailVerificationToken);

  res.json({
    success: true,
    message: 'Verification email sent'
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  const profile = await UserProfile.findOne({ user_id: req.user.id });

  res.json({
    success: true,
    user: {
      ...user.toObject(),
      profile
    }
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profile_image } = req.body;
  const profileData = req.body.profile || {};

  const user = await User.findById(req.user.id);
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (profile_image) user.profile_image = profile_image;
  await user.save();

  await UserProfile.findOneAndUpdate(
    { user_id: req.user.id },
    profileData,
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully'
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }

  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getProfile,
  updateProfile,
  deleteAccount
};
