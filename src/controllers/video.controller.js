import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js"

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        //getting the data from body
        const { title, description } = req.body;

        //Validating the fields
        if ([title, description].some((field) => !field || field.trim() === "")) {
            throw new ApiError(422, "Title and description are required.")
        }

        //check if the video & thumbnail are provided
        const videoLocalPath = req.files?.videoFile?.[0].path;
        const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

        if (!videoLocalPath || !thumbnailLocalPath) {
            throw new ApiError(422, "Both video file & thumbnail are required.")
        }

        //uplaoding the files to cloudinary
        const uploadVideo = await uploadOnCloudinary(videoLocalPath);
        const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!uploadVideo?.url) {
            throw new ApiError(500, "Video upload failed.")
        }

        if (!uploadThumbnail?.url) {
            throw new ApiError(500, "Thumbnai upload failed.")
        }

        //Extract the duration of video file from cloudinary.
        const videoDurationInSeconds = uploadVideo?.duration;

        if (!videoDurationInSeconds) {
            throw new ApiError(500, "Failed to exract video duration.")
        }

        //Preparing video data object
        const videoData = {
            videoFile: uploadVideo.url,
            thumbnail: uploadThumbnail.url,
            title,
            description,
            duration: videoDurationInSeconds,
            owner: req.user?._id
        }

        //Save data to DB
        const newVideo = await Video.create(videoData);

        if (!newVideo) {
            throw new ApiError(500, "Something went wrong while publishing video.")
        }

        return res.status(201).json(
            new ApiResponse(201, newVideo, "Video published successfully.")
        );

    } catch (error) {
        console.error("Error message: ", error.message);
        throw new ApiError(500, error.message, "Internal server error.")
    }
})


const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber <= 0 || limitNumber <= 0) {
            throw new ApiError(422, "Page number and limit number is required.")
        }


        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(422, "Invalid userId provided.");
        }

        const filter = {};

        if (query) {
            filter.title = { $regex: query, $options: "i" };
        }

        filter.owner = userId || req.user?._id;

        const sortOptions = {};

        const sortTypeLower = (sortType || "").toLowerCase();
        const validSortTypes = ["asc", "desc"];

        if (!validSortTypes.includes(sortTypeLower)) {
            throw new ApiError(422, "Invalid sort type, Use 'asc' || 'desc' ")
        }

        sortOptions[sortBy] = sortType.toLowerCase() === 'asc' ? 1 : -1;

        const videos = await Video.find(filter)
            .sort(sortOptions)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .populate("owner", "username fullName");

        const totalVideos = await Video.countDocuments(videos);

        if (!videos.length) {
            return res.status(200)
                .json(
                    new ApiResponse(200, [], "No videos found.")
                )
        }

        return res.status(200)
            .json(
                new ApiResponse(200, {
                    videos,
                    pagination: {
                        total: totalVideos,
                        page: pageNumber,
                        limit: limitNumber,
                        totalPages: Math.ceil(totalVideos / limitNumber)
                    }
                }, "Video retrieved successfully.")
            )


    } catch (error) {
        console.error("Error:", error.message);
        throw new ApiError(500, error.message, "Internal server error.")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { id } = req?.params;


        if (!id) {
            throw new ApiError(422, "Video id is required.")
        }

        const video = await Video.findById(id)
            .populate("owner", "username fullName")
            .lean();

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        return res.status(200)
            .json(
                new ApiResponse(200, video, "Video retrieved successfully.")
            )

    } catch (error) {
        console.error("Error: ", error.message);
        throw new Error(500, "Internal server error.")
    }
})

const updateVideoById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const { title, description } = req.body;

        if (!(title || description)) {
            throw new ApiError(400, "At least one field (title, description) must be provided.");
        }

        const thumbnailLocalPath = req.file?.path;

        if (!id) {
            throw new ApiError(422, "Video id is required.");
        }

        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(404, "Video not found.");
        }

        if (video.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "you are not the authorized person to update this video.");
        }

        const updatedFields = {};

        if (title) updatedFields.title = title.trim();
        if (description) updatedFields.description = description.trim();

        if (thumbnailLocalPath) {
            const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
            if (!uploadThumbnail?.url) {
                throw new ApiError(500, "Thumbnail upload failed.")
            }
            updatedFields.thumbnail = uploadThumbnail.url;
        }
        const updatedVideo = await Video.findByIdAndUpdate(
            id,
            { $set: updatedFields },
            { new: true }
        ).populate({
            path: "owner",
            select: "username fullName"
        });

        return res.status(200).json(
            new ApiResponse(200, updatedVideo, "Updated video successfully")
        )

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.")
    }
})

export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideoById
}