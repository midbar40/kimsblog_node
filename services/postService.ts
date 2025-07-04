import { prisma } from "../db/dbConnect";
import {
  deleteImagesFromStorage,
  handleImageChanges,
} from "../db/storageUtils";

export const getAllPosts = async ({ page, limit, search }) => {
  try {
    // 안전한 파라미터 처리
    const validPage = Math.max(0, Math.floor(page));
    const validLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const skip = validPage * validLimit;

    console.log("🔍 서비스 파라미터:", { validPage, validLimit, skip, search });

    // WHERE 조건
    const whereClause = search?.trim()
      ? {
          OR: [
            { title: { contains: search.trim(), mode: "insensitive" } },
            { content: { contains: search.trim(), mode: "insensitive" } },
          ],
        }
      : {};

    // 데이터와 총 개수 조회
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: validLimit,
        select: {
          id: true,
          title: true,
          content: true,
          imageUrls: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / validLimit);

    // 요약과 썸네일 생성
    const content = posts.map((post) => ({
      id: post.id,
      title: post.title,
      summary: extractSummary(post.content),
      thumbnailImage: extractThumbnail(post.imageUrls),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    console.log("✅ 조회 완료:", {
      게시글수: content.length,
      총개수: totalCount,
      총페이지: totalPages,
    });

    // Spring Boot 스타일 반환 (프론트엔드가 기대하는 형식)
    return {
      content,
      totalPages,
      totalElements: totalCount,
      size: validLimit,
      number: validPage,
      first: validPage === 0,
      last: validPage >= totalPages - 1 || totalPages === 0,
      empty: content.length === 0,
    };
  } catch (error) {
    console.error("❌ getPostsService 오류:", error);
    throw error;
  }
};

// HTML 태그 제거하고 요약 생성
const extractSummary = (content, maxLength = 150) => {
  if (!content) return "";

  const textOnly = content
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return textOnly.length <= maxLength
    ? textOnly
    : textOnly.substring(0, maxLength).trim() + "...";
};

// 첫 번째 이미지를 썸네일로 추출
const extractThumbnail = (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return undefined;

  return imageUrls.find(
    (url) => url && url.includes("supabase.co/storage/v1/object/public/")
  );
};

// 특정 게시글 조회
export const getPostById = async (id: number) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
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
    where: { id: Number(id) },
    select: { imageUrls: true },
  });

  // 이미지 변경사항 처리 (삭제된 이미지만 Storage에서 제거)
  if (existingPost?.imageUrls && imageUrls) {
    await handleImageChanges(existingPost.imageUrls, imageUrls);
  }

  const updatedPost = await prisma.post.update({
    where: { id: Number(id) },
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
export const deletePost = async (id: number) => {
  // 이미지 URL 가져와서 Storage에서도 삭제
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    select: { imageUrls: true },
  });

  // Storage에서 모든 이미지 삭제
  if (post?.imageUrls && post.imageUrls.length > 0) {
    await deleteImagesFromStorage(post.imageUrls);
  }

  return await prisma.post.delete({
    where: { id: Number(id) },
  });
};

// 게시글 검색
export const searchPosts = async (
  keyword: string,
  {
    page = 0,
    limit = 10,
  }: {
    page?: number;
    limit?: number;
  }
) => {
  const skip = page * limit;

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
