import { request } from './http';
import type {
  Comment,
  CreateCommentPayload,
  CreatePostPayload,
  ImageUploadResponse,
  Post,
  UpdateCommentPayload,
  UpdatePostPayload,
} from '../types/post';
import type { User } from '../types/user';

export const postsApi = {
  feed: (offset = 0) => request<Post[]>(`/api/feed?limit=20&offset=${offset}`),
  followers: (userId: string) =>
    request<{ followers: User[] }>(`/api/users/${userId}/followers`),
  get: (postId: string) => request<Post>(`/api/posts/${postId}`),
  create: (payload: CreatePostPayload) =>
    request<Post>('/api/posts', { method: 'POST', body: payload }),
  update: (postId: string, payload: UpdatePostPayload) =>
    request<Post>(`/api/posts/${postId}`, { method: 'PATCH', body: payload }),
  remove: (postId: string) => request<void>(`/api/posts/${postId}`, { method: 'DELETE' }),
  like: (postId: string) => request<void>(`/api/posts/${postId}/like`, { method: 'POST' }),
  unlike: (postId: string) => request<void>(`/api/posts/${postId}/like`, { method: 'DELETE' }),

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<ImageUploadResponse>('/api/posts/images', { method: 'POST', body: form });
  },

  comments: (postId: string) => request<Comment[]>(`/api/posts/${postId}/comments`),
  comment: (postId: string, payload: CreateCommentPayload) =>
    request<Comment>(`/api/posts/${postId}/comments`, { method: 'POST', body: payload }),
  updateComment: (commentId: string, payload: UpdateCommentPayload) =>
    request<Comment>(`/api/comments/${commentId}`, { method: 'PATCH', body: payload }),
  removeComment: (commentId: string) =>
    request<void>(`/api/comments/${commentId}`, { method: 'DELETE' }),
  likeComment: (commentId: string) =>
    request<void>(`/api/comments/${commentId}/like`, { method: 'POST' }),
  unlikeComment: (commentId: string) =>
    request<void>(`/api/comments/${commentId}/like`, { method: 'DELETE' }),
};
