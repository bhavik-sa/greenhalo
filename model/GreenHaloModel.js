import mongoose from 'mongoose'
import { BaseContent } from './BaseContentModel.js'
const Schema = mongoose.Schema

const GreenHaloSchema = new Schema({});
  
export const GreenHaloModel = BaseContent.discriminator("green_halo", GreenHaloSchema);