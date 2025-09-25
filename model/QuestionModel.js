import mongoose from 'mongoose'
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const QuestionSchema = new Schema({
    target_id: { type: ObjectId, refPath: "target_model" },
    target_model: { 
      type: String, 
      enum: ["green_halo", "halod", "safer_dating"],
    },
    question: {type: String,},
    options: [{type: String, }],
    answer: {type: String, },
}, { timestamps: true });

export const QuestionModel = mongoose.model('question', QuestionSchema);
