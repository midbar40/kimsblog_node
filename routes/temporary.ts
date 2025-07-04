import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getTempPost,
  saveTempPost,
  checkTempPost,
  deleteTempPost,
  checkTempPostEmpty,
  clearTempPost,
  publishTempPost,
} from "../controllers/temporaryController";

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 사용자별 임시저장 글 조회
router.get("/", getTempPost as any);

// 사용자별 임시저장 글 생성/수정
router.post("/", saveTempPost as any);
router.put("/", saveTempPost as any);

// 사용자별 임시저장 글 삭제
router.delete("/", deleteTempPost as any);

// 사용자별 임시저장 글 존재 여부 확인
router.get("/exists", checkTempPost as any);

// 사용자별 임시저장 글 비어있는지 확인
router.get("/empty", checkTempPostEmpty as any);

// 사용자별 임시저장 글 초기화
router.patch("/clear", clearTempPost as any);

// 사용자별 임시저장에서 바로 포스트 발행
router.post("/publish", publishTempPost as any);

export default router;
