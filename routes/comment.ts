import express from "express";
import {
  getCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
} from "../controllers/commentController";

const router = express.Router();

// 특정 게시글의 댓글 조회
router.get("/posts/:postId/comments", getCommentsByPost);

// 댓글 생성
router.post("/posts/:id/comments", createComment);

// 댓글 수정
router.put("/comments/:commentId", updateComment);

// 댓글 삭제
router.delete("/comments/:commentId", deleteComment);

export default router;
