import mongoose from 'mongoose'
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const AuditHistorySchema = new Schema({
    actor_id: { type: ObjectId, refPath: "user" },
    target_id: { type: ObjectId, refPath: "target_model" },
    target_model: { 
      type: String, 
      enum: ["cms_page", "badge", "halospace", "compass", "innerhalo", "contact"],
    },
    action: { type: String }, // LOGIN, CREATE, UPDATE, DELETE, EARN_BADGE
    details: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  });
  
  
  export const AuditHistoryModel = mongoose.model("audit_history", AuditHistorySchema);