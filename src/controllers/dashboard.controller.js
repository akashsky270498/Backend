import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const getChannelStastistics = asyncHandler(async (req, res) => {

    try {
        const userId = req.user?._id;

        const channel = await User.findById(userId);

        if (!channel) {
            throw new ApiError(404, "Channel not found.");
        }

        const videos = await Video.find({ owner: userId });

        const totalVideos = videos.length;
        const totalViews = videos.reduce((acc, video) => acc + (video.view || 0), 0);

        const totalSubscribers = await Subscription.countDocuments({ channel: userId });

        const videoIds = videos.map(video => video._id);
        const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

        const statistics = {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        }

        return res.status(200).json(
            new ApiResponse(200, statistics, "Channel statistics retrieved successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error");
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {

    try {
        const userId = req.user?._id;

        const { page = 1, limit = 10 } = req.query;

        const videos = await Video.find({ owner: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate({
                path: 'owner',
                select: 'username fullName avatar'
            });

        const total = await Video.countDocuments({ owner: userId });

        return res.status(200).json(
            new ApiResponse(200, {
                videos,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPage: Math.ceil(total / limit)
                }

            })
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

export {
    getChannelStastistics,
    getChannelVideos
}