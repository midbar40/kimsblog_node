import { prisma } from "../db/dbConnect";

// 임시 작성 글 저장하기
export const createTemporaryPost = async (temporaryData) => {
  const { title, content, image_urls } = temporaryData;

  const newTemporaryPost = prisma.temporaryPost.create({
    data: {
      title,
      content,
      image_urls,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: {
      id: true,
      title: true,
      content: true,
      image_urls: true,
      created_at: true,
      updated_at: true,
    },
  });
  return {
    ...newTemporaryPost,
    imageUrls: JSON.parse(newTemporaryPost.image_urls || "[]"),
  };
};

// 임시 저장 글 수정하기
export const editTemporayPost = async (id, updateData) => {
  const { title, content, image_urls } = updateData;

  const updatedTemporaryPost = await prisma.temporaryPost.update({
    where: { id },
    data: {
      title,
      content,
      image_urls,
      updated_at: new Date(),
    },
    select: {
      id: true,
      title: true,
      content: true,
      image_urls: true,
      created_at: true,
      updated_at: true,
    },
  });

  return {
    ...updatedTemporaryPost,
    imageUrls: JSON.parse(updatedTemporaryPost.image_urls || "[]"),
  };
};

// 임시 작성 글 삭제하기
export const deleteTemporayPost = async (id) => {
  // 이미지 URL 가져와서 Storage에서도 삭제 (선택사항)
  const temporaryPost = await prisma.temporaryPost.findUnique({
    where: { id },
    select: { image_urls: true },
  });

  if (temporaryPost?.image_urls) {
    const imageUrls = JSON.parse(temporaryPost.image_urls);
    // TODO: Supabase Storage에서 이미지 삭제 로직
    // await deleteImagesFromStorage(imageUrls);
  }

  return await prisma.temporaryPost.delete({
    where: { id },
  });
};
