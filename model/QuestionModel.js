import mongoose from 'mongoose'
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const QuestionSchema = new Schema({
    badge_id: { type: ObjectId, ref: "badge" },
    question: {type: String,},
    options: [{type: String, }],
    answer: {type: String, },
}, { timestamps: true });

export const QuestionModel = mongoose.model('question', QuestionSchema);
