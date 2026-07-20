// src/store/socialStore.js
import { create } from 'zustand';
import socialAPI from '../api/social';

const useSocialStore = create((set, get) => ({
  // State
  socialData: null,
  isConnected: false,
  posts: [],
  scheduledPosts: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 15
  },

  // Fetch social status
  fetchSocialStatus: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.getSocialStatus(userId);
      
      if (response.status && response.data) {
        set({
          socialData: response.data,
          isConnected: response.data.is_active === 1,
          loading: false
        });
        return response.data;
      }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch social status',
        loading: false
      });
      throw error;
    }
  },

  // Update social status (Connect/Disconnect)
  updateSocialStatus: async (userId, status) => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.updateSocialStatus(userId, status);
      
      set(state => ({
        socialData: {
          ...state.socialData,
          is_active: status
        },
        isConnected: status === 1,
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update status',
        loading: false
      });
      throw error;
    }
  },

  // Create post
  createPost: async (postData) => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.createPost(postData);
      set(state => ({
        posts: [response.data, ...state.posts],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create post',
        loading: false
      });
      throw error;
    }
  },

  // Fetch posts
  fetchPosts: async (page = 1, platform = null) => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.getPosts(page, platform);
      set({
        posts: response.data.data || [],
        pagination: {
          currentPage: response.data.current_page || page,
          totalPages: response.data.last_page || 1,
          totalItems: response.data.total || 0,
          perPage: response.data.per_page || 15
        },
        loading: false
      });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch posts',
        loading: false
      });
      throw error;
    }
  },

  // Fetch scheduled posts
  fetchScheduledPosts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.getScheduledPosts();
      set({
        scheduledPosts: response.data || [],
        loading: false
      });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch scheduled posts',
        loading: false
      });
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    set({ loading: true, error: null });
    try {
      await socialAPI.deletePost(postId);
      set(state => ({
        posts: state.posts.filter(post => post.id !== postId),
        loading: false
      }));
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to delete post',
        loading: false
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset state
  reset: () => set({
    socialData: null,
    isConnected: false,
    posts: [],
    scheduledPosts: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      perPage: 15
    }
  })
}));

export default useSocialStore;
