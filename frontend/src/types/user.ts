export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  avatar?: string;
  nickname?: string;
  aboutMe?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface PostSummary {
  postId: string;
  content: string;
  img?: string;
  privacy: 'public' | 'almost_private' | 'private';
  createdAt: string;
}

export type FollowStatus = 'self' | 'none' | 'pending' | 'accepted';

export interface Profile {
  user: User;
  isOwner: boolean;
  canView: boolean;
  followStatus: FollowStatus;
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
  followers?: User[];
  following?: User[];
  posts?: PostSummary[];
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
  nickname?: string;
  aboutMe?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}
