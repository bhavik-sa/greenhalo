import { ReportModel } from '../model/ReportModel.js';
import { sendSuccess, sendBadRequest } from '../utilities/response/index.js';
import logger from '../utilities/logger.js';
import { errorHelper } from '../helper/errorHelper.js';
import messages from '../utilities/messages.js';
import constant from '../utilities/constant.js';
import { ContactUsModel } from '../model/ContactUsModel.js';

/**
 * Report a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const reportUser = async (req, res) => {
    try {
      const { reported_user_id, description } = req.body;
      const reporter_user_id = "68d257dbd48f7d5e80b20bfd"; // From auth middleware
  
      // Check if user is trying to report themselves
      if (String(reported_user_id) === String(reporter_user_id)) {
        return sendBadRequest(res, messages.cannotReportSelf);
      }
  
      // Check if user has already reported this user
      const existingReport = await ReportModel.findOne({
        reported_user_id,
        reporter_user_id,
        status: constant.REPORT_STATUS[0]
      });
  
      if (existingReport) {
        return sendBadRequest(res, messages.alreadyReported);
      }
  
      // Create new report
      const report = new ReportModel({
        reported_user_id,
        reporter_user_id,
        description,
        status: constant.REPORT_STATUS[0]
      });
  
      await report.save();
  
      return sendSuccess(res, { report }, messages.reportSubmitted);
    } catch (e) {
      logger.error('REPORT_USER_ERROR');
      logger.error(e);
      return sendBadRequest(res, errorHelper(e, "REPORT_USER"));
    }
  };


export const contactUs = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const user_id = "68d25750d48f7d5e80b20bee"; // Assuming user is authenticated
        
        // Create new contact us entry
        await ContactUsModel.create({
            user_id,
            subject,
            message,
            status: constant.CONTACT_US_STATUS[0] // Pending
        });
        
        return sendSuccess(res, null, messages.contactSubmitted);
    } catch (error) {
        console.error('CONTACT_US_ERROR:', error);
        return sendBadRequest(res, error.message || 'Error submitting contact form');
    }
};
