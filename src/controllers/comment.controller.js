import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js"; // Added Video import
import mongoose from "mongoose";

const addComment = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const { content } = req.body;

        if (!videoId) {
            throw new ApiError(422, "Video Id is required.");
        }

        if (!content || !content.trim()) {
            throw new ApiError(422, "Content is required.");
        }

        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Unauthorized access.");
        }

        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found.");
        }

        const newComment = await Comment.create({
            content,
            video: videoId,
            owner: userId
        });

        const populatedComment = await Comment.findById(newComment._id) // Fixed to use newComment._id
            .populate({
                path: 'owner',
                select: 'username fullName avatar'
            });

        return res.status(200).json(
            new ApiResponse(200, populatedComment, "Comment added successfully") // Removed extra period
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
});

const getCommentsByVideoId = asyncHandler(async (req, res) => {

    try {
        const { videoId } = req.params;

        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 10;

        if (!videoId) {
            throw new ApiError(422, "Video Id is required.");
        }

        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found.");
        }

        const aggregateQuery = Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            {
                $unwind: '$owner'
            },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "owner._id": 1,
                    "owner.username": 1,
                    "owner.fullName": 1,
                    "owner.avatar": 1
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);

        const options = {
            page,
            limit
        };

        const comments = await Comment.aggregatePaginate(aggregateQuery, options);

        if (comments.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No comments found.")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, comments, "Comments retreived successfully.")
        )

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
});

const updateCommentById = asyncHandler(async (req, res) => {

    try {
        const { commentId } = req.params;
        const { content } = req.body;

        if (!commentId) {
            throw new ApiError(422, "Comment Id is required.");
        }

        if (!content || !content.trim()) {
            throw new ApiError(422, "Content is required.");
        }

        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Unauthorized access.");
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(404, "Comment not found.");
        }

        if (comment.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to update this comment.");
        }

        comment.content = content.trim();
        await comment.save();

        const updatedComment = await Comment.findById(commentId)
            .populate({
                path: 'owner',
                select: 'username fullName avatar'
            });

        return res.status(200).json(
            new ApiResponse(200, updatedComment, "Comment updated successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const deleteCommentById = asyncHandler(async (req, res) => {

    try {
        const { commentId } = req.params;

        if (!commentId) {
            throw new ApiError(422, "Comment Id is required.");
        }

        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Unauthorized access.");
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(404, "Comment not found.");
        }

        if (comment.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to delete this comment.");
        }

        await comment.deleteOne();

        return res.status(200).json(
            new ApiResponse(200, null, "Comment deleted successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

export {
    addComment,
    getCommentsByVideoId,
    updateCommentById,
    deleteCommentById
}