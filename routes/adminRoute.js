import express from "express";
import { body, param, query } from "express-validator";
import {
  assignBadgeToUser,
  createBadge,
  createCmsPage,
  deleteBadge,
  deleteCmsPage,
  getAuditHistory,
  getBadges,
  getCmsPages,
  getContactRequests,
  getReports,
  getUsers,
  removeBadgeFromUser,
  respondToContactRequest,
  updateBadge,
  updateCmsPage,
  updateReportStatus,
  updateUser,
} from "../controllers/adminController.js";
import { validateField } from "../middleware/field_validator/index.js";
import constant from "../utilities/constant.js";
import { isAdmin } from "../middleware/admin_validator/admin_validator.js";
import { upload } from "../helper/multerHelper.js";
import messages from "../utilities/messages.js";

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(isAdmin);

/**
 * @route   GET /admin/users
 * @desc    Get all users with optional filters
 * @access  Private/Admin
 * @query   {string} [role] - Filter by user role
 * @query   {string} [status] - Filter by user status
 * @query   {string} [subscription] - Filter by subscription type
 * @query   {string} [badge] - Filter by badge
 * @query   {string} [startDate] - Start date for filtering (YYYY-MM-DD)
 * @query   {string} [endDate] - End date for filtering (YYYY-MM-DD)
 * @query   {number} [page=1] - Page number for pagination
 * @query   {number} [limit=10] - Number of items per page
 */
router.get(
  '/users',
  [
    isAdmin,
    query('userId')
      .optional()
      .isMongoId()
      .withMessage(messages.invalidUserId),
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string')
      .trim()
      .notEmpty()
      .withMessage('Search cannot be empty'),
    query("subscription")
      .optional()
      .isString()
      .withMessage(messages.invalidSubscription),
    query('role')
      .optional()
      .isIn(constant.ROLE)
      .withMessage(messages.invalidRole),
    query('status')
      .optional()
      .isIn(constant.USER_STATUS)
      .withMessage(messages.invalidStatus),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage(messages.pageMustBeAPositiveInteger),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage(messages.limitMustBeBetween1And100),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage(messages.invalidStartDate),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage(messages.invalidEndDate)
  ],
  validateField,
  getUsers
);

/**
 * @route   GET /admin/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 * @param   {string} id - User ID
 */



/**
 * @route   PATCH /admin/users/:userId
 * @desc    Update user profile (admin only)
 * @access  Private/Admin
 * @param   {string} userId - User ID to update
 */
router.put(
  '/update/:userId',
  [
    isAdmin,
    param('userId')
      .notEmpty()
      .withMessage(messages.userIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidUserId),
    body('status')
      .optional()
      .isIn(constant.USER_STATUS)
      .withMessage(messages.invalidStatus),
    body('subscription')
      .optional()
      .isString()
      .withMessage(messages.invalidSubscription),
    // body('badgeId')
    //   .optional()
    //   .isMongoId()
    //   .withMessage(messages.invalidBadgeId),
  ],
  validateField,
  updateUser
);



// Add these routes after your existing routes
/**
 * @route   GET /admin/reports
 * @route   GET /admin/reports/:id
 * @desc    Get all reports or a single report by ID (admin only)
 * @access  Private/Admin
 */
router.get(
  '/report',
  [
    isAdmin,
    query('reportId')
      .optional()
      .isMongoId()
      .withMessage(messages.invalidReportId),
    query('status')
      .optional()
      .isIn(constant.REPORT_STATUS)
      .withMessage(messages.invalidStatus),
    query('description')
      .optional()
      .isString()
      .withMessage(messages.descriptionMustBeAString),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage(messages.pageMustBeAPositiveInteger),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage(messages.limitMustBeBetween1And100)
  ],
  validateField,
  getReports
);


