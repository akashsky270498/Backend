import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweetById, getAllTweets, updateTweetById } from "../controllers/tweet.controller.js";

const router = Router();

router.route('/create-tweet').post(verifyJWT, createTweet);
router.route('/get-tweets/:userId').get(verifyJWT, getAllTweets);
router.route('/update-tweet/:tweetId').patch(verifyJWT, updateTweetById);
router.route('/delete-tweet/:tweetId').delete(verifyJWT, deleteTweetById);

export default router;