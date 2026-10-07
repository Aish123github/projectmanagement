import mongoose, { Schema } from "mongoose";
import brcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
    {
        // avatar here is a image here we dont store image directly in database
        // EOD its a url and url is of type string
        avatar: {
            type: {
                url: {
                    type: String,
                    default: "https://placehold.co/200x200"
                },
                localPath: {
                    type: String,
                    default: ""
                }
            }
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            required: [true, "password is required"]
        },
        isEmailVerfied: {
            type: Boolean,
            default: false // no one will be verified by default
        },
        // required for token system e.g jwwt token
        refreshToken: {
            type: String
        },
        forgotPasswordToken: {
            type: String
        },
        forgotPasswordExpiry: {
            type: String
        },
        //user is clicking on the link and its working on the time not 10yr later
        emailVerificationToken: {
            type: String
        },
        emailVerificationExpiry: {
            type: Date
        },
        // 1st obj will contain all the feilds
        // 2nd obj will have things like time stamps 

    },
    {
        timestamps: true,

    },
);
// we write prehooks just by writing a method before exporting this
userSchema.pre("save", async function (next) {
    // if the modified feild isnt the password then it will return nothing
    if (!this.isModified("password")) return;
    // i want to access one feild and encrypt it
    //it takes obj no. of round to encrypt it
    this.password = await brcrypt.hash(this.password, 10);
    ;
});
userSchema.methods.isPasswordCorrect = async function (password) {
    // this will compare the hashed password and the hashed password entered by the user
    return await brcrypt.compare(password, this.password);
};
//acesstoken
//who ever uses a toke  will get back a token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
    },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
},
    //refresh token
    userSchema.methods.generateRefreshToken = function () {
        return jwt.sign({
            _id: this._id,
            email: this.email,
            username: this.username,
        },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
        )
    }
// temporary tokens used for verification
userSchema.methods.generateTemporaryToken = function () {
    //unhashed token
    const unHashedToken = crypto.randomBytes(20).toString("hex") //hex values generate hoti h 
    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex")

    const tokenExpiry = Date.now() + (20 * 20 * 1000) //20mins
    return { unHashedToken, hashedToken, tokenExpiry }
};

export const User = mongoose.model("User ", userSchema);
