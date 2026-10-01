import { relativeTime } from '@/src/utils/formatDate';
import type { Message } from '@/src/types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
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
  );
}