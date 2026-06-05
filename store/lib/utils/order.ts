export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRB-${timestamp}-${rand}`;
}
