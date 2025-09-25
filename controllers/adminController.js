import { UserModel } from "../model/UserModel.js";
import { sendSuccess, sendBadRequest } from "../utilities/response/index.js";
import logger from "../utilities/logger.js";
import { errorHelper } from "../helper/errorHelper.js";
import messages from "../utilities/messages.js";
import { BaseContent } from "../model/BaseContentModel.js";
import { CheckinChampModel } from "../model/CheckinChampModel.js";
import { GreenHaloModel } from "../model/GreenHaloModel.js";
import { SocialConnectModel } from "../model/SocialConnectModel.js";
import { GreenFlaggedModel } from "../model/GreenFlaggedModel.js";
import { HalodModel } from "../model/HalodModel.js";
import { SaferDatingModel } from "../model/SaferDatingModel.js";
import { SaferDatingMediaModel } from "../model/SaferDatingMediaModel.js";
import { ReportModel } from "../model/ReportModel.js";
import { CMSPageModel } from "../model/CmsMode.js";
import { ContactUsModel } from "../model/ContactUsModel.js";
import constant from "../utilities/constant.js";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { dirname } from "path";
import { deleteFile } from "../middleware/field_validator/index.js";

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
      username,
      email,
      badge,
      startDate,
      endDate,
      search, // New search parameter for general text search
      page = 1,
      limit = 10
    } = req.query;

    // If ID is provided, return single user
    if (userId) {
      const user = await UserModel.findById(userId)
        .lean();

      if (!user) {
        return sendBadRequest(res, messages.userNotFound);
      }

      return sendSuccess(res,  user );
    }

    // Build filter object based on query parameters
    const filter = { role: { $ne: constant.ROLE[0] } }; // Always exclude admin users

    // Text search across multiple fields if search query is provided
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.fullName': { $regex: search, $options: 'i' } }
      ];
    } else {
      // Individual field filters (only if no general search)
      if (role) filter.role = role;
      if (status) filter.status = status;
      if (subscription) filter.subscription = subscription.toUpperCase();
      if (username) filter.username = { $regex: username, $options: 'i' };
      if (email) filter.email = { $regex: email, $options: 'i' };
      if (badge) filter.badges = { $in: [badge] };
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
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId)
    if (!user) {
      return sendBadRequest(res, messages.userNotFound)
    }

    if (req.body.subscription) {
      user.subscription = req.body.subscription.toUpperCase()
    }
    if (req.body.badge) {
      user.badges = req.body.badge
    }
    if (req.body.status) {
      user.status = req.body.status.toUpperCase()
    }
    await user.save()
    return sendSuccess(res, null, messages.userUpdated);
  } catch (e) {
    logger.error('UPDATE_USER_PROFILE_ERROR');
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, "UPDATE_USER_PROFILE"));
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

    return sendSuccess(res, messages.reportUpdated);
  } catch (e) {
    logger.error('UPDATE_REPORT_STATUS_ERROR');
    logger.error(e);
    return sendBadRequest(res, errorHelper(e, "UPDATE_REPORT_STATUS"));
  }
};



export const createCheckinChamp = async (req, res) => {
  try {
    const { title, status } = req.body;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const htmlContent = await readFile(
      path.join(__dirname, '../public/html/checkin.html'),
      'utf-8'
    );
    if(!req.file){
      return sendBadRequest(res, messages.iconIsRequired)
    }

    await new CheckinChampModel({
      title,
      icon_url : req.file.path || '',
      html_content : htmlContent,
      status,
    }).save();

    return sendSuccess(res, null, messages.checkinChampCreated);
  } catch (error) {
    console.error("CREATE_CHECKIN_CHAMP_ERROR", error);
    return sendBadRequest(res, error.message || "Error creating Checkin Champ");
  }
};


export const createGreenhaloChamp = async (req, res) => {
  try {
    const { title, status } = req.body;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const htmlContent = await readFile(
      path.join(__dirname, '../public/html/greenhalo.html'),
      'utf-8'
    );

    if(!req.file){
      return sendBadRequest(res, messages.iconIsRequired)
    }

    await new GreenHaloModel({
      title,
      icon_url : req.file.path || '',
      html_content : htmlContent,
      status,
    }).save();

    return sendSuccess(res, null, messages.greenHaloBadgeCreated);
  } catch (error) {
    console.error("CREATE_GREENHALO_CHAMP_ERROR", error);
    return sendBadRequest(res, error.message || "Error creating Greenhalo Champ");
  }
};


export const createSocialConnectChamp = async (req, res) => {
  try {
    const { title, status } = req.body;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const htmlContent = await readFile(
      path.join(__dirname, '../public/html/social_connect.html'),
      'utf-8'
    );

    if(!req.file){
      return sendBadRequest(res, messages.iconIsRequired)
    }

    await new SocialConnectModel({
      title,
      icon_url : req.file.path || '',
      html_content : htmlContent,
      status,
    }).save();

    return sendSuccess(res, null, messages.socialConnectBadgeCreated);
  } catch (error) {
    console.error("CREATE_SOCIAL_CONNECT_CHAMP_ERROR", error);
    return sendBadRequest(res, error.message || "Error creating Social Connect Champ");
  }
};


