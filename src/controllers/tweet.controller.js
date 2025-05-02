import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';

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

        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        const tweets = await Tweet.find({
            owner: userId
        })
            .sort({ createdAt: -1 })
            .populate({
                path: 'owner',
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

const updateTweetById = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params;
        const { content } = req.body;

        if (!tweetId) {
            throw new ApiError(422, "Tweet Id is required.");
        }

        if (!content || !content.trim()) {
            throw new ApiError(422, "Content is reqiured.");
        }

        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(404, "Tweet not found.");
        }

        if (tweet.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "You are not authorized to update this tweet.");
        }

        tweet.content = content.trim();
        await tweet.save();
        const updatedTweet = await Tweet.findById(tweetId)
            .populate({
                path: 'owner',
                select: 'username fullName avatar'
            });

        return res.status(200).json(
            new ApiResponse(200, updatedTweet, "Tweet updated successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const deleteTweetById = asyncHandler(async (req, res) => {

    try {
        const { tweetId } = req.params;

        if (!tweetId) {
            throw new ApiError(422, "TweetId is required.");
        }

        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(404, "Tweet not found.");
        }

        if (tweet.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "You are not authorized to delete this tweet.");
        }

        await tweet.deleteOne();

        return res.status(200).json(
            new ApiResponse(200, null, "Tweet deleted successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

export {
    createTweet,
    getAllTweets,
    updateTweetById,
    deleteTweetById
}