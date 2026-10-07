import { Router } from "express";
import { login, registeredUser, logoutUser, verifyEmail, refreshAccessToken, forgotpasswordRequest, resetForgotPassword, getCurrentUser, changeCurrentPassword, resendEmailVerification } from "../controllers/auth.controller.js";
//import { userRegistrationValidator } from "../controllers/auth.controller.js";
//  no one is reading my middleware and validators so now we will do 
import { validate } from "../middlewares/validator.middleware.js";
import { userRegistrationValidator, userLoginValidator, userForgotPasswordValidator, userResetForgotPasswordValidator, userChangeCurrentPasswordValidator } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


//Unsecured routes
const router = Router();
// we need to intercept between the  A and B
router.route("/register").post(userRegistrationValidator(), validate, registeredUser); // CORRECTED: registerdUser → registeredUser
// here validate is the pure middle ware ek se dure interception pe iske through jaega
router.route("/login").post(userLoginValidator(), validate, login);


router
    .route("/verify-email/:verificationToken")
    .get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotpasswordRequest);
router.route("/reset-password/:resetToken").post(userResetForgotPasswordValidator(),validate, resetForgotPassword);




// secrured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/change-password")
.post(verifyJWT, userChangeCurrentPasswordValidator() , validate, changeCurrentPassword);
router.route("/resend-email-verification").post(verifyJWT, resendEmailVerification);



export default router;

// whenever you create a new controller u come here and write a new route












// import {Router} from "express";
// import { registeredUser} from "../controllers/auth.controller.js";
// const router = Router();

// router.route("/register").post(registerdUser);

// export default router;

// // whenever you create a new controller u come her and write a new route