import bcrypt from "bcrypt";
import {
  getCommentsByPostId,
  createComment as creatCommentService,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
  getCommentCountByPostId as getCommentCountByIdService,
  getCommentCountByPostId,
  getCommentById,
} from "../services/commentService";

// 특정게시글의 댓글 조회
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await getCommentsByPostId(parseInt(postId));

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("댓글 조회 에러: ", error);
    req.status(500).json({
      success: false,
      message: "댓글을 불러오는데 실패했습니다.",
      error: error.message,
    });
  }
};

// 댓글 생성
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { nickname, password, profileImage, content } = req.body;

    // 입력 검증
    if (!nickname || !password || !content) {
      return res.status(400).json({
        success: false,
        message: "닉네임, 비밀번호, 내용은 필수입니다.",
      });
    }

    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const commentData = {
      postId: parseInt(postId),
      nickname,
      hashedPassword,
      profileImage: profileImage || "/default-profile.png",
      content,
    };

    const newComment = await creatCommentService(commentData);

    res.status(201).json({
      success: true,
      message: "댓글이 성공적으로 등록되었습니다.",
      data: newComment,
    });
  } catch (error) {
    console.error("댓글 생성 에러:", error);
    res.status(500).json({
      success: false,
      message: "댓글 작성에 실패했습니다.",
      error: error.message,
    });
  }
};

// 댓글 수정
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, password } = req.body;

    if (!content || password) {
      return res.status(400).json({
        success: false,
        message: "내용과 비밀번호는 필수입니다",
      });
    }

    // 기존 댓글 조회
    const existingComment = await getCommentById(parseInt(commentId));
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "댓글을 찾을 수 없습니다.",
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(
      password,
      existingComment.password
    );
    if (!isPasswordValid) {
      return res.status(403).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    const updateData = { content };
    const updatedComment = await updateCommentService(
      parseInt(commentId),
      updateData
    );

    res.json({
      success: true,
      message: "댓글이 성공적으로 수정되었습니다.",
      data: updatedComment,
    });
  } catch (error) {
    console.error("댓글 수정 에러:", error);
    res.status(500).json({
      success: false,
      message: "댓글 수정에 실패했습니다.",
      error: error.message,
    });
  }
};

// 댓글 삭제
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "비밀번호가 필요합니다.",
      });
    }

    // 기존 댓글 조회 (비밀번호 검증용)
    const existingComment = await getCommentById(parseInt(commentId));
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "댓글을 찾을 수 없습니다.",
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(
      password,
      existingComment.password
    );
    if (!isPasswordValid) {
      return res.status(403).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    await deleteCommentService(parseInt(commentId));

    res.json({
      success: true,
      message: "댓글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("댓글 삭제 에러:", error);
    res.status(500).json({
      success: false,
      message: "댓글 삭제에 실패했습니다.",
      error: error.message,
    });
  }
};
