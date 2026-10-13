import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatues, TaskStatusEnum } from "../utils/constants.js";


const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: Stirng,
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    status:{
        type: Stirng,
        enum:AvailableTaskStatues,
        default: TaskStatusEnum.TODO
    },
    attachments:{
        type: [{
            url:String,
            minetype:String,
            size:Number
        }],
        defaults:[]
    },
}
    ,{ timestamps: true }
);

export const Task=mongoose.model("Task" , taskSchema);