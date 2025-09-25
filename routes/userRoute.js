import express from 'express';
import { body, param } from 'express-validator';
import { validateField } from '../middleware/field_validator/index.js';
import { contactUs, reportUser } from '../controllers/userController.js';

const router = express.Router();

// Apply authentication middleware to all report routes

/**
 * @route   POST /reports
 * @desc    Report a user
 * @access  Private
 */
router.post(
  '/report',
  [
    body('reported_user_id')
      .notEmpty()
      .withMessage('Reported user ID is required')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isString()
      .withMessage('Description must be a string')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
  ],
  validateField,
  reportUser
);


router.post(
  '/contact/request',
  [
    body('subject')
      .notEmpty()
      .withMessage('Subject is required')
      .isString()
      .withMessage('Subject must be a string')
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isString()
      .withMessage('Message must be a string')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters'),
    validateField
  ],
  contactUs
)

export default router;