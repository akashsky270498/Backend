import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylistById, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylistById } from "../controllers/playlist.controller.js";

const router = Router();

router.route('/create-playlist').post(verifyJWT, createPlaylist)
router.route('/get-all-playlist/:userId').get(verifyJWT, getUserPlaylists)
router.route('/get-playlist-by-id/:playlistId').get(verifyJWT, getPlaylistById)
router.route('/update-playlist/:playlistId').patch(verifyJWT, updatePlaylistById)
router.route('/delete-playlist/:playlistId').delete(verifyJWT, deletePlaylistById)
router.route('/add-video-to-playlist/:videoId/:playlistId').post(verifyJWT, addVideoToPlaylist)
router.route('/remove-video-from-playlist/:videoId/:playlistId').post(verifyJWT, removeVideoFromPlaylist)

export default router;