import mongoose, { Schema } from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
const projectMemberSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, user: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    }, role:{
        type: String,
        enum: AvailableUserRole,
        default:UserRolesEnum.MEMBER
    }

}, {
    timestamps: true
})


export const Project = mongoose.model("ProjectMember" , 
    projectMemberSchema,
);