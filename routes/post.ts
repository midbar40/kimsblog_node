import express from 'express';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  searchPosts
} from '../controllers/postController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 공개 라우트
router.get('/posts', getAllPosts);                    // 모든 게시글 조회
// router.get('/search/:keyword', searchPosts);     // 게시글 검색
router.get('/posts/:id', getPostById);                 // 특정 게시글 조회

// 인증 필요 라우트
router.post('/posts', authMiddleware, createPost);    // 게시글 생성
router.put('/posts/:id', authMiddleware, updatePost);  // 게시글 수정
router.delete('/posts/:id', authMiddleware, deletePost); // 게시글 삭제

export default router;