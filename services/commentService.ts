import { prisma } from "../db/dbConnect";

// 특정 게시글의 댓글 목록 조회
export const getCommentsByPostId = async (postId) => {
  const comments = await prisma.comment.findMany({
    where: { postId: postId },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      nickname: true,
      profileImage: true,
      content: true,
      created_at: true,
      updated_at: true,
    },
  });
  return comments;
};

// 특정 댓글 하나만 조회
export const getCommentById = async (commentId) => {
  const comment = await prisma.comment.findUnique({
    where: { commentId },
    select: {
      id: true,
      password: true,
      profileImage: true,
      content: true,
      postId: true,
      created_at: true,
      updated_at: true,
    },
  });
  return comment;
};

// 댓글 생성
export const createComment = async (commentData) => {
  const { postId, nickname, password, profileImage, content } = commentData;

  // 게시글 존재 확인
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  const newComment = await prisma.comment.create({
    data: {
      nickname,
      password,
      profileImage,
      content,
      postId,
    },
    select: {
      id: true,
      nickname: true,
      profileImage: true,
      content: true,
      created_at: true,
      updated_at: true,
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
      updated_at: new Date(),
    },
    select: {
      id: true,
      nickname: true,
      profileImage: true,
      content: true,
      created_at: true,
      updated_at: true,
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
