import { useState } from "react";

const EMOJIS = [
  "📄", "📝", "📋", "📌", "📎", "📁", "📂", "📊", "📈", "💡",
  "🔔", "⭐", "❤️", "🔥", "✅", "❌", "⚡", "🎯", "🎨", "🎵",
  "🏠", "🚀", "🌟", "📚", "🧠", "💪", "👍", "🎉", "🌱", "🌍",
  "📖", "✏️", "🔍", "💬", "🗓️", "⏰", "🔐", "💰", "🍕", "☕",
  "1️⃣", "2️⃣", "3️⃣", "🔴", "🔵", "🟢", "🟡", "🟣", "⚫", "⚪",
];

export function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <div
      className="absolute z-50 mt-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
      style={{ width: 280 }}
    >
      <input
        autoFocus
        type="text"
        placeholder="Filter…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-2 w-full rounded border border-neutral-300 px-2 py-1 text-sm outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
      />
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.filter((e) => !query || e.includes(query)).map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
