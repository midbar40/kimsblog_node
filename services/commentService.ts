import { prisma } from "../db/dbConnect";

// 특정 게시글의 댓글 목록 조회
export const getCommentsByPostId = async (postId) => {
  const comments = await prisma.comment.findMany({
    where: { postId: postId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nickname: true,
      profileImage: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return comments;
};

// 특정 댓글 하나만 조회
export const getCommentById = async (commentId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      password: true,
      profileImage: true,
      content: true,
      postId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return comment;
};

// 댓글 생성
export const createComment = async (commentData: {
  postId: number;
  userId?: string; // 로그인한 사용자 (선택사항)
  nickname: string;
  password: string;
  content: string;
  profileImage?: string;
}) => {
  const { postId, nickname, password, profileImage, content } = commentData;
  console.log("게시글", postId);
  // 게시글 존재 확인
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  const newComment = await prisma.comment.create({
    data: {
      postId: commentData.postId,
      userId: commentData.userId || null, // ✅ 로그인 사용자 또는 null
      nickname: commentData.nickname.trim(),
      password: password,
      content: commentData.content.trim(),
      profileImage: commentData.profileImage || null,
    },
    select: {
      id: true,
      nickname: true,
      profileImage: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  });
  return newComment;
};

// 댓글 수정
export const updateComment = async (commentId, updateData) => {
  const { content, password } = updateData;

  // 댓글 존재 확인 및 비밀번호 검증
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }

  // 비밀번호 검증은 controller에서 처리
  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      nickname: true,
      profileImage: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return updatedComment;
};

// 댓글 삭제
export const deleteComment = async (commentId) => {
  // 댓글 존재 확인
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });
};

// 특정 게시글의 댓글 수 조회
export const getCommentCountByPostId = async (postId) => {
  const count = await prisma.comment.count({
    where: { postId },
  });
  return count;
};
