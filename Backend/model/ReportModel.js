import mongoose from 'mongoose'
import constant from '../utilities/constant.js'
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const ReportSchema = new Schema({
    reported_user_id: { type: ObjectId, ref: "user" },
    reporter_user_id: { type: ObjectId, ref: "user" },
    description: { type: String },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: constant.REPORT_STATUS, default: constant.REPORT_STATUS[0] },
    action_taken_by: { type: ObjectId, ref: "user" },
    admin_comment: { type: String }
}, { timestamps: true });


export const ReportModel = mongoose.model('report', ReportSchema)
