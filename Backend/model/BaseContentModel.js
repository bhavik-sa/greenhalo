import mongoose from 'mongoose'
const Schema = mongoose.Schema

const BaseContentSchema = new Schema({
  title: { type: String},
  icon_url: { type: String },
  html_content: { type: String },
  status: { type: Boolean, default: true },
}, { timestamps: true, discriminatorKey: "contentType" });

export const BaseContent = mongoose.model("base_content", BaseContentSchema);



