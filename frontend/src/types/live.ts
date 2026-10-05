export type LiveTopic = 'follow' | 'profile' | 'groups';

export interface LiveEvent {
  kind: 'live';
  topic: LiveTopic;
  id?: string;
}

export function isLiveEvent(data: unknown): data is LiveEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'kind' in data &&
    data.kind === 'live' &&
    'topic' in data &&
    typeof data.topic === 'string'
  );
}