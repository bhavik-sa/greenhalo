import mongoose from 'mongoose'
import { BaseContent } from './BaseContentModel.js'
const Schema = mongoose.Schema


const SaferDatingSchema = new Schema({});
export const SaferDatingModel = BaseContent.discriminator("safer_dating", SaferDatingSchema);