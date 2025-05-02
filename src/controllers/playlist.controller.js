import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req, res) => {

    try {
        const { name, descirption } = req.body;

        if ([name, descirption].some((field) => !field?.trim() === "")) {
            throw new ApiError(422, "Name and description are required.");
        }

        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Unauthorized access.");
        }

        const newPlaylist = await Playlist.create({
            name: name.trim(),
            description: descirption.trim(),
            owner: userId
        });

        const populatedPlaylist = await Playlist.findById(newPlaylist._id)
            .populate({
                path: 'owner',
                select: 'username fullName avatar'
            });

        return res.status(200).json(
            new ApiResponse(200, populatedPlaylist, "Playlist created successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {

    try {
        const { userId } = req.params;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(422, "User Id is required.")
        }

        const user = await User.findById(userId);

        if (!userId) {
            throw new ApiError(404, "User not found.");
        }

        const playlists = await Playlist.find({
            owner: userId
        })
            .populate({
                path: 'videos',
                select: 'title description duration createdAt'
            })
            .populate({
                path: 'owner',
                select: 'username fullName avatar'
            })
            .sort({
                createdAt: -1
            })

        if (playlists.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, {}, "No playlists found.")
            )
        }

        return res.status(200).json(
            new ApiResponse(200, playlists, "Playlists retrieved successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {

    try {
        const { playlistId } = req.params;

        if (!playlistId || mongoose.Types.ObjectId.isValid(playlistId)) {
            throw new ApiError(422, "Playlist Id is required.")
        }

        const playlist = await Playlist.findById(playlistId)
            .populate({
                path: 'videos',
                select: 'title description duration createdAt'
            })
            .populate({
                path: 'owner',
                select: 'username fullName avatar'
            })

        if (!playlist) {
            throw new ApiError(404, "Playlist not found")
        }

        return res.status(200).json(
            new ApiResponse(200, playlist, "Playlist retrieved successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const updatePlaylistById = asyncHandler(async (req, res) => {

    try {
        const { playlistId } = req.params;
        const { name, description } = req.body;

        if (!playlist || !mongoose.Types.ObjectId.isValid(playlistId)) {
            throw new ApiError(422, "Playlist Id is required.")
        }

        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found.");
        }

        if (playlist.owner?._id.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "You are no the authorized person to update this playlist.")
        }

        if (name && name.trim()) playlist.name = name.trim();
        if (description && description.trim()) playlist.description = description.trim();

        await playlist.save();

        const updatedPlaylist = await Playlist.findById(playlistId)
            .populate({
                path: 'videos',
                select: 'title description duration createdAt'
            })
            .populate({
                path: 'owner',
                select: 'fullName username avatar'
            });

        return res.status(200).json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const deletePlaylistById = asyncHandler(async (req, res) => {

    try {
        const { playlistId } = req.params;

        if (!playlistId && !mongoose.Types.ObjectId.isValid(playlistId)) {
            throw new ApiError(422, "Playlist is required.");
        }

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "playlist not found.");
        }

        if (playlist.owner?._id.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "You are not authorized to delete this playlist.");
        }

        await playlist.deleteOne();

        return res.status(200).json(
            new ApiResponse(200, {}, "Playlist deleted successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {

    try {
        const { videoId, playlistId } = req.params;

        if (!videoId || !mongoose.Types.ObjectId.isvalid(videoId)) {
            throw new ApiError(422, "Video Id is required.");
        }

        if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
            throw new ApiError(422, "Playlist Id is required.");
        }

        const userId = req.user?._id;

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found.")
        }

        if (playlist.owner?._id.toString() !== userId.toStirn()) {
            throw new ApiError(403, "You are not authorized to modify this playlist.")
        }

        if (playlist.videos.includes(videoId)) {
            throw new ApiError(409, "Video already exists in the playlist.")
        }

        playlist.videos.push(videoId);
        await playlist.save();

        return res.status(200).json(
            new ApiResponse(200, playlist, "Video added to playlist successfully.")
        );

    } catch (error) {
        console.error("Error: ", error.message);
        throw new ApiError(500, "Internal server error.")
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylistById,
    deletePlaylistById,
    addVideoToPlaylist
}