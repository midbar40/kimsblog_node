// types/quizTypes.ts
import { Difficulty } from "./enum";

// 기본 퀴즈 타입
export interface Quiz {
  id: string;
  question: string;
  answer: string;
  timeLimit: number;
  category: string;
  difficulty: Difficulty;
  playCount: number;
  correctCount: number;
  createdAt: Date;
  createdById: string;
  createdBy?: {
    id: string;
    nickname: string;
  };
}

// 플레이용 퀴즈 (정답 숨김)
export interface QuizForPlay {
  id: string;
  question: string;
  timeLimit: number;
  category: string;
  difficulty: Difficulty;
  playCount: number;
  createdAt: Date;
  createdBy?: {
    id: string;
    nickname: string;
  };
}

// 퀴즈 결과 타입
export interface QuizResult {
  id: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  answeredAt: Date;
  quizId: string;
  userId: string;
  quiz?: {
    id: string;
    question: string;
    answer: string;
    category: string;
    difficulty: Difficulty;
  };
  user?: {
    id: string;
    nickname: string;
  };
}

// 요청 타입들
export interface CreateQuizRequest {
  question: string;
  answer: string;
  timeLimit: number;
  category: string;
  difficulty: Difficulty;
}

export interface UpdateQuizRequest extends CreateQuizRequest {}

export interface SubmitAnswerRequest {
  quizId: string;
  userAnswer: string;
  timeTaken: number;
}

export interface QuizSearchRequest {
  category?: string;
  difficulty?: Difficulty;
  keyword?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  size?: number;
}

// 응답 타입들
export interface QuizResponse {
  message: string;
  quiz: Quiz;
}

export interface QuizListResponse {
  content: Quiz[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface QuizResultResponse {
  result: QuizResult;
  message: string;
}

export interface QuizResultListResponse {
  content: QuizResult[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// 통계 타입
export interface QuizStatistics {
  id: string;
  question: string;
  playCount: number;
  correctCount: number;
  accuracyRate: number;
  averageTime: number;
}

export interface CategoryQuizzes {
  [category: string]: Quiz[];
}

// 에러 응답 타입
export interface ErrorResponse {
  error: string;
  validOptions?: string[];
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 파라미터
export interface PaginationParams {
  page: number;
  size: number;
}

// 정렬 파라미터
export interface SortParams {
  sortBy: string;
  sortDirection: "asc" | "desc";
}

// 검색 파라미터
export interface SearchParams {
  keyword?: string;
  category?: string;
  difficulty?: Difficulty;
}

// 퀴즈 필터 타입
export interface QuizFilters
  extends SearchParams,
    SortParams,
    PaginationParams {}

// 사용자 통계 (추후 구현용)
export interface UserQuizStats {
  totalPlayed: number;
  correctAnswers: number;
  accuracyRate: number;
  averageTime: number;
  bestStreak: number;
  currentStreak: number;
  categoryStats: CategoryStats[];
}

export interface CategoryStats {
  category: string;
  totalPlayed: number;
  correctAnswers: number;
  accuracyRate: number;
}
