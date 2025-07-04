import {
  getAllPosts as getPostsService,
  getPostById as getPostByIdService,
  createPost as createPostService,
  updatePost as updatePostService,
  deletePost as deletePostService,
  searchPosts as searchPostsService,
} from "../services/postService";

// 모든 게시글 조회
export const getAllPosts = async (req, res) => {
  try {
    const { page = 0, limit = 10, search } = req.query;

    const posts = await getPostsService({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("게시글 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "게시글을 불러오는데 실패했습니다.",
      error: error.message,
    });
  }
};

// 특정 게시글 조회
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await getPostByIdService(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("게시글 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "게시글을 불러오는데 실패했습니다.",
      error: error.message,
    });
  }
};

// 게시글 생성
export const createPost = async (req, res) => {
  try {
    const { title, content, imageUrls } = req.body;

    // 입력 검증
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용은 필수입니다.",
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: "제목은 200자 이내로 입력해주세요.",
      });
    }

    if (imageUrls && imageUrls.length > 10) {
      return res.status(400).json({
        success: false,
        message: "이미지는 최대 10개까지 업로드 가능합니다.",
      });
    }

    const postData = {
      title,
      content,
      image_urls: JSON.stringify(imageUrls || []),
    };

    const newPost = await createPostService(postData);

    res.status(201).json({
      success: true,
      message: "게시글이 성공적으로 작성되었습니다.",
      data: newPost,
    });
  } catch (error) {
    console.error("게시글 생성 에러:", error);
    res.status(500).json({
      success: false,
      message: "게시글 작성에 실패했습니다.",
      error: error.message,
    });
  }
};

// 게시글 수정
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, imageUrls } = req.body;

    // 게시글 존재 확인
    const existingPost = await getPostByIdService(id);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    // 입력 검증
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용은 필수입니다.",
      });
    }

    const updateData = {
      title,
      content,
      image_urls: JSON.stringify(imageUrls || []),
    };

    const updatedPost = await updatePostService(id, updateData);

    res.json({
      success: true,
      message: "게시글이 성공적으로 수정되었습니다.",
      data: updatedPost,
    });
  } catch (error) {
    console.error("게시글 수정 에러:", error);
    res.status(500).json({
      success: false,
      message: "게시글 수정에 실패했습니다.",
      error: error.message,
    });
  }
};

// 게시글 삭제
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    // 게시글 존재 확인
    const existingPost = await getPostByIdService(id);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    await deletePostService(id);

    res.json({
      success: true,
      message: "게시글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("게시글 삭제 에러:", error);
    res.status(500).json({
      success: false,
      message: "게시글 삭제에 실패했습니다.",
      error: error.message,
    });
  }
};

// 게시글 검색
export const searchPosts = async (req, res) => {
  try {
    const { keyword } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const posts = await searchPostsService(keyword, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("게시글 검색 에러:", error);
    res.status(500).json({
      success: false,
      message: "검색에 실패했습니다.",
      error: error.message,
    });
  }
};
