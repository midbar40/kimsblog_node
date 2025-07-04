import express from "express";
import {
  getCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
  getCommentById,
} from "../controllers/commentController";

const router = express.Router();

// 개별 댓글 조회
router.get("/:commentId", getCommentById);

// 댓글 수정
router.put("/:commentId", updateComment);

// 댓글 삭제
router.delete("/:commentId", deleteComment);

export default router;
