import mongoose from 'mongoose'
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const AuditHistorySchema = new Schema({
    actor_id: { type: ObjectId, refPath: "user" },
    action: { type: String }, // LOGIN, CREATE, UPDATE, DELETE, EARN_BADGE
    details: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  });
  
  
  export const AuditHistoryModel = mongoose.model("audit_history", AuditHistorySchema);