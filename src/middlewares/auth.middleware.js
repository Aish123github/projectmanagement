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
});
export const validateProjectPermission = (roles = []) => {
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, "project id is missing");
    }

    const project = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      // assumption : this will always rum after the verify JWT
      user: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!project) {
      throw new ApiError(400, "project not found");
    }

    const givenRole = project?.role;
    // ading extarcted role to the usser
    req.user.role = givenRole;
     // dose the given role matches to the given role
     // if it doesnt matches then u cant perform the given role 
    if (!roles.includes(givenRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );
    }

    next();
  });
};