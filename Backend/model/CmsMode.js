import mongoose from 'mongoose'
import constant from '../utilities/constant.js'
const Schema = mongoose.Schema

const CMSPageSchema = new Schema({
    page_name: { type: String },
    content: {type:String},
    status: { type: String, enum: constant.CMS_PAGE_STATUS, default: constant.CMS_PAGE_STATUS[0] },
}, { timestamps: true });

export const CMSPageModel = mongoose.model('cms_page', CMSPageSchema)