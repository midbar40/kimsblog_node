// routes/quizRoutes.ts
import { Router } from "express";
import * as quizController from "../controllers/quizController";
import { authenticateToken } from "../middleware/auth"; // 인증 미들웨어 (별도 구현 필요)

const router = Router();

// 공개 라우트 (인증 불필요)
router.get("/categories", quizController.getCategories);
router.get("/random", quizController.getRandomQuiz);
router.get("/popular", quizController.getPopularQuizzes);
router.get("/latest", quizController.getLatestQuizzes);
router.get("/by-category", quizController.getQuizzesByCategory);
router.get("/:id/play", quizController.getQuizForPlay);
router.get("/:id/statistics", quizController.getQuizStatistics);
router.get("/", quizController.getQuizzes);

// 인증 필요한 라우트
router.use(authenticateToken as any); // 이 아래 모든 라우트는 인증 필요

router.post("/", quizController.createQuiz);
router.post("/submit", quizController.submitAnswer);
router.get("/my-quizzes", quizController.getMyQuizzes);
router.get("/my-results", quizController.getMyResults);
router.get("/unsolved", quizController.getUnsolvedQuizzes);
router.get("/:id", quizController.getQuizDetail);
router.put("/:id", quizController.updateQuiz);
router.delete("/:id", quizController.deleteQuiz);

export default router;
