import { Router } from "express";
import {
    loginUser, registerUser, logoutUser, refreshAccessToken, changePassword, getUser, updateUser, updateUserAvatar, updateUserCoverImage
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);


//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT,changePassword);
router.route("/get-user").post(verifyJWT,getUser);
router.route("/avatar").post(verifyJWT,updateUserAvatar);
router.route("/cover-image").post(verifyJWT,updateUserCoverImage);

export default router;