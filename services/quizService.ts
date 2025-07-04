import { prisma } from "../db/dbConnect";
import {
  CreateQuizRequest,
  QuizSearchRequest,
  SubmitAnswerRequest,
} from "../types/quizTypes";

// 퀴즈 생성
export const createQuiz = async (
  quizData: CreateQuizRequest,
  createdById: string
) => {
  const { question, answer, timeLimit, category, difficulty } = quizData;

  const newQuiz = await prisma.quiz.create({
    data: {
      question,
      answer,
      timeLimit,
      category,
      difficulty,
      createdById,
      playCount: 0,
      correctCount: 0,
    },
    include: {
      createdBy: {
        select: { id: true, nickname: true },
      },
    },
  });

  return newQuiz;
};

// 퀴즈 목록 조회 (검색 및 필터링)
export const getQuizzes = async (searchParams: QuizSearchRequest = {}) => {
  const {
    category,
    difficulty,
    keyword,
    sortBy = "createdAt",
    sortDirection = "desc",
    page = 0,
    size = 20,
  } = searchParams;

  const skip = page * size;

  // WHERE 조건 구성
  const whereClause: any = {};

  if (category) {
    whereClause.category = category;
  }

  if (difficulty) {
    whereClause.difficulty = difficulty;
  }

  if (keyword) {
    whereClause.question = {
      contains: keyword,
      mode: "insensitive",
    };
  }

  // 정렬 조건
  const orderBy: any = {};
  orderBy[sortBy] = sortDirection;

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: size,
      include: {
        createdBy: {
          select: { id: true, nickname: true },
        },
        _count: {
          select: { results: true },
        },
      },
    }),
    prisma.quiz.count({ where: whereClause }),
  ]);

  return {
    content: quizzes,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size,
    first: page === 0,
    last: page >= Math.ceil(total / size) - 1,
  };
};

// 플레이용 퀴즈 조회 (정답 숨김)
export const getQuizForPlay = async (quizId: string) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      question: true,
      timeLimit: true,
      category: true,
      difficulty: true,
      playCount: true,
      createdAt: true,
      createdBy: {
        select: { id: true, nickname: true },
      },
      // answer는 제외 (정답 숨김)
    },
  });

  if (!quiz) {
    throw new Error(`퀴즈를 찾을 수 없습니다: ${quizId}`);
  }

  return quiz;
};

// 랜덤 퀴즈 조회
export const getRandomQuiz = async () => {
  // Prisma에서는 RANDOM() 대신 이런 방식 사용
  const count = await prisma.quiz.count();
  const skip = Math.floor(Math.random() * count);

  const quiz = await prisma.quiz.findFirst({
    skip,
    select: {
      id: true,
      question: true,
      timeLimit: true,
      category: true,
      difficulty: true,
      playCount: true,
      createdAt: true,
      createdBy: {
        select: { id: true, nickname: true },
      },
    },
  });

  if (!quiz) {
    throw new Error("사용 가능한 퀴즈가 없습니다");
  }

  return quiz;
};

// 답안 제출
export const submitAnswer = async (
  submitData: SubmitAnswerRequest,
  userId: string
) => {
  const { quizId, userAnswer, timeTaken } = submitData;

  // 퀴즈 조회
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
  });

  if (!quiz) {
    throw new Error(`퀴즈를 찾을 수 없습니다: ${quizId}`);
  }

  // 답안 검증
  const isCorrect =
    quiz.answer.trim().toLowerCase() === userAnswer.trim().toLowerCase();

  // 트랜잭션으로 결과 저장 및 통계 업데이트
  const result = await prisma.$transaction(async (tx) => {
    // 퀴즈 결과 저장
    const quizResult = await tx.quizResult.create({
      data: {
        quizId,
        userId,
        userAnswer,
        isCorrect,
        timeTaken,
      },
      include: {
        quiz: {
          select: {
            id: true,
            question: true,
            answer: true,
            category: true,
            difficulty: true,
          },
        },
        user: {
          select: { id: true, nickname: true },
        },
      },
    });

    // 퀴즈 통계 업데이트
    await tx.quiz.update({
      where: { id: quizId },
      data: {
        playCount: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
      },
    });

    return quizResult;
  });

  return result;
};

// 사용자의 퀴즈 결과 조회
export const getUserResults = async (userId: string, page = 0, size = 10) => {
  const skip = page * size;

  const [results, total] = await Promise.all([
    prisma.quizResult.findMany({
      where: { userId },
      orderBy: { answeredAt: "desc" },
      skip,
      take: size,
      include: {
        quiz: {
          select: {
            id: true,
            question: true,
            category: true,
            difficulty: true,
          },
        },
      },
    }),
    prisma.quizResult.count({ where: { userId } }),
  ]);

  return {
    content: results,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size,
  };
};

