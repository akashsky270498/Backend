import Router from 'express';
import { addComment, deleteCommentById, getCommentsByVideoId, updateCommentById } from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/create-comment/:videoId').post(verifyJWT, addComment);
router.route('/get-comments/:videoId').get(verifyJWT, getCommentsByVideoId);
router.route('/update-comment/:commentId').patch(verifyJWT, updateCommentById);
router.route('/delete-comment/:commentId').delete(verifyJWT, deleteCommentById);
export default router;