import { Request, Response } from "express";
import { Difficulty } from "../types/enum";
import * as quizService from "../services/quizService";

// ✅ 올바른 타입 정의 - RequestHandler 스타일
export const createQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { question, answer, timeLimit, category, difficulty } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "인증이 필요합니다" });
      return; // Promise<void> 반환
    }

    if (!question || !answer || !timeLimit || !category || !difficulty) {
      res.status(400).json({ error: "모든 필드를 입력해주세요" });
      return;
    }

    if (!Object.values(Difficulty).includes(difficulty)) {
      res.status(400).json({ error: "유효하지 않은 난이도입니다" });
      return;
    }

    const quiz = await quizService.createQuiz(
      {
        question,
        answer,
        timeLimit: parseInt(timeLimit),
        category,
        difficulty,
      },
      userId
    );

    res.status(201).json({
      message: "퀴즈가 성공적으로 생성되었습니다",
      quiz,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const submitAnswer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { quizId, userAnswer, timeTaken } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "인증이 필요합니다" });
      return;
    }

    if (!quizId || !userAnswer || timeTaken === undefined) {
      res.status(400).json({ error: "필수 필드가 누락되었습니다" });
      return;
    }

    const result = await quizService.submitAnswer(
      {
        quizId,
        userAnswer,
        timeTaken: parseInt(timeTaken),
      },
      userId
    );

    res.json({
      result,
      message: result.isCorrect ? "정답입니다!" : "틀렸습니다",
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyQuizzes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "인증이 필요합니다" });
      return;
    }

    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 10;

    const quizzes = await quizService.getUserCreatedQuizzes(userId, page, size);
    res.json(quizzes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyResults = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "인증이 필요합니다" });
      return;
    }

    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 10;

    const results = await quizService.getUserResults(userId, page, size);
    res.json(results);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUnsolvedQuizzes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "인증이 필요합니다" });
      return;
    }

    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 10;

    const quizzes = await quizService.getUnsolvedQuizzes(userId, page, size);
    res.json(quizzes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getQuizDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "인증이 필요합니다" });
      return;
    }

    const quiz = await quizService.getQuizDetail(id, userId);
    res.json(quiz);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { question, answer, timeLimit, category, difficulty } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "인증이 필요합니다" });
      return;
    }

    if (!question || !answer || !timeLimit || !category || !difficulty) {
      res.status(400).json({ error: "모든 필드를 입력해주세요" });
      return;
    }

    const quiz = await quizService.updateQuiz(
      id,
      {
        question,
        answer,
        timeLimit: parseInt(timeLimit),
        category,
        difficulty,
      },
      userId
    );

    res.json({
      message: "퀴즈가 성공적으로 수정되었습니다",
      quiz,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "인증이 필요합니다" });
      return;
    }

    await quizService.deleteQuiz(id, userId);
    res.json({ message: "퀴즈가 성공적으로 삭제되었습니다" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ===== 공개 라우트 컨트롤러들 (인증 불필요) =====

export const getQuizzes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      category,
      difficulty,
      keyword,
      sortBy = "createdAt",
      sortDirection = "desc",
      page = "0",
      size = "20",
    } = req.query;

    const searchParams = {
      category: category as string,
      difficulty: difficulty as Difficulty,
      keyword: keyword as string,
      sortBy: sortBy as string,
      sortDirection:
        (sortDirection as string) === "asc"
          ? "asc"
          : ("desc" as "asc" | "desc"),
      page: parseInt(page as string),
      size: parseInt(size as string),
    };

    const quizzes = await quizService.getQuizzes(searchParams);
    res.json(quizzes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await quizService.getCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getRandomQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const quiz = await quizService.getRandomQuiz();
    res.json(quiz);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPopularQuizzes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 10;

    const quizzes = await quizService.getPopularQuizzes(page, size);
    res.json(quizzes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getLatestQuizzes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 10;

    const quizzes = await quizService.getLatestQuizzes(page, size);
    res.json(quizzes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getQuizForPlay = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const quiz = await quizService.getQuizForPlay(id);
    res.json(quiz);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getQuizzesByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const quizzesByCategory = await quizService.getQuizzesByCategory();
    res.json(quizzesByCategory);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getQuizStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const statistics = await quizService.getQuizStatistics(id);
    res.json(statistics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
