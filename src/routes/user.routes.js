import { Router } from "express";
import {
    loginUser, registerUser, logoutUser, refreshAccessToken, changePassword, getUser, updateUser, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory
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
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/get-user").get(verifyJWT, getUser);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/update-user").patch(verifyJWT, updateUser);
router.route("/get-user-channel-profile/:username").get(verifyJWT, getUserChannelProfile);
router.route("/get-user-watch-history").get(verifyJWT, getWatchHistory);

export default router;