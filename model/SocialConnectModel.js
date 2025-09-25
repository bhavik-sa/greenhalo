import mongoose from 'mongoose'
import { BaseContent } from './BaseContentModel.js'
const Schema = mongoose.Schema

const SocialConnectSchema = new Schema({});
  
export const SocialConnectModel = BaseContent.discriminator("social_connect", SocialConnectSchema);