// src/api/social.js
import apiClient from "./client";

export const socialAPI = {
  // Get social status with user ID
  getSocialStatus: async (userId) => {
    try {
      const response = await apiClient.get(`/social/facebook/status/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Get social status error:", error);
      throw error;
    }
  },

  // Update social status (Connect/Disconnect)
  // status: 1 = connected (active), 0 = disconnected (inactive)
  updateSocialStatus: async (userId, status) => {
    try {
      const response = await apiClient.put(
        `/social/facebook/update-status/${userId}`,
        {
          status: status,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Update social status error:", error);
      throw error;
    }
  },

  // Create post (for manual posting)
  createPost: async (postData) => {
    try {
      const response = await apiClient.post("/social/posts", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Create post error:", error);
      throw error;
    }
  },

  // Get posts
  getPosts: async (page = 1, platform = null) => {
    try {
      const params = { page };
      if (platform) params.platform = platform;

      const response = await apiClient.get("/social/posts", { params });
      return response.data;
    } catch (error) {
      console.error("Get posts error:", error);
      throw error;
    }
  },

  // Get single post
  getPost: async (postId) => {
    try {
      const response = await apiClient.get(`/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error("Get post error:", error);
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      const response = await apiClient.delete(`/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error("Delete post error:", error);
      throw error;
    }
  },

  // Update post
  updatePost: async (postId, postData) => {
    try {
      const response = await apiClient.put(`/social/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error("Update post error:", error);
      throw error;
    }
  },

  // Get analytics
  getPostAnalytics: async (postId) => {
    try {
      const response = await apiClient.get(`/social/posts/${postId}/analytics`);
      return response.data;
    } catch (error) {
      console.error("Get post analytics error:", error);
      throw error;
    }
  },

  // Get scheduled posts
  getScheduledPosts: async () => {
    try {
      const response = await apiClient.get("/social/posts/scheduled");
      return response.data;
    } catch (error) {
      console.error("Get scheduled posts error:", error);
      throw error;
    }
  },
};

export default socialAPI;