export const createGreenFlaggedBadge = async (req, res) => {
  try {
    const { title, status } = req.body;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const htmlContent = await readFile(
      path.join(__dirname, '../public/html/green_flagged.html'),
      'utf-8'
    );

    if(!req.file){
      return sendBadRequest(res, messages.iconIsRequired)
    }

    await new GreenFlaggedModel({
      title,
      icon_url : req.file.path || '',
      html_content : htmlContent,
      status,
    }).save();

    return sendSuccess(res, null, messages.greenFlaggedBadgeCreated);
  } catch (error) {
    console.error("CREATE_GREEN_FLAGGED_BADGE_ERROR", error);
    return sendBadRequest(res, error.message || "Error creating Green Flagged Badge");
  }
};



export const createHalodBadge = async (req, res) => {
  try {
    const { title, status } = req.body;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const htmlContent = await readFile(
      path.join(__dirname, '../public/html/halod.html'),
      'utf-8'
    );

    if(!req.file){
      return sendBadRequest(res, messages.iconIsRequired)
    }

    await new HalodModel({
      title,
      icon_url : req.file.path || '',
      html_content : htmlContent,
      status,
    }).save();

    return sendSuccess(res, null, messages.halodBadgeCreated);
  } catch (error) {
    console.error("CREATE_HALOD_BADGE_ERROR", error);
    return sendBadRequest(res, error.message || "Error creating Halod Badge");
  }
};



export const createSaferDatingBadge = async (req, res) => {
  try {
    const { title, status } = req.body;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const htmlContent = await readFile(
      path.join(__dirname, '../public/html/safer_dating.html'),
      'utf-8'
    );

    if(!req.file){
      return sendBadRequest(res, messages.iconIsRequired)
    }

    await new SaferDatingModel({
      title,
      icon_url : req.file.path || '',
      html_content : htmlContent,
      status,
    }).save();

    return sendSuccess(res, null, messages.saferDatingBadgeCreated);
  } catch (error) {
    console.error("CREATE_SAFER_DATING_BADGE_ERROR", error);
    return sendBadRequest(res, error.message || "Error creating Safer Dating Badge");
  }
};


/**
 * Get all badges or a specific badge by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getBadges = async (req, res) => {
  try {
    const { badgeId, title, status, type } = req.query;
    const { page = 1, limit = 10 } = req.query;
    
    // If ID is provided, fetch a single badge
    if (badgeId) {
      const badge = await BaseContent.findById(badgeId).lean();
      if (!badge) return sendBadRequest(res,messages.badgeNotFound);
      return sendSuccess(res, badge);
    }
    
    // If no ID, fetch all badges with pagination and optional type filter
    const query = {};
    if (type) {
      query.contentType = type;
    }
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    
    const results = await BaseContent.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const count = await BaseContent.countDocuments(query);
    
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


export const createSocialSaferDatingBadge = async (req, res) => {
  try {
    const { type , safer_dating_id } = req.body;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const htmlContent = await readFile(
      path.join(__dirname, '../public/html/social_safer_dating.html'),
      'utf-8'
    );

    await new SaferDatingMediaModel({
      safer_dating_id : safer_dating_id,
      type : type,
      url : req.file.path || '',
    }).save();

    return sendSuccess(res, null, messages.socialSaferDatingBadgeCreated);
  } catch (error) {
    console.error("CREATE_SOCIAL_SAFER_DATING_BADGE_ERROR", error);
    return sendBadRequest(res, error.message || "Error creating Social Safer Dating Badge");
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

    const badge = await BaseContent.findById(badgeId);

    if (!badge) return sendBadRequest(res,messages.badgeNotFound);

    if (req.file) {
      if(badge.icon_url){
        deleteFile(badge.icon_url);
      }
      updateData.icon_url = req.file.path;
    }

    await BaseContent.findByIdAndUpdate(
      badgeId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

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

    const badge = await BaseContent.findById(badgeId);
    
    if (!badge) return sendBadRequest(res,messages.badgeNotFound);
   
    await BaseContent.deleteOne({ _id: badgeId });

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
    if (!user) return sendBadRequest(res,messages.userNotFound);

    // Validate badge exists
    const badge = await BaseContent.findById(badgeId);
    if (!badge) return sendBadRequest(res,messages.badgeNotFound);

    // Check if user already has this badge
    if (user.badges && user.badges.includes(badgeId)) return sendBadRequest(res,messages.userAlreadyHasThisBadge);

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
    if (!user) return sendBadRequest(res,messages.userNotFound);

    // Check if user has this badge
    if (!user.badges || !user.badges.includes(badgeId)) return sendBadRequest(res,messages.userDoesNotHaveThisBadge);
    
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
    if (existingPage) return sendBadRequest(res,messages.pageNameAlreadyExists);

    const newPage = new CMSPageModel({
      page_name,
      content,
      status: status || 'DRAFT'
    });

    await newPage.save();

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
    const { pageId } = req.query;
    const { page = 1, limit = 10, status, page_name, content } = req.query;

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

    if (page_name) {
      query.page_name = { $regex: page_name, $options: 'i' };
    }

    if (content) {
      query.content = { $regex: content, $options: 'i' };
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
    const { contactId, status, adminId, subject, message, userId } = req.query;
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
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (message) {
      query.message = { $regex: message, $options: 'i' };
    }
    if (userId) {
      query.user_id = userId;
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


    return sendSuccess(res, updatedContact, messages.responseSentSuccessfully);
  } catch (error) {
    console.error('RESPOND_TO_CONTACT_REQUEST_ERROR:', error);
    return sendBadRequest(res, error.message || 'Error sending response to contact request');
  }
};