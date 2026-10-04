import { relativeTime } from '@/src/utils/formatDate';
import type { GroupMessage } from '@/src/types/chat';

interface GroupMessageBubbleProps {
  message: GroupMessage;
  isOwn: boolean;
  senderName?: string;
}

export function GroupMessageBubble({ message, isOwn, senderName }: GroupMessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%]">
        {!isOwn && (
          <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
            {senderName ?? '...'}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${
            isOwn
              ? 'bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white'
              : 'bg-muted text-foreground'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <p className={`mt-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
            {relativeTime(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}