// in the postman error comes from a variety of places body, params etc
// we will care for body now 
import { body } from "express-validator";

// working on user registration for now 
const userRegistrationValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()// it shouldnt be empty
            .withMessage("Email is required")// whenever there is a error in the above method this is called
            .isEmail()// to check whether its in formate of email
            .withMessage("Email Invalid"),
        body("username")
            .trim()
            .notEmpty()// it shouldnt be empty
            .withMessage("username is required")// whenever there is a error in the above method this is called
            .isLowercase()
            .withMessage("Username must be in lowercase")
            .isLength({ min: 3 })
            .withMessage("Ussername must be atleast 3 characters long"),
        body("password")
            .trim()
            .notEmpty()// it shouldnt be empty
            .withMessage("password is required"),
        body("fullname")
            .optional()
            .trim()
    ];
};

const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .isEmail()
            .withMessage("Email is invalid!"),
        body("password")
            .notEmpty()
            .withMessage("password is required"),
    ];
}

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword").notEmpty().withMessage("old password is required"),
        body("newPassword").notEmpty().withMessage("new password is required"),
    ]
}
const userForgotPasswordValidator = ()=>{
    return[
        body("email")
        .notEmpty()
        .withMessage("email is required")
        .isEmail()
        .withMessage("email is invalid")
    ];
}
const userResetForgotPasswordValidator =() =>
    {
        return [body("newPassword").notEmpty().withMessage("password is required ")]
    }

export { userRegistrationValidator,
     userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator
 };