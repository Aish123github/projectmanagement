// when we were creating acccess token we were putting some info in the Access token 
// we need to extract out those info and
// and append the req the req so that it has the user info
// intercept the req in the middleware then  access the accesstoken then decode the info and inject the info in the req

import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    console.log("🔥 VERIFY JWT MIDDLEWARE RUNNING");

    console.log("COOKIES:", req.cookies);
    console.log("AUTH HEADER:", req.header("Authorization"));
    const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ", "")
         console.log("TOKEN:", token);
    if (!token) {
        throw new ApiError(401, "Unauthorised request")
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
        );
        if (!user) {
            throw new ApiError(401, "Invalid AccessToken")
        }
        req.user = user
        next()//hop on next midddlewareor controller
    } catch (error) {
      throw new ApiError(401 , " Invalid access token")
    }
})