'use client';

const GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '😂',
      '🤣',
      '🙂',
      '😉',
      '😊',
      '😍',
      '😘',
      '😎',
      '🤔',
      '😐',
      '😴',
      '😢',
      '😭',
      '😡',
      '🥳',
      '😱',
      '🙄',
      '😇',
    ],
  },
  {
    label: 'Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🙏', '💪', '👋', '🤝', '✌️', '👌', '🤞', '🫶'],
  },
  {
    label: 'Hearts & symbols',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '💔',
      '✨',
      '🔥',
      '🎉',
      '💯',
      '⭐',
      '✅',
      '❌',
      '❓',
    ],
  },
  {
    label: 'Fun',
    emojis: ['🎂', '🍕', '☕', '🍔', '⚽', '🎮', '🎵', '📷', '🚀', '🌍', '🌙', '☀️'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="max-h-64 w-72 overflow-y-auto rounded-xl border border-border bg-card p-3 shadow-2xl shadow-black/20">
      {GROUPS.map((group) => (
        <div key={group.label} className="mb-3 last:mb-0">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
          <div className="grid grid-cols-8 gap-1">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelect(emoji)}
                className="grid size-8 place-items-center rounded-md text-xl hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
