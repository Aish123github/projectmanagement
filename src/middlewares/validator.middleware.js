import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";


// ill give you a file extract some errors from it and process it
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();// if error is empty then next
    }
    // if  not then extract it and th
    const extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({
        [err.path]: err.msg
    }));
    throw new ApiError(422, "Recieved data is not valid , extractedErrors");
};