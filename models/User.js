import mongoose, { Schema, model } from 'mongoose';

const userSchema = Schema({
    name: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    verified: {
        type: Boolean,
        default: false,
        required: true
    },
    bio: {
        type: String,
        required: false
    },
    password: {
        type: String,
    },
    phoneNumber: {
        type: Number,
    },
    profilePic: {
        type: String,
        required: false
    },
    profilePic_PublicId: {
        type: String,
        required: false
    },
    followings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        }
    ],
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        }
    ],
    profile: {
        type: String
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    authType: {
        type: String,
        required: false
    }
})

export default model("users", userSchema)