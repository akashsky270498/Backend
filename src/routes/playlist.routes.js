import Router from "express";
import VerifyJWT from "../middleware/verifyJWT.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylistById, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylistById } from "../controllers/playlist.controller.js";

const router = Router();

router.route('/create-playlist').post(VerifyJWT, createPlaylist)
router.route('/get-all-playlist/:userId').post(VerifyJWT, getUserPlaylists)
router.route('/get-playlist-by-id/:playlistId').post(VerifyJWT, getPlaylistById)
router.route('/update-playlist/:playlistId').post(VerifyJWT, updatePlaylistById)
router.route('/delete-playlist/:playlistId').post(VerifyJWT, deletePlaylistById)
router.route('/add-video-to-playlist/:videoId/:playlistId').post(VerifyJWT, addVideoToPlaylist)
router.route('/remove-video-from-playlist/:videoId/:playlistId').post(VerifyJWT, removeVideoFromPlaylist)

export default router;