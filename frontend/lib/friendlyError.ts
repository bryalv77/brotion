/** Plain-language error text: network failures get a fixed message, odd or long technical strings fall back. */
export function friendlyError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : "";
  if (/network|fetch|failed to load|timed? ?out/i.test(message)) {
    return "Can't reach the server. Check your connection and try again";
  }
  const readable = message.length > 0 && message.length <= 120 && !/[{}<>]|\bat \w+\(/.test(message);
  return readable ? message : fallback;
}
