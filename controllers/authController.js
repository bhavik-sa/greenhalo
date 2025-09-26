import config from "../config/index.js";
import { UserModel } from "../model/UserModel.js";
import constant from "../utilities/constant.js";
import logger from "../utilities/logger.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendBadRequest, sendSuccess } from "../utilities/response/index.js";
import { generateAccessToken } from "../helper/accessTokenHelper.js";
import messages from "../utilities/messages.js";
import { errorHelper } from "../helper/errorHelper.js";
import { sendForgotPasswordEmail, sendMfaEmail } from "../utilities/email.js";
import { AuditHistoryModel } from "../model/AuditHistoryMddel.js";

//Token
export const tokenId = () => {
  return crypto.randomBytes(16).toString('hex')
}


export const createMainAdmin = async () => {
  try {
    const admin = await UserModel.findOne({ email: config.ADMIN_EMAIL });
    if (admin) return;
    const adminData = {
      username: "admin",
      email: config.ADMIN_EMAIL,
      password_hash: bcrypt.hashSync(config.ADMIN_PASSWORD, 10),
      role: constant.ROLE[0],
    };
    await new UserModel(adminData).save();
    console.log("Main admin created successfully");
  } catch (e) {
    logger.error("CREATE_MAIN_ADMIN");
    logger.error(e);
  }
};



export const creatUser = async (req, res) => {
  try {
    const data = req.body;

    const user = await UserModel.create(data);
    return sendSuccess(res, user, messages.userCreated);
  } catch (e) {
    logger.error("CREATE_USER");
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, "CREATE_USER"));
  }
}


// user login
export const login = async (req, res) => {
  try {
    const data = req.body;

    const user = await UserModel.findOne({ email: data.email });

    if (!user) return sendBadRequest(res, messages.userNotFound);

    if (!bcrypt.compareSync(data.password, user.password_hash))
      return sendBadRequest(res, messages.invalidPassword);


    if (user.role !== constant.ROLE[0]) {
      return sendBadRequest(res, messages.InvalidAdmin)
    }


    await new AuditHistoryModel({
      actor_id: user._id,
      action: "LOGIN",
      details: data,
    }).save();

    // No MFA – issue access token directly
    return sendSuccess(
      res,
      { id: user._id, role: user.role },
      messages.adminLoggedIn
    );
  } catch (e) {
    logger.error("USER_LOGIN");
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, "USER_LOGIN"));
  }
};


// Generate a 6-digit numeric OTP
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Send MFA code (OTP) to the user's email and store it with expiry
export const setupMfa = async (req, res) => {
  try {
    const data = req.body;
    const user = await UserModel.findById(data.userId);
    if (!user) return sendBadRequest(res, messages.userNotFound);

    const otp = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.mfa.enabled = false; // enable after successful verification
    user.mfa.method = 'email';
    user.mfa.secret = undefined; // not used for email OTP
    user.mfa.otp = otp;
    user.mfa.otp_expires = expires;



    await user.save();

    await sendMfaEmail({ to: user.email, code: otp, expiresAt: expires });
    return sendSuccess(res, { sentTo: user.email }, messages.mfaCodeSent);
  } catch (e) {
    logger.error('SETUP_MFA_EMAIL');
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, 'SETUP_MFA_EMAIL'));
  }
};

// Verify MFA code (OTP)
export const verifyMfaCode = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return sendBadRequest(res, messages.somethingGoneWrong);

    const user = await UserModel.findById(userId);
    if (!user) return sendBadRequest(res, messages.userNotFound);

    // Email OTP flow
    if (!user.mfa?.otp || !user.mfa?.otp_expires || user.mfa.otp !== otp) {
      return sendBadRequest(res, messages.mfaCodeInvalid);
    }

    if (new Date() > new Date(user.mfa.otp_expires)) {
      // Clear stale OTP
      user.mfa.otp = undefined;
      user.mfa.otp_expires = undefined;
      await user.save();
      return sendBadRequest(res, messages.mfaCodeExpired);
    }

    // OTP is valid; enable MFA (email) and clear it
    user.mfa.enabled = true;
    user.mfa.method = 'email';
    user.mfa.otp = undefined;
    user.mfa.otp_expires = undefined;
    await user.save();

    // Issue a fresh access token after MFA success
    const access_token = await generateAccessToken({ _id: user._id }, user.role);

    await new AuditHistoryModel({
      actor_id: user._id,
      action: "VERIFY_MFA_CODE",
      details: {
        userId: user._id,
        otp,
        role: user.role,
      },
    }).save();
    return sendSuccess(res, { id: user._id, access_token, role: user.role }, messages.mfaCodeVerified);
  } catch (e) {
    logger.error("VERIFY_MFA_CODE");
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, "VERIFY_MFA_CODE"));
  }
};

