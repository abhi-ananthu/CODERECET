import mongoose from 'mongoose';
import 'dotenv/config';
import bcrypt from 'bcrypt'// Make sure this is present to load your .env file

// --- All Schema Definitions ---

// --- 1. Organization Schema ---
// Based on your structure: { String Name, String context, String score, String Array chapters, String score }
// 'score' is included as a String. If you intended two distinct score fields, please specify their names.
export const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    context: {
        type: String,
        required: true,
        trim: true
    },
    score: {
        type: String,
        default: 'N/A'
    },
    chapters: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});




export const complaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    mediaLink: {
        type: String,
        default: null
    },
    assignto: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true,
    },
    brief: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
});

organizationSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 🔍 Compare password
organizationSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export const Complaint = mongoose.model('complaints', complaintSchema);

export const Organization = mongoose.model('organizations', organizationSchema);

