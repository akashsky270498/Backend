import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tweet } from '../models/tweet.model.js';

const createTweet = asyncHandler(async (req, res) => {

    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            throw new ApiError(422, "Content is required.");
        }

        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Unauthorized access.");
        }

        const newTweet = await Tweet.create({
            content,
            owner: userId
        });

        const populatedTweet = await Tweet.findById(newTweet._id)
            .populate({
                path: 'owner',
                select: 'username fullName avatar'
            });

        return res.status(200).json(
            new ApiResponse(200, populatedTweet, "Tweet created successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error");
    }
})

const getAllTweets = asyncHandler(async (req, res) => {

    try {
        const { userId } = req.params;

        if (!userId) {
            throw new ApiError(422, "User Id is required.");
        }

        const user = await UserActivation.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        const tweets = await Tweet.find({
            owner: userId
        })
            .sort({ createdAt: -1 })
            .populate({
                path: owner,
                select: 'username fullName avatar'
            });

        return res.status(200).json(
            new ApiResponse(200, tweets, "Tweets retrieved successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

export {
    createTweet,
    getAllTweets
}