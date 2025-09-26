import mongoose from 'mongoose'
import constant from '../utilities/constant.js'
const Schema = mongoose.Schema

const BadgeContentSchema = new Schema({
  title: { type: String },
  icon_url: { type: String },
  html_content: { type: String },
  status: { type: Boolean, default: true },
  type: { type: String, enum: constant?.MEDIA_TYPE || [] }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for safer dating media
BadgeContentSchema.virtual('safer_dating_media', {
  ref: 'safer_dating_media', // The model to use
  localField: '_id', // Find safer_dating_media where `localField`
  foreignField: 'safer_dating_id', // is equal to `foreignField`
  justOne: false // Set to false to return many
});

export const BadgeContentModel = mongoose.model("badge", BadgeContentSchema);
