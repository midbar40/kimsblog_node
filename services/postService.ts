// services/postService.js
import { prisma } from '../db/dbConnect.js';

export class PostService {
  // 모든 게시글 조회 (페이지네이션)
  static async getAllPosts({ page = 1, limit = 10, search }) {
    const skip = (page - 1) * limit;
    
    const whereClause = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          image_urls: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.post.count({ where: whereClause })
    ]);
    
    // image_urls JSON 파싱
    const postsWithParsedImages = posts.map(post => ({
      ...post,
      imageUrls: JSON.parse(post.image_urls || '[]')
    }));
    
    return {
      posts: postsWithParsedImages,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }
  
  // 특정 게시글 조회
  static async getPostById(id) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        image_urls: true,
        created_at: true,
        updated_at: true
      }
    });
    
    if (!post) return null;
    
    return {
      ...post,
      imageUrls: JSON.parse(post.image_urls || '[]')
    };
  }
  
  // 게시글 생성
  static async createPost(postData) {
    const { title, content, image_urls } = postData;
    
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        image_urls,
        created_at: new Date(),
        updated_at: new Date()
      },
      select: {
        id: true,
        title: true,
        content: true,
        image_urls: true,
        created_at: true,
        updated_at: true
      }
    });
    
    return {
      ...newPost,
      imageUrls: JSON.parse(newPost.image_urls || '[]')
    };
  }
  
  // 게시글 수정
  static async updatePost(id, updateData) {
    const { title, content, image_urls } = updateData;
    
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        image_urls,
        updated_at: new Date()
      },
      select: {
        id: true,
        title: true,
        content: true,
        image_urls: true,
        created_at: true,
        updated_at: true
      }
    });
    
    return {
      ...updatedPost,
      imageUrls: JSON.parse(updatedPost.image_urls || '[]')
    };
  }
  
  // 게시글 삭제
  static async deletePost(id) {
    // 이미지 URL 가져와서 Storage에서도 삭제 (선택사항)
    const post = await prisma.post.findUnique({
      where: { id },
      select: { image_urls: true }
    });
    
    if (post?.image_urls) {
      const imageUrls = JSON.parse(post.image_urls);
      // TODO: Supabase Storage에서 이미지 삭제 로직
      // await deleteImagesFromStorage(imageUrls);
    }
    
    return await prisma.post.delete({
      where: { id }
    });
  }
  
  // 게시글 검색
  static async searchPosts(keyword, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { content: { contains: keyword, mode: 'insensitive' } }
          ]
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          image_urls: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.post.count({
        where: {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { content: { contains: keyword, mode: 'insensitive' } }
          ]
        }
      })
    ]);
    
    const postsWithParsedImages = posts.map(post => ({
      ...post,
      imageUrls: JSON.parse(post.image_urls || '[]')
    }));
    
    return {
      posts: postsWithParsedImages,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      keyword
    };
  }
}