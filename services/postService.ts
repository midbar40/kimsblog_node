// services/postService.ts
import { prisma } from "../db/dbConnect";
import {
  deleteImagesFromStorage,
  handleImageChanges,
} from "../db/storageUtils";

// 모든 게시글 조회 (페이지네이션)
export const getAllPosts = async ({
  page = 1,
  limit = 10,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const skip = (page - 1) * limit;

  const whereClause = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { content: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }, // camelCase로 변경
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        imageUrls: true, // camelCase로 변경
        createdAt: true, // camelCase로 변경
        updatedAt: true, // camelCase로 변경
      },
    }),
    prisma.post.count({ where: whereClause }),
  ]);

  // imageUrls는 이미 배열이므로 파싱 불필요
  return {
    posts,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

// 특정 게시글 조회
export const getPostById = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      imageUrls: true, // camelCase로 변경
      createdAt: true,
      updatedAt: true,
    },
  });

  return post; // 파싱 불필요
};

// 게시글 생성
export const createPost = async (postData: {
  title: string;
  content: string;
  imageUrls?: string[];
}) => {
  const { title, content, imageUrls = [] } = postData;

  const newPost = await prisma.post.create({
    data: {
      title,
      content,
      imageUrls, // 배열 그대로 저장
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      content: true,
      imageUrls: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return newPost;
};

// 게시글 수정
export const updatePost = async (
  id: string,
  updateData: {
    title?: string;
    content?: string;
    imageUrls?: string[];
  }
) => {
  const { title, content, imageUrls } = updateData;

  // 기존 포스트의 이미지들 조회 (이미지 변경사항 처리용)
  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { imageUrls: true },
  });

  // 이미지 변경사항 처리 (삭제된 이미지만 Storage에서 제거)
  if (existingPost?.imageUrls && imageUrls) {
    await handleImageChanges(existingPost.imageUrls, imageUrls);
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      imageUrls,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      content: true,
      imageUrls: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedPost;
};

// 게시글 삭제
export const deletePost = async (id: string) => {
  // 이미지 URL 가져와서 Storage에서도 삭제
  const post = await prisma.post.findUnique({
    where: { id },
    select: { imageUrls: true },
  });

  // Storage에서 모든 이미지 삭제
  if (post?.imageUrls && post.imageUrls.length > 0) {
    await deleteImagesFromStorage(post.imageUrls);
  }

  return await prisma.post.delete({
    where: { id },
  });
};

// 게시글 검색
export const searchPosts = async (
  keyword: string,
  {
    page = 1,
    limit = 10,
  }: {
    page?: number;
    limit?: number;
  }
) => {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: "insensitive" as const } },
          { content: { contains: keyword, mode: "insensitive" as const } },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        imageUrls: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.post.count({
      where: {
        OR: [
          { title: { contains: keyword, mode: "insensitive" as const } },
          { content: { contains: keyword, mode: "insensitive" as const } },
        ],
      },
    }),
  ]);

  return {
    posts,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    keyword,
  };
};
