import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {

    try {
        const { channelId } = req.params;

        if (!channelId) {
            throw new ApiError(404, "Channel Id is required.");
        }

        const subscriberId = req.user?._id;

        if (subscriberId.toSring() === channelId) {
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

export {
    toggleSubscription
}