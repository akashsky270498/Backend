import Router from 'express';
import { createComment, deleteCommentById, getAllComments, updateCommentById } from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/create-comment').post(verifyJWT, createComment);
router.route('/get-comments/:videoId').get(verifyJWT, getAllComments);
router.route('/update-comment/:commentId').patch(verifyJWT, updateCommentById);
router.route('/delete-comment/:commentId').delete(verifyJWT, deleteCommentById);
export default router;