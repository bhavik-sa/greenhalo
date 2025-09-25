import mongoose from 'mongoose'
import { BaseContent } from './BaseContentModel.js'
const Schema = mongoose.Schema

const CheckinChampSchema = new Schema({});
  
export const CheckinChampModel = BaseContent.discriminator("checkin_champ", CheckinChampSchema);