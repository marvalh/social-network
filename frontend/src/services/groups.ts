import { request } from './http';
import type {
  GroupSummary,
  GroupDetail,
  GroupMember,
  GroupInvite,
  GroupJoinRequest,
  GroupEvent,
  CreateGroupPayload,
  SendInvitePayload,
  RespondPayload,
  CreateEventPayload,
  RSVPPayload,
} from '@/src/types/group';

export const groupsApi = {
  create: (payload: CreateGroupPayload) =>
    request<{ groupId: string }>('/api/groups', { method: 'POST', body: payload }),

  browse: () => request<{ groups: GroupSummary[] }>('/api/groups'),

  get: (groupId: string) => request<GroupDetail>(`/api/groups/${groupId}`),

  members: (groupId: string) =>
    request<{ members: GroupMember[] }>(`/api/groups/${groupId}/members`),

  leave: (groupId: string) =>
    request<void>(`/api/groups/${groupId}/members/me`, { method: 'DELETE' }),
  sendInvite: (groupId: string, payload: SendInvitePayload) =>
    request<{ inviteId: string }>(`/api/groups/${groupId}/invites`, {
      method: 'POST',
      body: payload,
    }),

  mine: () => request<{ groups: GroupSummary[] }>('/api/groups/mine'),

  myInvites: () => request<{ invites: GroupInvite[] }>('/api/groups/invites'),

  respondToInvite: (inviteId: string, payload: RespondPayload) =>
    request<void>(`/api/invites/${inviteId}/respond`, { method: 'POST', body: payload }),

  requestToJoin: (groupId: string) =>
    request<void>(`/api/groups/${groupId}/join-requests`, { method: 'POST' }),

  joinRequests: (groupId: string) =>
    request<{ requests: GroupJoinRequest[] }>(`/api/groups/${groupId}/join-requests`),

  respondToJoinRequest: (groupId: string, userId: string, payload: RespondPayload) =>
    request<void>(`/api/groups/${groupId}/join-requests/${userId}/respond`, {
      method: 'POST',
      body: payload,
    }),

  createEvent: (groupId: string, payload: CreateEventPayload) =>
    request<{ eventId: string }>(`/api/groups/${groupId}/events`, {
      method: 'POST',
      body: payload,
    }),

  events: (groupId: string) => request<{ events: GroupEvent[] }>(`/api/groups/${groupId}/events`),

  respondToEvent: (eventId: string, payload: RSVPPayload) =>
    request<void>(`/api/events/${eventId}/respond`, { method: 'POST', body: payload }),
};
