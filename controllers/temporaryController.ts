import { Request, Response } from "express";
import {
  getTemporaryPost,
  saveTemporaryPost,
  hasTemporaryPost,
  deleteTemporaryPost,
  clearTemporaryPost,
  isTemporaryPostEmpty,
  publishFromTemporary,
} from "../services/temporaryService";

// 인증된 사용자 정보가 있는 Request 인터페이스
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    nickname?: string;
    supabaseId: string;
  };
}

// 임시 저장 글 조회
export const getTempPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const temporaryPost = await getTemporaryPost(userId);

    if (!temporaryPost) {
      return res.status(404).json({ message: "임시저장 데이터가 없습니다." });
    }

    res.status(200).json(temporaryPost);
  } catch (error) {
    console.error("임시저장 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 임시 저장 글 저장/수정
export const saveTempPost = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const { title, content, imageUrls } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    // 유효성 검사
    if (!title && !content && (!imageUrls || imageUrls.length === 0)) {
      return res.status(400).json({ message: "저장할 내용이 없습니다." });
    }

    const temporaryPost = await saveTemporaryPost(userId, {
      title: title || null,
      content: content || null,
      imageUrls: imageUrls || [],
    });

    res.status(200).json({
      message: "임시저장 완료",
      data: temporaryPost,
    });
  } catch (error) {
    console.error("임시저장 오류:", error);
    res.status(500).json({ message: "임시저장에 실패했습니다." });
  }
};

// 임시 저장 글 존재 여부 확인
export const checkTempPost = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const exists = await hasTemporaryPost(userId);
    res.status(200).json({ exists });
  } catch (error) {
    console.error("임시저장 확인 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 임시 저장 글 완전 삭제
export const deleteTempPost = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    await deleteTemporaryPost(userId);
    res.status(200).json({ message: "임시저장 글이 삭제되었습니다." });
  } catch (error) {
    console.error("임시저장 삭제 오류:", error);
    res.status(500).json({ message: "삭제에 실패했습니다." });
  }
};

// 임시 저장 글 초기화
export const clearTempPost = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    await clearTemporaryPost(userId);
    res.status(200).json({ message: "임시저장 글이 초기화되었습니다." });
  } catch (error) {
    console.error("임시저장 초기화 오류:", error);
    res.status(500).json({ message: "초기화에 실패했습니다." });
  }
};

// 임시저장 내용이 비어있는지 확인
export const checkTempPostEmpty = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const isEmpty = await isTemporaryPostEmpty(userId);
    res.status(200).json({ isEmpty });
  } catch (error) {
    console.error("임시저장 상태 확인 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 임시저장에서 포스트로 발행
export const publishTempPost = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const postData = req.body;

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    // 필수 필드 검증
    if (!postData.title || !postData.content) {
      return res.status(400).json({
        message: "제목과 내용은 필수입니다.",
      });
    }

    const newPost = await publishFromTemporary(userId, postData);

    res.status(201).json({
      message: "포스트가 발행되었습니다.",
      data: newPost,
    });
  } catch (error) {
    console.error("포스트 발행 오류:", error);
    if (error.message === "임시저장 데이터가 없습니다.") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "포스트 발행에 실패했습니다." });
  }
};
