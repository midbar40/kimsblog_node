// middleware/auth.ts (기존 파일을 TypeScript로 업그레이드)
import { Request, Response, NextFunction, RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../db/dbConnect";

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        nickname?: string;
        supabaseId: string;
        role?: string;
      };
      userRole?: string;
    }
  }
}

// 기본 인증 미들웨어 (기존 authMiddleware 개선)
export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "인증 토큰이 필요합니다.",
      });
      return;
    }

    const token = authHeader.replace("Bearer ", "");

    // Supabase JWT 토큰 검증
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: "유효하지 않은 토큰입니다.",
        details: error?.message,
      });
      return;
    }

    // 우리 DB에서 사용자 정보 조회 (선택사항)
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          nickname: true,
        },
      });
    } catch (dbError) {
      // DB 조회 실패해도 Supabase 사용자 정보로 진행
      console.warn("DB 사용자 조회 실패:", dbError);
    }

    // 요청 객체에 사용자 정보 추가
    req.user = {
      id: user.id,
      email: user.email || "",
      nickname: dbUser?.nickname || user.user_metadata?.nickname || "",
      supabaseId: user.id,
    };

    next();
  } catch (error) {
    console.error("Auth middleware 에러:", error);
    res.status(500).json({
      success: false,
      message: "인증 처리 중 오류가 발생했습니다.",
    });
  }
};

// 퀴즈용 인증 미들웨어 (authenticateToken과 호환)
export const authenticateToken: RequestHandler = authMiddleware;

// 선택적 인증 미들웨어
export const optionalAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // 토큰 없어도 통과
      return next();
    }

    const token = authHeader.replace("Bearer ", "");

    // Supabase JWT 토큰 검증 시도
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      // 토큰이 유효하면 사용자 정보 추가
      let dbUser = null;
      try {
        dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        });
      } catch (dbError) {
        console.warn("DB 사용자 조회 실패:", dbError);
      }

      req.user = {
        id: user.id,
        email: user.email || "",
        nickname: dbUser?.nickname || user.user_metadata?.nickname || "",
        supabaseId: user.id,
      };
    }

    // 토큰이 없거나 유효하지 않아도 통과
    next();
  } catch (error) {
    // 에러 발생해도 통과 (선택적이므로)
    console.warn("Optional auth error:", error);
    next();
  }
};

// 관리자 권한 체크 미들웨어 (개선된 버전)
export const adminMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "인증이 필요합니다.",
      });
      return;
    }

    // 방법 1: Supabase profiles 테이블에서 role 확인
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error) {
      console.error("Profile 조회 에러:", error);
      res.status(500).json({
        success: false,
        message: "사용자 프로필 조회 중 오류가 발생했습니다.",
      });
      return;
    }

    if (profile?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "관리자 권한이 필요합니다.",
      });
      return;
    }

    req.userRole = profile.role;
    req.user.role = profile.role;
    next();
  } catch (error) {
    console.error("Admin middleware 에러:", error);
    res.status(500).json({
      success: false,
      message: "권한 확인 중 오류가 발생했습니다.",
    });
  }
};

// Prisma DB 기반 관리자 권한 체크 (대안)
export const adminMiddlewarePrisma: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "인증이 필요합니다.",
      });
      return;
    }

    // Prisma를 사용한 사용자 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "관리자 권한이 필요합니다.",
      });
      return;
    }

    req.userRole = user.role;
    req.user.role = user.role;
    next();
  } catch (error) {
    console.error("Admin middleware (Prisma) 에러:", error);
    res.status(500).json({
      success: false,
      message: "권한 확인 중 오류가 발생했습니다.",
    });
  }
};

// 역할 기반 권한 체크 미들웨어 (확장 가능)
export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "인증이 필요합니다.",
        });
        return;
      }

      // 사용자 역할 조회
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

      const userRole = profile?.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: `필요한 권한: ${allowedRoles.join(", ")}`,
        });
        return;
      }

      req.userRole = userRole;
      req.user.role = userRole;
      next();
    } catch (error) {
      console.error("Role check 에러:", error);
      res.status(500).json({
        success: false,
        message: "권한 확인 중 오류가 발생했습니다.",
      });
    }
  };
};

// 사용 예시들을 위한 헬퍼 함수들
export const requireAdmin = () => requireRole(["ADMIN"]);
export const requireModerator = () => requireRole(["ADMIN", "MODERATOR"]);
export const requireUser = () => requireRole(["ADMIN", "MODERATOR", "USER"]);

// 에러 응답 표준화
interface AuthErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: string;
}

export const createAuthError = (
  message: string,
  code?: string,
  details?: string
): AuthErrorResponse => ({
  success: false,
  message,
  code,
  details,
});

// 토큰 추출 유틸리티
export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.replace("Bearer ", "");
};

// 사용자 정보 검증 유틸리티
export const validateUser = (user: any): boolean => {
  return user && user.id && user.email;
};
