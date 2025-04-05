import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
            index: true, // To enable searching of a particular field
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,   // To enable searching of a particular field
        },

        avatar: {
            type: String,
            required: true, //Couldinary url
        },

        coverImage: {
            type: String,
        },

        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            }
        ],

        password: {
            type: String,
            required: [true, "Password is required"],
        },

        refreshToken: {
            type: String,
        }
    },

    {
        timestamps: true,
    }
)

//don't use arrow function here bcoz this will not work as "this" keyword current context problem.
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})


//checking the password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

//generating access token
userSchema.methods.generateAccessToken = async function () {
    return await jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullName: this.fullName,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        },
    )
}

//generating refresh token
userSchema.methods.generateRefreshToken = async function () {
    return await jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_SECRET,
        }
    )
}

export const User = mongoose.model("User", userSchema);