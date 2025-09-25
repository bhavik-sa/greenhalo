import mongoose from 'mongoose'
import { BaseContent } from './BaseContentModel.js'
const Schema = mongoose.Schema

const HalodSchema = new Schema({});
  
export const HalodModel = BaseContent.discriminator("halod", HalodSchema);