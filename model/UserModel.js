import mongoose from 'mongoose'
import constant from '../utilities/constant.js'
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const userSchema = new Schema(
  {
    username: { type: String },
    profile_url: { type: String },
    email: { type: String, unique: true },
    password_hash: { type: String },
    status: { type: String, enum: constant.USER_STATUS, default: constant.USER_STATUS[0] },
    subscription: { type: String, enum: constant.SUBSCRIPTION, default: constant.SUBSCRIPTION[0] },
    badges: [{ type: ObjectId, ref: "badge" }],
    target_model: { 
      type: String, 
      enum: ["green_halo", "halod", "safer_dating"],
    },
    refered_by: [{ type: ObjectId, ref: "users" }],
    role: { type: String, enum: constant.ROLE, required: true },
    reset_token: { type: String },
    reset_token_expiry: { type: Date },
    mfa: {
      enabled: { type: Boolean, default: false },
      method: { type: String, enum: ["email", "phone", "authenticator"] },
      secret: { type: String },
      otp: { type: String },
      otp_expires: { type: Date }
    },
  },
  { timestamps: true }
)

export const UserModel = mongoose.model('user', userSchema)
