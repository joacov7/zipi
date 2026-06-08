export function apiError(err: any, fallback = 'Ocurrió un error'): string {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join('\n');
  return msg || fallback;
}
