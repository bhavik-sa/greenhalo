import express from "express";
import { 
  login, 
  setupMfa, 
  verifyMfaCode, 
  forgotPassword, 
  resetPassword, 
  getProfile, 
  changePassword,
  creatUser, 
  updateProfile
} from "../controllers/authController.js";
import { body } from "express-validator";
import { validateField } from "../middleware/field_validator/index.js";
import messages from "../utilities/messages.js";
import { isAdmin } from "../middleware/admin_validator/admin_validator.js";
import { upload } from "../helper/multerHelper.js";

const router = express.Router();



router.post(
  '/create-user',
  isAdmin,
  creatUser
);



// Admin
router.post(
  '/login',
  [
    body('email').isEmail().withMessage(messages.inValidEmail),
    body('password').isString().isLength({ min: 6 }).withMessage(messages.invalidPassword)
  ],
  validateField,
  login
);

// MFA routes
router.post(
  '/mfa/setup',
  [
    body('userId').isMongoId().withMessage(messages.inValidId)
  ],
  validateField,
  setupMfa
);

router.post(
  '/mfa/verify',
  [
    body('userId').isMongoId().withMessage(messages.inValidId),
    body('otp').isString().isLength({ min: 6 }).withMessage(messages.inValidOtp)
  ],
  validateField,
  verifyMfaCode
);

// Password reset routes
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage(messages.inValidEmail)
  ],
  validateField,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage(messages.resetTokenRequired),
    body('new_password').exists().withMessage(messages.newPasswordRequired),
    body('new_password')
      .isLength({ min: 8 })
      .withMessage(messages.passwordMustHave8CharacterLong),
    body('new_password')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/)
      .withMessage(messages.passwordFormatIsNotValid)
  ],
  validateField,
  resetPassword
);

// Get user profile
router.get(
  '/profile',
  isAdmin,
  getProfile
);

// Update user profile
router.put(
  '/profile',
  upload.single('profile_image'),
  isAdmin,
  updateProfile
);

// Change password
router.post(
  '/change-password',
  isAdmin,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  validateField,
  changePassword
);

export default router;
