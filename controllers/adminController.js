import { UserModel } from "../model/UserModel.js";
import { sendSuccess, sendBadRequest } from "../utilities/response/index.js";
import logger from "../utilities/logger.js";
import { errorHelper } from "../helper/errorHelper.js";
import messages from "../utilities/messages.js";
import { BadgeContentModel } from "../model/BaseContentModel.js";
import { ReportModel } from "../model/ReportModel.js";
import { CMSPageModel } from "../model/CmsMode.js";
import { ContactUsModel } from "../model/ContactUsModel.js";
import constant from "../utilities/constant.js";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { dirname } from "path";
import { deleteFile } from "../middleware/field_validator/index.js";
import { SaferDatingMediaModel } from "../model/SaferDatingMediaModel.js";
import { AuditHistoryModel } from "../model/AuditHistoryMddel.js";

/**
 * Get user by ID or list of users with filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUsers = async (req, res) => {
  try {
    const { userId } = req.query;
    const {
      role,
      status,
      subscription,
      badge,
      startDate,
      endDate,
      search, // Common search parameter for username and email
      page = 1,
      limit = 10
    } = req.query;

    // If ID is provided, return single user
    if (userId) {
      const user = await UserModel.findById(userId)
        .populate({
          path: 'badges',
          match: { is_active: true },
          select: 'title'
        })
        .lean();

      if (!user) {
        return sendBadRequest(res, messages.userNotFound);
      }

      let unassignedBadges = [];



      unassignedBadges = await BadgeContentModel.find({
        is_active: true,
        _id: { $nin: user.badges.map(badge => badge._id) }
      }).select('title').lean();



      return sendSuccess(res, { user, unassignedBadges, assignedBadges: user.badges });
    }

    // Build filter object based on query parameters
    const filter = { role: { $ne: constant.ROLE[0] } }; // Always exclude admin users

    // Apply role and status filters
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (subscription) filter.subscription = subscription.toUpperCase();
    if (badge) filter.badges = { $in: [badge] };


    // Apply search across username, email, and full name if search parameter is provided
    if (search) {
      try {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]

        // Create a clean filter object
        const cleanFilter = {};
        if (role) cleanFilter.role = role;
        if (status) cleanFilter.status = status;
        if (subscription) cleanFilter.subscription = subscription.toUpperCase();
        if (badge) cleanFilter.badges = { $in: [badge] };

        // Build the final query
        const query = {
          $and: [
            { role: { $ne: constant.ROLE[0] } }, // Always exclude admin users
            { $or: filter.$or },
            ...Object.entries(cleanFilter).map(([key, value]) => ({ [key]: value }))
          ]
        };

        // Replace the filter with our new query
        Object.keys(filter).forEach(key => delete filter[key]);
        Object.assign(filter, query);

      } catch (error) {
        console.error('Search error:', error);
        logger.error('Error in search filter:', { error, search });
        return sendBadRequest(res, 'Invalid search parameter');
      }
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endOfDay;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await UserModel.countDocuments(filter);

    // Get active users count
    const activeUsers = await UserModel.countDocuments({
      ...filter,
      status: 'ACTIVE'
    });

    // Get inactive users count
    const inactiveUsers = await UserModel.countDocuments({
      ...filter,
      status: 'INACTIVE'
    });

    // Get paginated users
    const results = await UserModel.find(filter)
      .populate({
        path: 'badges',
        select: 'title',  // Select the fields you need
        match: { is_active: true }  // Only include active badges if needed
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return sendSuccess(res, {
      results,
      statistics: {
        totalUsers: total,
        activeUsers,
        inactiveUsers
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (e) {
    logger.error('GET_USERS_ERROR');
    logger.error(e);
    return sendBadRequest(res, messages.somethingGoneWrong);
  }
};


/**
 * Update user profile (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Update user profile (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId)
    if (!user) {
      return sendBadRequest(res, messages.userNotFound)
    }

    if (req.body.subscription) {
      user.subscription = req.body.subscription.toUpperCase()
    }

    if (req.body.badgeId) {
      user.badges.push(req.body.badgeId)
    }
    if (req.body.removeBadgeId) {
      user.badges.pull(req.body.removeBadgeId)
    }

    if (req.body.status) {
      user.status = req.body.status.toUpperCase()
    }
    await user.save()
    await new AuditHistoryModel({
      actor_id: req.user.id,
      action: "UPDATE_USER",
      details: {
        ...req.body,
        email: user.email,
      },
    }).save();
    return sendSuccess(res, null, messages.userUpdated);
  } catch (e) {
    logger.error('UPDATE_USER_ERROR');
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, "UPDATE_USER"));
  }
};



export const getReports = async (req, res) => {
  try {
    const { reportId } = req.query;
    const { status, description, page = 1, limit = 10 } = req.query;

    // If ID is provided, return single report with populated user details
    if (reportId) {
      const report = await ReportModel.findById(reportId)
        .populate({
          path: 'reported_user_id',
          select: 'username email',
          model: 'user'  // Make sure this matches your User model name
        })
        .populate({
          path: 'reporter_user_id',
          select: 'username email',
          model: 'user'  // Make sure this matches your User model name
        })
        .populate({
          path: 'action_taken_by',
          select: 'username email',
          model: 'user',  // Make sure this matches your User model name
          options: { allowEmptyArray: true }  // Handle case where action_taken_by is not set
        })
        .lean();

      if (!report) {
        return sendBadRequest(res, messages.reportNotFound);
      }

      return sendSuccess(res, { report });
    }

    // Build filter
    const filter = {};
    if (status) {
      filter.status = { $regex: status, $options: 'i' };
    }
    if (description) {
      filter.description = { $regex: description, $options: 'i' };
    }

    // Get total count for pagination
    const total = await ReportModel.countDocuments(filter);

    // Get paginated reports with populated user details
    const results = await ReportModel.find(filter)
      .populate({
        path: 'reported_user_id',
        select: 'username email',
        model: 'user'  // Make sure this matches your User model name
      })
      .populate({
        path: 'reporter_user_id',
        select: 'username email',
        model: 'user'  // Make sure this matches your User model name
      })
      .populate({
        path: 'action_taken_by',
        select: 'username email',
        model: 'user',  // Make sure this matches your User model name
        options: { allowEmptyArray: true }  // Handle case where action_taken_by is not set
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    return sendSuccess(res, {
      results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    logger.error('GET_REPORTS_ERROR');
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, "GET_REPORTS"));
  }
};




/**
 * Update report status (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, admin_comment } = req.body;
    const adminId = req.user._id;

    const report = await ReportModel.findById(reportId)
    if (!report) {
      return sendBadRequest(res, messages.reportNotFound)
    }
    if (report.status !== constant.REPORT_STATUS[0]) {
      return sendBadRequest(res, messages.reportAlreadyUpdated)
    }

    await ReportModel.findByIdAndUpdate(
      reportId,
      {
        status,
        admin_comment,
        action_taken_by: adminId
      },
      { new: true, runValidators: true }
    )

    await new AuditHistoryModel({
      actor_id: adminId,
      action: "UPDATE_REPORT_STATUS",
      details: {
        ...req.body,
        email: user.email,
      },
    }).save();

    return sendSuccess(res, messages.reportUpdated);
  } catch (e) {
    logger.error('UPDATE_REPORT_STATUS_ERROR');
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, "UPDATE_REPORT_STATUS"));
  }
};



export const createBadge = async (req, res) => {
  try {
    const { title, status, type } = req.body;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const htmlContent = await readFile(
      path.join(__dirname, '../public/html/social_safer_dating.html'),
      'utf-8'
    );

    if (!req.files || !req.files['icon_url'] || req.files['icon_url'].length === 0) {
      return sendBadRequest(res, messages.iconIsRequired);
    }

    const badge = await new BadgeContentModel({
      title,
      icon_url: req.files['icon_url'][0].path || '',
      html_content: htmlContent,
      status,
    }).save();

    if (badge && type) {
      if (!req.files['safer_dating_media_uri'] || req.files['safer_dating_media_uri'].length === 0) {
        return sendBadRequest(res, messages.mediaIsRequired);
      } else {
        await new SaferDatingMediaModel({
          safer_dating_id: badge._id,
          type: type,
          url: req.files['safer_dating_media_uri'][0].path || '',
          is_active: true
        }).save();
      }
    }

    return sendSuccess(res, null, messages.badgeCreated);
  } catch (error) {
    console.error("CREATE_BADGE_ERROR", error);

    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (file.path) {
            deleteFile(file.path).catch(console.error);
          }
        });
      });
    }

    return sendBadRequest(res, error.message || "Error creating Badge");
  }
};

/**
 * Get all badges or a specific badge by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getBadges = async (req, res) => {
  try {
    const { badgeId, search, status, startDate, endDate } = req.query;
    const { page = 1, limit = 10 } = req.query;

    // If ID is provided, fetch a single badge
    if (badgeId) {
      const badge = await BadgeContentModel.findById(badgeId)
        .populate({
          path: 'safer_dating_media',
          match: { is_active: true },
          select: 'type url'
        })
        .lean();

      if (!badge) return sendBadRequest(res, messages.badgeNotFound);
      return sendSuccess(res, badge);
    }

    // If no ID, fetch all badges with pagination and optional type filter
    const query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    const results = await BadgeContentModel.find(query)
      .populate({
        path: 'safer_dating_media',
        match: { is_active: true },
        select: 'type url'
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await BadgeContentModel.countDocuments(query);

    return sendSuccess(res, {
      results,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });

  } catch (error) {
    console.error('GET_BADGES_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error fetching badges');
  }
};


/**
 * Update a badge by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;
    const updateData = { ...req.body };

    const badge = await BadgeContentModel.findById(badgeId);

    if (!badge) return sendBadRequest(res, messages.badgeNotFound);

    if (req.files && req.files['icon_url'] && req.files['icon_url'].length > 0) {
      if (badge.icon_url) {
        deleteFile(badge.icon_url);
      }
      updateData.icon_url = req.files['icon_url'][0].path;
    }

    await BadgeContentModel.findByIdAndUpdate(
      badgeId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (req.files && req.files['safer_dating_media_uri'] && req.files['safer_dating_media_uri'].length > 0) {
      // const saferDatingMedia = await SaferDatingMediaModel.findOne({ safer_dating_id: badgeId });
      // if(!saferDatingMedia) return sendBadRequest(res, messages.mediaNotFound);
      await SaferDatingMediaModel.updateOne({ safer_dating_id: badgeId }, { $set: { url: req.files['safer_dating_media_uri'][0].path, type: updateData?.type } }, { upsert: true });
    }

    await new AuditHistoryModel({
      actor_id: req.user.id,
      action: "UPDATE_BADGE",
      details: {
        ...req.body,
        icon_url: updateData.icon_url,
        safer_dating_media_uri: updateData.safer_dating_media_uri,
        type: updateData.type,
        badgeId,
      },
    }).save();

    return sendSuccess(res, null, messages.badgeUpdated);
  } catch (error) {
    console.error('UPDATE_BADGE_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error updating badge');
  }
};

/**
 * Delete a badge by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;

    const badge = await BadgeContentModel.findById(badgeId);

    if (!badge) return sendBadRequest(res, messages.badgeNotFound);

    await BadgeContentModel.deleteOne({ _id: badgeId });

    await new AuditHistoryModel({
      actor_id: req.user.id,
      action: "DELETE_BADGE",
      details: {
        badgeId,
      },
    }).save();

    return sendSuccess(res, null, messages.badgeDeleted);
  } catch (error) {
    console.error('DELETE_BADGE_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error deleting badge');
  }
};

/**
 * Assign a badge to a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const assignBadgeToUser = async (req, res) => {
  try {
    const { userId, badgeId } = req.body;

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) return sendBadRequest(res, messages.userNotFound);

    // Validate badge exists
    const badge = await BadgeContentModel.findById(badgeId);
    if (!badge) return sendBadRequest(res, messages.badgeNotFound);

    // Check if user already has this badge
    if (user.badges && user.badges.includes(badgeId)) return sendBadRequest(res, messages.userAlreadyHasThisBadge);

    // Add badge to user
    await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { badges: badgeId } },
      { new: true }
    );

    return sendSuccess(res, null, messages.badgeAssignedToUserSuccessfully);
  } catch (error) {
    console.error('ASSIGN_BADGE_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error assigning badge to user');
  }
};

/**
 * Remove a badge from a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeBadgeFromUser = async (req, res) => {
  try {
    const { userId, badgeId } = req.body;

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) return sendBadRequest(res, messages.userNotFound);

    // Check if user has this badge
    if (!user.badges || !user.badges.includes(badgeId)) return sendBadRequest(res, messages.userDoesNotHaveThisBadge);

    // Remove badge from user
    await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { badges: badgeId } },
      { new: true }
    );

    return sendSuccess(res, null, messages.badgeRemovedFromUserSuccessfully);
  } catch (error) {
    console.error('REMOVE_BADGE_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error removing badge from user');
  }
};

/**
 * Create a new CMS page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createCmsPage = async (req, res) => {
  try {
    const { page_name, content, status } = req.body;

    // Check if page with same name already exists
    const existingPage = await CMSPageModel.findOne({ page_name });
    if (existingPage) return sendBadRequest(res, messages.pageNameAlreadyExists);

    const newPage = new CMSPageModel({
      page_name,
      content,
      status: status || 'DRAFT'
    });

    await newPage.save();

    await new AuditHistoryModel({
      actor_id: req.user.id,
      action: "CREATE_CMS_PAGE",
      details: {
        ...req.body,
        page_name,
        content,
        status,
      },
    }).save();

    return sendSuccess(res, null, messages.cmsPageCreatedSuccessfully);
  } catch (error) {
    console.error('CREATE_CMS_PAGE_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error creating CMS page');
  }
};

/**
 * Get CMS pages or a single page by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCmsPages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, pageId, status, startDate, endDate } = req.query;

    // If ID is provided, fetch a single page
    if (pageId) {
      const page = await CMSPageModel.findById(pageId);
      if (!page) {
        return sendBadRequest(res, messages.cmsPageNotFound, 404);
      }
      return sendSuccess(res, page);
    }

    // Build query for multiple pages
    const query = {};
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { page_name: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }


    const results = await CMSPageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await CMSPageModel.countDocuments(query);

    return sendSuccess(res, {
      results,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalItems: count
      }
    });
  } catch (error) {
    console.error('GET_CMS_PAGES_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error fetching CMS pages');
  }
};

/**
 * Update a CMS page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateCmsPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { page_name, content, status } = req.body;

    // Check if page exists
    const page = await CMSPageModel.findById(pageId);
    if (!page) {
      return sendBadRequest(res, messages.cmsPageNotFound, 404);
    }

    // Check if page with new name already exists (if name is being changed)
    if (page_name && page_name !== page.page_name) {
      const existingPage = await CMSPageModel.findOne({ page_name });
      if (existingPage) {
        return sendBadRequest(res, messages.pageNameAlreadyExists, 400);
      }
    }

    // Update page
    await CMSPageModel.findByIdAndUpdate(
      pageId,
      {
        $set: {
          ...(page_name && { page_name }),
          ...(content && { content }),
          ...(status && { status })
        }
      },
      { new: true, runValidators: true }
    );

    await new AuditHistoryModel({
      actor_id: req.user.id,
      action: "UPDATE_CMS_PAGE",
      details: {
        ...req.body,
        page_name,
        content,
        status,
      },
    }).save();

    return sendSuccess(res, null, messages.cmsPageUpdatedSuccessfully);
  } catch (error) {
    console.error('UPDATE_CMS_PAGE_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error updating CMS page');
  }
};



/**
 * Delete a CMS page by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteCmsPage = async (req, res) => {
  try {
    const { pageId } = req.params;

    const page = await CMSPageModel.findByIdAndDelete(pageId);
    if (!page) {
      return sendBadRequest(res, messages.cmsPageNotFound, 404);
    }

    await new AuditHistoryModel({
      actor_id: req.user.id,
      action: "DELETE_CMS_PAGE",
      details: {
        pageId,
      },
    }).save();

    return sendSuccess(res, null, messages.cmsPageDeletedSuccessfully);
  } catch (error) {
    console.error('DELETE_CMS_PAGE_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error deleting CMS page');
  }
};


/**
 * Get list of contact requests or a single contact request by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getContactRequests = async (req, res) => {
  try {
    const { contactId, status, adminId, search, userId, startDate, endDate } = req.query;
    let { page = 1, limit = 10 } = req.query;

    // Convert to numbers
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const skip = (page - 1) * limit;

    // If contactId is provided, return single contact request
    if (contactId) {
      const contact = await ContactUsModel.findById(contactId)
        .populate('user_id', 'username email');

      if (!contact) {
        return sendBadRequest(res, messages.contactRequestNotFound, 404);
      }

      return sendSuccess(res, contact, messages.contactRequestRetrievedSuccessfully);
    }

    // Build the query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (adminId) {
      query.admin_id = adminId;
    }
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ]
    }
    if (userId) {
      query.user_id = userId;
    }
    if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }
    // Get total count for pagination
    const total = await ContactUsModel.countDocuments(query);

    // Get paginated results
    const results = await ContactUsModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'username email');

    // Prepare response
    const response = {
      results,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };

    return sendSuccess(res, response, messages.contactRequestsRetrievedSuccessfully);
  } catch (error) {
    console.error('GET_CONTACT_REQUESTS_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error retrieving contact requests');
  }
};


/**
 * Delete a CMS page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get list of contact requests or a single contact request by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Respond to a contact request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const respondToContactRequest = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { response, status } = req.body;
    const adminId = req.user._id; // Assuming admin ID is available from auth middleware


    // Find and update the contact request
    const updatedContact = await ContactUsModel.findOneAndUpdate(
      { _id: contactId },
      {
        $set: {
          admin_response: response,
          admin_id: adminId,
          status: status.toUpperCase(),
          responded_at: new Date()
        }
      },
      { new: true, runValidators: true }
    )

    if (!updatedContact) {
      return sendBadRequest(res, messages.contactRequestNotFound, 404);
    }

    await new AuditHistoryModel({
      actor_id: req.user.id,
      action: "RESPOND_TO_CONTACT_REQUEST",
      details: {
        ...req.body,
        subject: updatedContact.subject,
        message: updatedContact.message,
        contactId,
      },
    }).save();


    return sendSuccess(res, updatedContact, messages.responseSentSuccessfully);
  } catch (error) {
    console.error('RESPOND_TO_CONTACT_REQUEST_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error sending response to contact request');
  }
};



export const getAuditHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.action = { $regex: search, $options: 'i' };
    }

    if(startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    }

    if(endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    const results = await AuditHistoryModel.find(query)
      .populate({
        path: 'actor_id',
        select: 'username email',
        model: 'user' // Explicitly specify the model name
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const count = await AuditHistoryModel.countDocuments(query);

    return sendSuccess(res, {
      results,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalItems: count
      }
    });
  } catch (error) {
    console.error('GET_AUDIT_HISTORY_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error retrieving audit history');
  }
};