import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { projectMember } from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
import { pipeline } from "nodemailer/lib/xoauth2/index.js";


const getProjects = asyncHandler(async (req, res) => {
    const projects = await projectMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id)
            },
        },
        {
            $lookup: {
                from: "projects",
                localField: "projects",
                foreignField: "._id",
                as: "projects",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmember",
                            localField: "._id",
                            foreignField: "project",
                            as: "projectmembers"
                        }
                    },
                    {
                        $addFields: {
                            members: {
                                $size: "$projectmembers",
                            },
                        },
                    }
                ]
            }
        },
        {
            $unwind: "$projects"
        },
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1,
                },
                role: 1,
                _id: 0,
            }
        }
    ])
    return res.status(200)
        .json(new ApiResponse(200, projects, "projects fetched sccessfully"))

});
const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const project = await Project.findById(projectId)
    if (!project) {
        throw new ApiError(404, "project not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, project, " project fetched successfully"),
        )
});
const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });
    // who ever is creating a project is the admin if the project
    await projectMember.create(
        {
            user: new mongoose.Types.ObjectId(req.user._id),
            project: new mongoose.Types.ObjectId(project.id),
            role: UserRolesEnum.ADMIN
        }
    )
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                project,
                "project created successfully"
            )
        )

});
const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const { projectId } = req.params
    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description
        },
        { new: true }
    )
    if (!project) {
        throw new ApiError(404, "project not found")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                project,
                "project updated successfully"
            )
        )

});
const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const project = await Project.findByIdAndDelete(projectId)
    if (!project) {
        throw new ApiError(404, "project not found")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                project,
                "project deleted successfully"
            )
        )

});
const addMembersToProject = asyncHandler(async (req, res) => {
    const { email, role } = req.body
    const { projectId } = req.params
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, " User does not exist")
    }
    await projectMember.findByIdAndUpdate(
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId)
        },
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role: role
        },
        {
            new: true, // this gonna return the updated document 
            upsert: true // this gonana create one if nothing 
        }
    );
    return res
        .status(201)
        .json(new ApiResponse(200, {}, "project member added successfully"));
});
const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const project = await Project.findById(req.params)

    if (!project) {
        throw new ApiError(404, "project not found");
    }
    const projectmembers = await projectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId)
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                user: {
                    $arrayElemAt: ["$user", 0]
                }
            }
        },
        {
            $project: {
                project: 1,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
                _id: 0,
            }
        }

    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, projectmembers, "project member fetched"));

});
const updateMemberRole = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params
    const { newRole } = req.body
    if (!AvailableUserRole.includes(newRole)) {
        throw new ApiError(400, "Invalid Role")
    }
    let projectMember = await projectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })
    if (!projectMember) {
        throw new ApiError(400, "project member not found");
    }
    projectMember = await projectMember.findByIdAndUpdate(
        projectMember._id,
        {
            role: newRole
        },
        { new: true },
    )
    if (!projectMember) {
        throw new ApiError(400, "project member not found");
    }
    return res 
    .status(200)
    .json(new ApiResponse (200, projectmembers,"project member  role updated successfully"));
});
const deleteMember = asyncHandler(async (req, res) => {
const { projectId, userId } = req.params
    let projectMember = await projectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })
    if (!projectMember) {
        throw new ApiError(400, "project member not found");
    }
    projectMember = await projectMember.findByIdAndDelete(
        projectMember._id,
    )
    if (!projectMember) {
        throw new ApiError(400, "project member not found");
    }
    return res 
    .status(200)
    .json(new ApiResponse (200, projectmembers,"project member  deleted successfully"));
});
export {
    addMembersToProject,
    createProject,
    updateProject,
    deleteMember,
    updateMemberRole,
    getProjectById,
    getProjects,
    getProjectMembers,
    deleteProject,
}