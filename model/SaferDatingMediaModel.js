import mongoose from 'mongoose'
import constant from '../utilities/constant.js'
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const SaferDatingMediaSchema = new Schema({
    safer_dating_id: { type: ObjectId, ref: "safer_dating" },
    type: { type: String, enum: constant.MEDIA_TYPE },
    url: { type: String, required: true },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

export const SaferDatingMediaModel = mongoose.model('safer_dating_media', SaferDatingMediaSchema);