// 카테고리별 퀴즈 그룹화
export const getQuizzesByCategory = async () => {
  const quizzes = await prisma.quiz.findMany({
    select: {
      id: true,
      question: true,
      category: true,
      difficulty: true,
      playCount: true,
      createdAt: true,
      createdBy: {
        select: { id: true, nickname: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 카테고리별로 그룹화
  const groupedQuizzes = quizzes.reduce((acc, quiz) => {
    if (!acc[quiz.category]) {
      acc[quiz.category] = [];
    }
    acc[quiz.category].push(quiz);
    return acc;
  }, {} as Record<string, typeof quizzes>);

  return groupedQuizzes;
};

// 카테고리 목록 조회
export const getCategories = async () => {
  const categories = await prisma.quiz.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return categories.map((c) => c.category);
};

// 사용자가 만든 퀴즈 조회
export const getUserCreatedQuizzes = async (
  userId: string,
  page = 0,
  size = 10
) => {
  const skip = page * size;

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      include: {
        _count: {
          select: { results: true },
        },
      },
    }),
    prisma.quiz.count({ where: { createdById: userId } }),
  ]);

  return {
    content: quizzes,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size,
  };
};

// 인기 퀴즈 조회
export const getPopularQuizzes = async (page = 0, size = 10) => {
  const skip = page * size;

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { playCount: "desc" },
      skip,
      take: size,
      include: {
        createdBy: {
          select: { id: true, nickname: true },
        },
      },
    }),
    prisma.quiz.count(),
  ]);

  return {
    content: quizzes,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size,
  };
};

// 최신 퀴즈 조회
export const getLatestQuizzes = async (page = 0, size = 10) => {
  const skip = page * size;

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      include: {
        createdBy: {
          select: { id: true, nickname: true },
        },
      },
    }),
    prisma.quiz.count(),
  ]);

  return {
    content: quizzes,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size,
  };
};

// 사용자가 풀지 않은 퀴즈 조회
export const getUnsolvedQuizzes = async (
  userId: string,
  page = 0,
  size = 10
) => {
  const skip = page * size;

  // 사용자가 푼 퀴즈 ID들 조회
  const solvedQuizIds = await prisma.quizResult.findMany({
    where: { userId },
    select: { quizId: true },
    distinct: ["quizId"],
  });

  const solvedIds = solvedQuizIds.map((result) => result.quizId);

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where: {
        id: {
          notIn: solvedIds,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      select: {
        id: true,
        question: true,
        timeLimit: true,
        category: true,
        difficulty: true,
        playCount: true,
        createdAt: true,
        createdBy: {
          select: { id: true, nickname: true },
        },
      },
    }),
    prisma.quiz.count({
      where: {
        id: {
          notIn: solvedIds,
        },
      },
    }),
  ]);

  return {
    content: quizzes,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size,
  };
};

// 퀴즈 상세 정보 조회 (제작자용 - 정답 포함)
export const getQuizDetail = async (quizId: string, userId: string) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      createdBy: {
        select: { id: true, nickname: true },
      },
      _count: {
        select: { results: true },
      },
    },
  });

  if (!quiz) {
    throw new Error(`퀴즈를 찾을 수 없습니다: ${quizId}`);
  }

  // 제작자가 아니면 정답 숨김
  if (quiz.createdById !== userId) {
    const { answer, ...quizWithoutAnswer } = quiz;
    return quizWithoutAnswer;
  }

  return quiz;
};

// 퀴즈 삭제 (제작자만 가능)
export const deleteQuiz = async (quizId: string, userId: string) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { createdById: true },
  });

  if (!quiz) {
    throw new Error(`퀴즈를 찾을 수 없습니다: ${quizId}`);
  }

  if (quiz.createdById !== userId) {
    throw new Error("퀴즈를 삭제할 권한이 없습니다");
  }

  await prisma.quiz.delete({
    where: { id: quizId },
  });
};

// 퀴즈 수정 (제작자만 가능)
export const updateQuiz = async (
  quizId: string,
  updateData: CreateQuizRequest,
  userId: string
) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { createdById: true },
  });

  if (!quiz) {
    throw new Error(`퀴즈를 찾을 수 없습니다: ${quizId}`);
  }

  if (quiz.createdById !== userId) {
    throw new Error("퀴즈를 수정할 권한이 없습니다");
  }

  const updatedQuiz = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      question: updateData.question,
      answer: updateData.answer,
      timeLimit: updateData.timeLimit,
      category: updateData.category,
      difficulty: updateData.difficulty,
    },
    include: {
      createdBy: {
        select: { id: true, nickname: true },
      },
    },
  });

  return updatedQuiz;
};

// 퀴즈 통계 조회
export const getQuizStatistics = async (quizId: string) => {
  const [quiz, results] = await Promise.all([
    prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        question: true,
        playCount: true,
        correctCount: true,
      },
    }),
    prisma.quizResult.findMany({
      where: { quizId },
      select: {
        isCorrect: true,
        timeTaken: true,
      },
    }),
  ]);

  if (!quiz) {
    throw new Error(`퀴즈를 찾을 수 없습니다: ${quizId}`);
  }

  const accuracyRate =
    quiz.playCount > 0 ? (quiz.correctCount / quiz.playCount) * 100 : 0;
  const averageTime =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length
      : 0;

  return {
    ...quiz,
    accuracyRate: Math.round(accuracyRate * 100) / 100,
    averageTime: Math.round(averageTime * 100) / 100,
  };
};
