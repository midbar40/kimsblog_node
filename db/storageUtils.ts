// db/storageUtils.ts
import { createClient } from "@supabase/supabase-js";

// Supabase Storage에서 이미지들 삭제하는 함수
export const deleteImagesFromStorage = async (imageUrls: string[]) => {
  if (!imageUrls || imageUrls.length === 0) return;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    for (const url of imageUrls) {
      // URL에서 버킷과 파일 경로 추출
      // 예: https://xxx.supabase.co/storage/v1/object/public/images/uploads/file.jpg
      // → bucket: "images", path: "uploads/file.jpg"

      const parts = url.split("/storage/v1/object/public/");
      if (parts.length > 1) {
        const pathWithBucket = parts[1];
        const [bucket, ...pathParts] = pathWithBucket.split("/");
        const filePath = pathParts.join("/");

        // Storage에서 파일 삭제
        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (error) {
          console.error("이미지 삭제 실패:", filePath, error);
        } else {
          console.log("이미지 삭제 성공:", filePath);
        }
      }
    }
  } catch (error) {
    console.error("Storage 삭제 중 오류:", error);
  }
};

// 이미지 차이점 계산하여 삭제할 이미지만 추출
export const getImageDifference = (
  oldImages: string[],
  newImages: string[]
) => {
  const oldSet = new Set(oldImages);
  const newSet = new Set(newImages);

  // 삭제될 이미지: 기존에는 있었지만 새로운 배열에는 없는 것들
  const toDelete = oldImages.filter((img) => !newSet.has(img));

  // 추가된 이미지: 새로운 배열에는 있지만 기존에는 없던 것들
  const toAdd = newImages.filter((img) => !oldSet.has(img));

  return { toDelete, toAdd };
};

// 이미지 변경사항 적용 (삭제된 이미지만 Storage에서 제거)
export const handleImageChanges = async (
  oldImages: string[],
  newImages: string[]
) => {
  const { toDelete } = getImageDifference(oldImages, newImages);

  if (toDelete.length > 0) {
    console.log(`${toDelete.length}개 이미지 삭제 예정:`, toDelete);
    await deleteImagesFromStorage(toDelete);
  }
};
