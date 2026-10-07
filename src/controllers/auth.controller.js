import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { forgotPasswordMailgenContent, sendEmail } from "../utils/mail.js";
import { emailVerificationMailgenContent } from "../utils/mail.js";
import jwt from "jsonwebtoken";
//import { verify } from "jsonwebtoken";
import crypto from "crypto";
//import { useReducer } from "react";

const generateAccesssandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        console.log("TOKEN ERROR:", error);
        throw new ApiError(
            500,
            "something went wrong while generating access token ",
        )
    }
}

const registeredUser = asyncHandler(async (req, res) => {
    const { email, username, password, role } = req.body
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists", [])
    }


    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false
    })
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })
    await sendEmail({
        email: user?.email,
        subject: "please verify your email",
        mailgencontent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
        )
    });
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );
    // if (!createdUser) {
    //     throw new ApiError(500, " something went wrong while registering a user")
    // }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { user: createdUser },
                "user registered successfully and verfication email has been sent on your email",
            )
        )
})

const login = asyncHandler(async (req, res) => {
    console.log("1. LOGIN START");
    const { email, password, username } = req.body
    console.log("2. BODY RECEIVED");
    if (!email) {
        throw new ApiError(400, "email  is required")
    }
    const user = await User.findOne({ email });
    console.log("3. USER FOUND");
    if (!user) {
        throw new ApiError(400, "User  doesnt exists")
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid Credetials");
    }
    console.log("4. PASSWORD CHECKED");
    const { accessToken, refreshToken } = await generateAccesssandRefreshToken(user._id)
    console.log("5. TOKENS GENERATED");
    const loggedInUsern = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );
    console.log("6. USER FETCHED");
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUsern,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );

})
// how to log out a user .. we are storing some info in the server itself as refresh token we need to take this way
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: "",
            },
        },
        {
            new: true,

        },
    );
    // db is now clean we need to clear the traces of the db now 
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, " User Logged out successfully")
        )
});
//get current user info
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "current user fected successfully"
            )
        )
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params
    if (!verificationToken) {
        throw new ApiError(400, "Email verification token is missing")
    }
    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() }

    })

    if (!user) {
        throw new ApiError(400, " token is invalid or expired ")
    }
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    isEmailVerified = true
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isEmailVerfied: true },
                "email is verified",
            ))
});
// user was not able to complete the the verfication on time so it want to resend the email

const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "user doesnt exits")
    }
    if (user.isEmailVerified) {
        throw new ApiError(409, " email is already verified")
    }
    // if the email isnt verified
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })
    await sendEmail({
        email: user?.email,
        subject: "please verify your email",
        mailgencontent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
        )
    });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isEmailVerified: true },
                "A mail has been sent to your mail",
            ))
})
// refresh access token when it got expired 
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorised access")
    }
    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, " invalid refresh token")
        }
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired");
        }
        const options = {
            httpOnly: true,
            secure: true
        }

        // update the Db 
        const { accessToken, refreshToken: newRefreshToken } = await
            generateAccesssandRefreshToken(user._id)
        // update new refresh token
        user.refreshToken = newRefreshToken;

        await user.save()
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    " Access token has been refreshed",
                ))

    } catch (error) {
        throw new ApiError(401, " Invalid refresh token");
    }
})

const forgotpasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, " user doesnt exists", [])

    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken
    user.forgotPasswordExpiry = tokenExpiry
    await user.save({ validateBeforeSave: false })
    await sendEmail({
        email: user?.email,
        subject: "Password reset request",
        mailgencontent: forgotPasswordMailgenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
        )
    });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "password reset email has been sent to your mail id",
            ))

})
const resetForgotPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params
    const { newPassword } = req.body
    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")
    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    })
    if (!user) {
        throw new ApiError(489, "token is invalid or expired")
    }
    user.forgotPasswordExpiry = undefined
    user.forgotPasswordToken = undefined
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "password reset successfully"
            )
        )
})
//for someone who is already logged in
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(400, "invalid old Password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave : false})
    return res
    .satus(200)
    .json(
        new ApiResponse(
            200,
            {},
            "password changed successfully"
        )
    )

})
export {
    registeredUser,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail, resendEmailVerification,
    refreshAccessToken,
    forgotpasswordRequest,
    resetForgotPassword,
    changeCurrentPassword
};



































// import { User } from "../models/user.models.js";
// import { ApiResponse } from "../utils/api-response.js";
// import { ApiError } from "../utils/api-error.js";
// import { asyncHandler } from "../utils/async-handler.js";
// import { sendEmail } from "../utils/mail.js";
// import jwt from "jsonwebtoken";
// //import { verify } from "jsonwebtoken";

// const generateAccesssandRefreshToken = async (userId) => {
//     try {
//         const user = await User.findById(userId)
//         const accessToken = user.generateAccessToken();
//         const refreshToken = user.generateRefreshToken();
//         user.refreshToken = refreshToken
//         await user.save({ validateBeforeSave: false })
//         return { accessToken, refreshToken }
//     } catch (error) {
//         throw new ApiError(
//             500,
//             "something went wrong while generating access token ",
//         )
//     }
// }

// const registeredUser = asyncHandler(async (req , res ) => {
//     const { email, username, password, role } = req.body
//     const existedUser = await User.findOne({
//         $or: [{ username }, { email }]
//     })
//     if (existedUser) {
//         throw new ApiError(409, "User with email or username already exists" ,[])
//     }


//     const user =  await User.create({
//         email,
//         password,
//         username,
//         isEmailVerfied: false
//     })
//     const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

//     user.emailVerificationToken = hashedToken
//     user.emailVerificationExpiry = tokenExpiry

//     await user.save({ validateBeforeSave: false })
//     await sendEmail({
//         email: user?.email,
//         subject: "please verify your email",
//         mailgenContent: emailVerificationMailgenContent(
//             user.username,
//             `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
//         )
//     });
//     const createdUser = await User.findById(user._id).select(
//         "-password -refreshToken - emailVerificationToken -emailVerificationExpiry",
//     );
//     if (!createdUser) {
//         throw new ApiError(500, " something went wrong while registering a user")
//     }
//     return res
//         .status(201)
//         .json(
//          new ApiResponse(
//             200,
//             {user: createdUser},
//             "user registered successfully and verfication email has been sent on your email" ,
//          )
//     )
// })

// export { registeredUser} ;