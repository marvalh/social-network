export type FollowStatus = 'self' | 'none' | 'pending' | 'accepted';

export interface FollowListEntry {
  userId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  avatar?: string;
  isFollowedByMe: boolean;
}