import { asyncHandler } from 'express-async-handler.js';
import { ApiError } from '../utils/apiError.js';
import { Like } from '../models/like.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Video } from '../models/video.model.js';
import { Comment } from '../models/comment.model.js';
import { Tweet } from '../models/tweet.model.js';
import mongoose from 'mongoose';

const toggleVideoLike = asyncHandler(async (req, res) => {

    try {
        const { videoId } = req.params;

        if (!videoId || mongoose.Types.ObjectId.isValid(videoId)) {
            throw new APiError(422, "Video Id is required.");
        }

        const userId = req.user?._id;

        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found.");
        }

        const existingLike = await Like.findOne({
            video: videoId,
            likedBy: userId
        });

        let message;

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            message = "Video disliked successfully."
        } else {
            await Like.create({
                video: videoId,
                likedBy: userId
            })
            message = "Video liked successfully."
        }

        return res.status(200).json(
            new ApiResponse(200, null, message)
        );

    } catch (error) {
        console.error('Error: ', error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {

    try {
        const { commentId } = req.params;

        if (!commentId || !mongoose.Types.ObjectId(commentId)) {
            throw new ApiError(422, "Comment Id is required.");
        }

        const userId = req.user?._id;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(404, "Comment not found.");
        }

        const existingLike = await Like.findOne({
            comment: commentId,
            likedBy: userId
        });

        let message;

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            message = "Comment disliked successfully."
        } else {
            await Like.create({
                comment: commentId,
                likedBy: userId
            })
            message = "Comment liked successfully."
        }
        return res.status(200).json(
            new ApiResponse(200, null, message)
        );
    } catch (error) {
        console.error('Error: ', error.message);
        throw new ApiError(500, "Internal server error.");

    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params;

        if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
            throw new ApiError(422, "TweetId is required.");
        }

        const userId = req.user?._id;

        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(404, "Tweet not found.");
        }

        const existingLike = await Like.findOne({
            tweet: tweetId,
            likedBy: userId
        })

        let message;

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            message = "Tweet disliked successfully.";
        } else {
            await Like.create({
                tweet: tweetId,
                likedBy: userId
            });
            message = "Tweet liked successfully.";
        }

        return res.status(200).json(
            new ApiResponse(200, null, message)
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const getLikedVides = asyncHandler(async (req, res) => {

    try {
        const userId = req.user?._id;

        const likedVideos = await Like.find({
            likedBy: userId,
            video: {
                $ne: null
            }
        })
            .populate({
                path: 'video',
                select: 'title description thumbnail createdAt videoFile duration views',
                populate: {
                    path: 'owner',
                    select: 'username fullName avatar'
                }
            })
            .sort({ createdAt: -1 })

        const videos = likedVideos
            .map((like) => like.video)
            .filter((video) => video !== null);

        return res.status(200).json(
            new ApiResponse(200, videos, "Liked videos fetched successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVides
}