// =====================
// 1. Admin / Authentication
// =====================
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    profile_url: String,
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    subscription: { type: String, enum: ["free", "paid"], default: "free" },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Badge" }],
    refered_by: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    role: { type: String, enum: ["super_admin", "content_manager", "support"], required: true },
    mfa: {
        enabled: { type: Boolean, default: false },
        method: { type: String, enum: ["email", "phone", "authenticator"] },
        secret: String
    },
}, { timestamps: true });


const ReportSchema = new mongoose.Schema({
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: String,
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "resolved", "blocked", "warned"], default: "pending" },
    actionTakenBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
}, { timestamps: true });





// =====================
// 5. Compass (Assessments)
// =====================
const greenhaloSchema = new mongoose.Schema({
    title: String,
    icon_url: String,
    html_content: String,
    status: boolean
}, { timestamps: true });


const halodSchema = new mongoose.Schema({
    title: String,
    icon_url: String,
    html_content: String,
    status: boolean
}, { timestamps: true });

const saferDatingSchema = new mongoose.Schema({
    title: String,
    icon_url: String,
    html_content: String,
    status: boolean
}, { timestamps: true });

const saferdatingMediaDetailsSchema = new mongoose.Schema({
    saferDatingId: { type: mongoose.Schema.Types.ObjectId, ref: "saferDating" },
    type: { type: String, enum: ["video", "article", "webinar", "interview"] },
    url: String,
    status: boolean
}, { timestamps: true });


const quizQuestionSchema = new mongoose.Schema({
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: "targetModel" },
    targetModel: { 
      type: String, 
      enum: ["halospace", "greenhalo", "halod", "saferDating"],
      required: true
    },
    question: String,
    options: [String],
    answer: String,
}, { timestamps: true });


const socialConnectSchema = new mongoose.Schema({
    title: String,
    icon_url: String,
    html_content: String,
    status: boolean
}, { timestamps: true });

const greenflaggedSchema = new mongoose.Schema({
    title: String,
    icon_url: String,
    html_content: String,
    status: boolean
}, { timestamps: true });


const checkinChampSchema = new mongoose.Schema({
    title: String,
    icon_url: String,
    html_content: String,
    status: boolean
}, { timestamps: true });


const CompassResultSchema = new mongoose.Schema({
    compassId: { type: mongoose.Schema.Types.ObjectId, ref: "Compass" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    answers: [String],
    score: Number,
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });




// =====================
// 7. CMS Pages
// =====================
const CMSPageSchema = new mongoose.Schema({
    pageName: { type: String, required: true },
    content: String, // Rich text / HTML
    status: { type: String, enum: ["draft", "published", "unpublished"], default: "draft" },
}, { timestamps: true });


// =====================
// 8. Contact Us (User Queries)
// =====================
const ContactSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subject: String,
    message: String,
    admin_response: String,
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
}, { timestamps: true });



const mongoose = require("mongoose");

const AuditHistorySchema = new mongoose.Schema({
    actorId: { type: mongoose.Schema.Types.ObjectId, refPath: "user" },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: "targetModel" },
    targetModel: { 
      type: String, 
      enum: ["CMSPage", "Badge", "Halospace", "Compass", "Innerhalo", "Contact"],
      required: true
    },
  
    action: { type: String, required: true }, // LOGIN, CREATE, UPDATE, DELETE, EARN_BADGE
    details: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  });
  
  
  module.exports = mongoose.model("AuditHistory", AuditHistorySchema);


