import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
// import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js"

const toggleSubscription = asyncHandler(async (req, res) => {

    try {
        const { channelId } = req.params;

        if (!channelId) {
            throw new ApiError(404, "Channel Id is required.");
        }

        const subscriberId = req.user?._id;

        if (subscriberId === channelId) {
            throw new ApiError(404, "You cannot subscribe your own channel.")
        }

        const existingSubscription = await Subscription.findOne({
            subscriber: subscriberId,
            channel: channelId
        });

        let message;

        if (existingSubscription) {
            await existingSubscription.deleteOne();
            message = "Channel unsubscribed successfully.";
        } else {
            await Subscription.create({
                subscriber: subscriberId,
                channel: channelId
            });
            message = "Channel subscribed successfully.";
        }

        return res.status(200).json(
            new ApiResponse(200, null, message)
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    try {
        const channelId = req.user?._id;

        const channel = await User.findById(channelId);

        if (!channel) {
            throw new ApiError(404, "Channel not found.");
        }

        const subscribersList = await Subscription.find({
            channel: channelId,
        })
            .populate({
                path: 'subscriber',
                select: 'username fullName avatar'
            });

        const subscribers =  subscribersList.map(sub => sub.subscriber);

        if (subscribers.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No subscribers found.")
            )
        }

        return res.status(200).json(
            new ApiResponse(200, subscribers, "Subscribers list retrieved successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.")
    }
})

const getSubscribedChannels = asyncHandler(async (req, res) => {

    try {
        const subscriptions = await Subscription.find({
            subscriber: req.user?._id,
        })
            .populate({
                path: 'channel',
                select: 'username fullName avatar '
            });

        const subscribedChannels = subscriptions.map(sub => sub.channel);

        if (subscribedChannels.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No subscribed channels found.")
            )
        }

        return res.status(200).json(
            new ApiResponse(200, subscribedChannels, "Subscribed channels retrieved successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}