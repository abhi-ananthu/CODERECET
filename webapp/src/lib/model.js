import mongoose from 'mongoose';
import 'dotenv/config'; // Make sure this is present to load your .env file

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


export const Organization = mongoose.model('NGOs', organizationSchema);


export const complaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    mediaLink: {
        type: String,
        default: null
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    brief: {
        type: String,
        required: true,
        trim: true,
        minlength: 10
    }
}, {
    timestamps: true
});

export const Complaint = mongoose.model('Complaint', complaintSchema);


