import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelStastistics, getChannelVideos } from "../controllers/dashboard.controller.js";

const router = Router();

router.route('/get-channel-stats').get(verifyJWT, getChannelStastistics);
router.route('/get-channel-videos').get(verifyJWT, getChannelVideos)

export default router;