// Forgot Password - Generate and send reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      // For security, don't reveal if the email exists or not
      return sendSuccess(res, {}, 'If your email is registered, you will receive a password reset link');
    }

    // Generate and save reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    user.reset_token = resetToken;
    user.reset_token_expiry = resetTokenExpiry;
    await user.save();

    // In a real application, you would send an email with the reset link
    const resetUrl = `${config.FRONTEND_BASE_URL}/reset-password?token=${resetToken}`;

    await sendForgotPasswordEmail({
      to: user.email,
      resetUrl,
    });

    await new AuditHistoryModel({
      actor_id: user._id,
      action: "FORGOT_PASSWORD",
      details: {
        email,
        resetToken,
        resetTokenExpiry,
        resetUrl,
        role: user.role,
      },
    }).save();

    // TODO: Send email with reset link

    return sendSuccess(res, {}, 'Password reset link has been sent to your email');
  } catch (error) {
    logger.error('FORGOT_PASSWORD_ERROR');
    logger.error(error);
    return sendBadRequest(res, 'Error processing forgot password request');
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const data = req.body;
    // Find user by reset token and check if it's still valid
    const user = await UserModel.findOne({
      reset_token: data.token,
      reset_token_expiry: { $gt: Date.now() } // Check if token is not expired
    });

    if (!user) {
      return sendBadRequest(res, 'Invalid or expired reset token');
    }

    // Update password and clear reset token
    user.password_hash = bcrypt.hashSync(data.new_password, 10);
    user.reset_token = undefined;
    user.reset_token_expiry = undefined;
    await user.save();

    await new AuditHistoryModel({
      actor_id: user._id,
      action: "RESET_PASSWORD",
      details: {
        email: user.email,
        role: user.role,
      },
    }).save();

    return sendSuccess(res, {}, 'Password has been reset successfully');
  } catch (error) {
    logger.error('RESET_PASSWORD_ERROR');
    logger.error(error);
    return sendBadRequest(res, 'Error resetting password');
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return sendBadRequest(res, 'User not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return sendBadRequest(res, messages.invalidPassword);
    }

    // Hash new password and update
    user.password_hash = await bcrypt.hashSync(new_password, 10);
    await user.save();

    await new AuditHistoryModel({
      actor_id: user._id,
      action: "CHANGE_PASSWORD",
      details: {
        email: user.email,
        role: user.role,
      },
    }).save();

    return sendSuccess(res, {}, messages.passwordChanged);
  } catch (e) {
    logger.error('CHANGE_PASSWORD_ERROR');
    logger.error(e);
    return sendBadRequest(res, messages.somethingGoneWrong);
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const data = req.user

    return sendSuccess(res, data, messages.profileFetched);
  } catch (e) {
    logger.error('GET_PROFILE_ERROR');
    logger.error(e);
    return sendBadRequest(res, messages.somethingGoneWrong);
  }
};



export const updateProfile = async (req, res) => {
  try {
    const data = req.body;

    const user = await UserModel.findById(req.user.id);

    if (req.file) {
      user.profile_url = req.file.path;
    }

    if (!user) {
      return sendBadRequest(res, 'User not found');
    }

    // Update user profile
    if (data.name) {
      user.username = data.name;
    }

    if (data.email) {
      const isUserExist = await UserModel.findOne({ email: data.email });
      if (isUserExist) return sendBadRequest(res, messages.emailAlreadyExist);

      user.email = data.email;
    }

    await new AuditHistoryModel({
      actor_id: user._id,
      action: "UPDATE_PROFILE",
      details: data,
    }).save();

    await user.save();

    return sendSuccess(res, null, messages.profileUpdated);
  } catch (e) {
    logger.error('UPDATE_PROFILE_ERROR');
    logger.error(e);
    return sendBadRequest(res, messages.somethingGoneWrong);
  }
};