router.patch(
  '/report/:reportId',
  [
    param('reportId')
      .notEmpty()
      .withMessage(messages.reportIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidReportId),
    body('status')
      .notEmpty()
      .withMessage(messages.statusIsRequired)
      .isIn(constant.REPORT_STATUS)
      .withMessage(messages.invalidStatus),
    body('admin_comment')
      .isString()
      .withMessage(messages.adminCommentIsRequired)
  ],
  validateField,
  updateReportStatus
);




router.post(
  '/badge',
  isAdmin,
  (req, res, next) => {
    const uploadFields = [
      { name: 'icon_url', maxCount: 1 },
      { name: 'safer_dating_media_uri', maxCount: 1 }
    ];
    upload.fields(uploadFields)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  [
    body('title')
      .notEmpty()
      .withMessage(messages.titleIsRequired),
    body('html_content')
      .notEmpty()
      .withMessage(messages.htmlContentIsRequired),
    body('status')
      .optional()
      .isBoolean()
      .withMessage(messages.statusMustBeABoolean),
    body('type')
      .optional()
      .isString()
      .isIn(constant.MEDIA_TYPE)
      .withMessage(messages.invalidType), 
  ],

  validateField,
  createBadge
);



router.get(
  '/badge',
  isAdmin,
  [
    query('badgeId')
      .optional()
      .isMongoId()
      .withMessage(messages.invalidBadgeId),
    query('userId')
      .optional()
      .isMongoId()
      .withMessage(messages.invalidUserId),
    query('status')
      .optional()
      .isBoolean()
      .withMessage(messages.statusMustBeABoolean),
    query('search')
      .optional()
      .isString()
      .withMessage(messages.searchMustBeAString),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage(messages.invalidStartDate),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage(messages.invalidEndDate),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage(messages.pageMustBeAPositiveInteger),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage(messages.limitMustBeBetween1And100),
  ],
  validateField,
  getBadges
);



router.put(
  '/update/badge/:badgeId',
  isAdmin,
  (req, res, next) => {
    const uploadFields = [
      { name: 'icon_url', maxCount: 1 },
      { name: 'safer_dating_media_uri', maxCount: 1 }
    ];
    upload.fields(uploadFields)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  [
    param('badgeId')
      .notEmpty()
      .withMessage(messages.badgeIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidBadgeId),
    body('title')
      .optional()
      .isString()
      .withMessage(messages.titleMustBeAString),
    body('status')
      .optional()
      .isBoolean()
      .withMessage(messages.statusMustBeABoolean),
    body('html_content')
      .optional()
      .isString()
      .withMessage(messages.htmlContentMustBeAString),
    body('type')
      .optional()
      .isString()
      .isIn(constant.MEDIA_TYPE)
      .withMessage(messages.invalidType),
      
  ],
  validateField,
  updateBadge
);

router.delete(
  '/delete/badge/:badgeId',
  isAdmin,
  [
    param('badgeId')
      .notEmpty()
      .withMessage(messages.badgeIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidBadgeId),
  ],
  validateField,
  deleteBadge
);

// Badge assignment routes
router.post(
  '/user/badge/assign',
  isAdmin,
  [
    body('userId')
      .notEmpty()
      .withMessage(messages.userIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidUserId),
    body('badgeId')
      .notEmpty()
      .withMessage(messages.badgeIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidBadgeId),
  ],
  validateField,
  assignBadgeToUser
);

router.patch(
  '/user/badge/remove',
  isAdmin,
  [
    body('userId')
      .notEmpty()
      .withMessage(messages.userIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidUserId),
    body('badgeId')
      .notEmpty()
      .withMessage(messages.badgeIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidBadgeId),
  ],
  validateField,
  removeBadgeFromUser
);

// CMS Page Management Routes
router.post(
  '/cms-page',
  isAdmin,
  [
    body('page_name')
      .notEmpty()
      .withMessage(messages.pageNameIsRequired)
      .isString()
      .withMessage(messages.pageNameMustBeAString),
    body('content')
      .notEmpty()
      .withMessage(messages.contentIsRequired)
      .isString()
      .withMessage(messages.contentMustBeAString),
    body('status')
      .optional()
      .isIn(constant.CMS_PAGE_STATUS)
      .withMessage(messages.invalidStatus),
  ],
  validateField,
  createCmsPage
);

router.get(
  '/cms-page',
  isAdmin,
  [
    query('pageId')
      .optional()
      .isMongoId()
      .withMessage(messages.invalidCmsPageId),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage(messages.pageMustBeAPositiveInteger),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage(messages.limitMustBeBetween1And100),
    query('status')
      .optional()
      .isIn(constant.CMS_PAGE_STATUS)
      .withMessage(messages.invalidStatus),
    query('search')
      .optional()
      .isString()
      .withMessage(messages.searchMustBeAString),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage(messages.invalidStartDate),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage(messages.invalidEndDate),
  ],
  validateField,
  getCmsPages
);

router.put(
  '/cms-page/:pageId',
  isAdmin,
  [
    param('pageId')
      .notEmpty()
      .withMessage(messages.pageIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidCmsPageId),
    body('page_name')
      .optional()
      .isString()
      .withMessage(messages.pageNameMustBeAString),
    body('content')
      .optional()
      .isString()
      .withMessage(messages.contentMustBeAString),
    body('status')
      .optional()
      .isIn(constant.CMS_PAGE_STATUS)
      .withMessage(messages.invalidStatus),
  ],
  validateField,
  updateCmsPage
);

router.delete(
  '/cms-page/:pageId',
  isAdmin,
  [
    param('pageId')
      .notEmpty()
      .withMessage(messages.pageIdIsRequired)
      .isMongoId()
      .withMessage(messages.invalidCmsPageId),
  ],
  validateField,
  deleteCmsPage
);

/**
 * @route   GET /admin/contact-requests/:contactId?
 * @desc    Get list of contact requests or single contact by ID
 * @access  Private/Admin
 * @query   {number} [page=1] - Page number for pagination
 * @query   {number} [limit=10] - Number of items per page
 * @query   {string} [status] - Filter by status (e.g., 'pending', 'resolved')
 * @param   {string} [contactId] - Contact request ID (optional)
 */
router.get(
  '/contact-request',
  isAdmin,
  [
    query('contactId')
      .optional()
      .isMongoId()
      .withMessage(messages.invalidContactRequestId),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage(messages.pageMustBeAPositiveInteger),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage(messages.limitMustBeBetween1And100),
    query('status')
      .optional()
      .isIn(constant.CONTACT_US_STATUS)
      .withMessage(messages.invalidStatus),
    query('adminId')
      .optional()
      .isMongoId()
      .withMessage(messages.inValidId),
    query('search')
      .optional()
      .isString()
      .withMessage(messages.searchMustBeAString),
    query('userId')
      .optional()
      .isMongoId()
      .withMessage(messages.inValidId),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage(messages.invalidStartDate),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage(messages.invalidEndDate),
    
  ],
  validateField,
  getContactRequests
);

/**
 * @route   PUT /admin/contact-request/:contactId/respond
 * @desc    Respond to a contact request
 * @access  Private/Admin
 * @body    {string} response - The admin's response to the contact request
 * @body    {string} [status] - Optional status to set (defaults to 'resolved')
 */
router.put(
  '/contact-request/respond/:contactId',
  isAdmin,
  [
    param('contactId')
      .isMongoId()
      .withMessage(messages.invalidContactRequestId),
    body('response')
      .trim()
      .notEmpty()
      .withMessage(messages.responseIsRequired)
      .isLength({ min: 10, max: 5000 })
      .withMessage(messages.responseMustBeBetween10And5000Characters),
    body('status')
      .optional()
      .isIn(constant.CONTACT_US_STATUS)
      .withMessage(messages.invalidStatus),
  ],
  validateField,
  respondToContactRequest
);

// Audit History Routes
  router.get(
    '/audit-history',
    isAdmin,
    [
      query('search').optional().isString().trim(),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    validateField,
    getAuditHistory
  );

// Export the router
export default router;
