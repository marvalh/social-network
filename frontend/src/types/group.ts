export interface GroupSummary {
  groupId: string;
  creatorId: string;
  title: string;
  description: string;
  createdAt: string;
  memberCount: number;
}

export interface GroupDetail extends GroupSummary {
  isMember: boolean;
}

export interface GroupMember {
  userId: string;
  joinedAt: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'declined';

export interface GroupInvite {
  inviteId: string;
  groupId: string;
  invitedBy: string;
  invitedTo: string;
  status: RequestStatus;
  createdAt: string;
}

export interface GroupJoinRequest {
  groupId: string;
  requestedBy: string;
  status: RequestStatus;
  createdAt: string;
}

export type EventResponse = '' | 'going' | 'not_going';

export interface GroupEvent {
  eventId: string;
  groupId: string;
  creatorId: string;
  title: string;
  description: string;
  eventTime: string;
  createdAt: string;
  goingCount: number;
  notGoingCount: number;
  myResponse: EventResponse;
}

export interface CreateGroupPayload {
  title: string;
  description: string;
}

export interface SendInvitePayload {
  invitedTo: string;
}

export interface RespondPayload {
  accept: boolean;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  eventTime: string;
}

export interface RSVPPayload {
  response: 'going' | 'not_going';
}