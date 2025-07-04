import { prisma } from "../db/dbConnect";
import {
  deleteImagesFromStorage,
  handleImageChanges,
} from "../db/storageUtils";

// ✅ 기존 getTemporaryPost() 호출을 위한 래퍼 함수
export const getTemporaryPost = async (userId?: string) => {
  if (!userId) {
    // 기존 방식 호환 - 고정 ID 사용
    const temporaryPost = await prisma.temporaryPost.findUnique({
      where: { id: 1 },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrls: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return temporaryPost;
  }

  // 새로운 방식 - 사용자별
  const temporaryPost = await prisma.temporaryPost.findUnique({
    where: { userId: userId },
    select: {
      id: true,
      title: true,
      content: true,
      imageUrls: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return temporaryPost;
};

// ✅ 기존 saveTemporaryPost() 호출을 위한 래퍼 함수
export const saveTemporaryPost = async (
  userIdOrData?:
    | string
    | {
        title?: string;
        content?: string;
        imageUrls?: string[];
      },
  temporaryData?: {
    title?: string;
    content?: string;
    imageUrls?: string[];
  }
) => {
  // 새로운 방식 (userId, data)
  if (typeof userIdOrData === "string" && temporaryData) {
    const userId = userIdOrData;
    const { title, content, imageUrls = [] } = temporaryData;

    const existingPost = await prisma.temporaryPost.findUnique({
      where: { userId: userId },
      select: { imageUrls: true },
    });

    if (existingPost?.imageUrls) {
      await handleImageChanges(existingPost.imageUrls, imageUrls);
    }

    const temporaryPost = await prisma.temporaryPost.upsert({
      where: { userId: userId },
      update: {
        title,
        content,
        imageUrls,
        updatedAt: new Date(),
      },
      create: {
        userId: userId,
        title,
        content,
        imageUrls,
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

    return temporaryPost;
  }

  // 기존 방식 호환 (data만)
  const data = userIdOrData as {
    title?: string;
    content?: string;
    imageUrls?: string[];
  };

  const { title, content, imageUrls = [] } = data;

  const existingPost = await prisma.temporaryPost.findUnique({
    where: { id: 1 },
    select: { imageUrls: true },
  });

  if (existingPost?.imageUrls) {
    await handleImageChanges(existingPost.imageUrls, imageUrls);
  }

  const temporaryPost = await prisma.temporaryPost.upsert({
    where: { id: 1 },
    update: {
      title,
      content,
      imageUrls,
      updatedAt: new Date(),
    },
    create: {
      id: 1,
      title,
      content,
      imageUrls,
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

  return temporaryPost;
};

// ✅ 기존 방식 호환
export const hasTemporaryPost = async (userId?: string): Promise<boolean> => {
  let post;

  if (userId) {
    post = await prisma.temporaryPost.findUnique({
      where: { userId: userId },
      select: { title: true, content: true },
    });
  } else {
    post = await prisma.temporaryPost.findUnique({
      where: { id: 1 },
      select: { title: true, content: true },
    });
  }

  const hasTitle = post?.title && post.title.trim() !== "";
  const hasContent = post?.content && post.content.trim() !== "";
  return hasTitle || hasContent;
};

export const createTemporaryPost = async (temporaryData: {
  title?: string;
  content?: string;
  imageUrls?: string[];
}) => {
  return await saveTemporaryPost(temporaryData);
};

export const editTemporaryPost = async (updateData: {
  title?: string;
  content?: string;
  imageUrls?: string[];
}) => {
  return await saveTemporaryPost(updateData);
};

// ✅ 기존 방식 호환
export const deleteTemporaryPost = async (userId?: string) => {
  if (userId) {
    const temporaryPost = await prisma.temporaryPost.findUnique({
      where: { userId: userId },
      select: { imageUrls: true },
    });

    if (temporaryPost?.imageUrls && temporaryPost.imageUrls.length > 0) {
      await deleteImagesFromStorage(temporaryPost.imageUrls);
    }

    return await prisma.temporaryPost.delete({
      where: { userId: userId },
    });
  } else {
    const temporaryPost = await prisma.temporaryPost.findUnique({
      where: { id: 1 },
      select: { imageUrls: true },
    });

    if (temporaryPost?.imageUrls && temporaryPost.imageUrls.length > 0) {
      await deleteImagesFromStorage(temporaryPost.imageUrls);
    }

    return await prisma.temporaryPost.delete({
      where: { id: 1 },
    });
  }
};

// ✅ 기존 방식 호환
export const clearTemporaryPost = async (userId?: string) => {
  if (userId) {
    const temporaryPost = await prisma.temporaryPost.findUnique({
      where: { userId: userId },
      select: { imageUrls: true },
    });

    if (temporaryPost?.imageUrls && temporaryPost.imageUrls.length > 0) {
      await deleteImagesFromStorage(temporaryPost.imageUrls);
    }

    return await prisma.temporaryPost.update({
      where: { userId: userId },
      data: {
        title: null,
        content: null,
        imageUrls: [],
        updatedAt: new Date(),
      },
    });
  } else {
    const temporaryPost = await prisma.temporaryPost.findUnique({
      where: { id: 1 },
      select: { imageUrls: true },
    });

    if (temporaryPost?.imageUrls && temporaryPost.imageUrls.length > 0) {
      await deleteImagesFromStorage(temporaryPost.imageUrls);
    }

    return await prisma.temporaryPost.update({
      where: { id: 1 },
      data: {
        title: null,
        content: null,
        imageUrls: [],
        updatedAt: new Date(),
      },
    });
  }
};

// ✅ 기존 방식 호환
export const isTemporaryPostEmpty = async (
  userId?: string
): Promise<boolean> => {
  const post = await getTemporaryPost(userId);

  if (!post) return true;

  const hasTitle = post.title && post.title.trim() !== "";
  const hasContent = post.content && post.content.trim() !== "";
  const hasImages = post.imageUrls && post.imageUrls.length > 0;

  return !hasTitle && !hasContent && !hasImages;
};

// ✅ authorId 포함하도록 수정
export const publishFromTemporary = async (
  userIdOrPostData?:
    | string
    | {
        title: string;
        content: string;
      },
  postData?: {
    title: string;
    content: string;
  }
) => {
  let userId: string | undefined;
  let finalPostData: { title: string; content: string };

  // 새로운 방식 (userId, postData)
  if (typeof userIdOrPostData === "string" && postData) {
    userId = userIdOrPostData;
    finalPostData = postData;
  } else {
    // 기존 방식 (postData만)
    finalPostData = userIdOrPostData as { title: string; content: string };
  }

  const tempPost = await getTemporaryPost(userId);

  if (!tempPost) {
    throw new Error("임시저장 데이터가 없습니다.");
  }

  // ✅ authorId 포함하여 포스트 생성
  const newPost = await prisma.post.create({
    data: {
      ...finalPostData,
      imageUrls: tempPost.imageUrls,
      authorId: userId || null, // ✅ 작성자 ID 포함
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
      authorId: true,
      author: {
        select: {
          id: true,
          email: true,
          nickname: true,
        },
      },
    },
  });

  // 임시저장 삭제
  await deleteTemporaryPost(userId);

  return newPost;
};
