import mongoose from 'mongoose'
import { BaseContent } from './BaseContentModel.js'
const Schema = mongoose.Schema

const GreenFlaggedSchema = new Schema({});
  
export const GreenFlaggedModel = BaseContent.discriminator("green_flagged", GreenFlaggedSchema);