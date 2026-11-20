export const AVATARS = [
  "🦄",
  "🐼",
  "🦊",
  "🐸",
  "🦁",
  "🐙",
  "🦋",
  "🐧",
  "🦖",
  "🐨",
  "🐯",
  "🐶",
  "🐱",
  "🦉",
  "🐬",
  "🐲",
  "🌻",
  "🌈",
  "⭐",
  "🚀",
  "🦸",
  "🧙",
  "🍓",
  "🍦",
  "⚽",
  "🎮",
];

const MAX_NAME = 20;

export function cleanName(input: string): string | null {
  const name = input.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  if (name.length < 1 || name.length > MAX_NAME) return null;
  return name;
}

export const NAME_MAX = MAX_NAME;
