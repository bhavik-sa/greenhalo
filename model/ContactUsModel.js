import mongoose from 'mongoose'
import constant from '../utilities/constant.js'
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema
const ContactSchema = new Schema({
    user_id: { type: ObjectId, ref: "user" },
    subject: {type:String, required:true},
    message: {type:String, required:true},
    admin_response: {type:String},
    admin_id: { type: ObjectId, ref: "user" },
    status: { type: String, enum: constant.CONTACT_US_STATUS, default: constant.CONTACT_US_STATUS[0] },
}, { timestamps: true });

export const ContactUsModel = mongoose.model('contact_us', ContactSchema)
