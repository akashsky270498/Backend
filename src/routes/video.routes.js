import Router from "express";
import { deleteVideoById, getAllVideos, getVideoById, publishAVideo, togglePublishStatusOfVideo, updateVideoById } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/publish").post(verifyJWT,
    upload.fields([
        {
            name: 'videoFile',
            maxCount: 1
        },
        {
            name: 'thumbnail',
            maxCount: 1
        }
    ]),
    publishAVideo
)

router.route("/get-all-videos").get(verifyJWT, getAllVideos)
router.route("/get-video/:id").get(verifyJWT, getVideoById)
router.route("/update-video/:id").patch(verifyJWT, upload.single('thumbnail'), updateVideoById)
router.route("/delete-video/:id").delete(verifyJWT, deleteVideoById);
router.route("/publish/:id").patch(verifyJWT, togglePublishStatusOfVideo);
export default router;