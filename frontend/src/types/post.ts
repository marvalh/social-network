export type PostPrivacy = 'public' | 'followers' | 'private';

export interface PostRealtimeEvent {
  kind: 'post';
  action: string;
  postId: string;
}

export function isPostRealtimeEvent(data: unknown): data is PostRealtimeEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'kind' in data &&
    data.kind === 'post' &&
    'action' in data &&
    typeof data.action === 'string' &&
    'postId' in data &&
    typeof data.postId === 'string'
  );
}

export interface FollowRealtimeEvent {
  kind: 'follow';
  action: string;
  followeeId: string;
}

export function isFollowRealtimeEvent(data: unknown): data is FollowRealtimeEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'kind' in data &&
    data.kind === 'follow' &&
    'action' in data &&
    typeof data.action === 'string' &&
    'followeeId' in data &&
    typeof data.followeeId === 'string'
  );
}

export interface Post {
  postId: string;
  userId: string;
  groupId?: string;
  content: string;
  img?: string;
  privacy: PostPrivacy;
  createdAt: string;
  authorName: string;
  authorAvatar?: string;
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
}

export interface Comment {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  img?: string;
  createdAt: string;
  authorName: string;
  authorAvatar?: string;
  likeCount: number;
  likedByViewer: boolean;
}

export interface CreatePostPayload {
  content: string;
  privacy: PostPrivacy;
  groupId?: string;
  img?: string;
  visibleToIds?: string[];
}

export interface UpdatePostPayload {
  content?: string;
  img?: string | null;
  privacy?: PostPrivacy;
}

export interface CreateCommentPayload {
  content: string;
  img?: string;
}

export interface UpdateCommentPayload {
  content?: string;
  img?: string | null;
}

export interface ImageUploadResponse {
  img: string;
}
