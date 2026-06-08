export function apiError(err: any, fallback = 'Ocurrió un error'): string {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join('\n');
  if (typeof msg === 'string' && msg.length > 0) return msg;
  const errMsg = err?.response?.data?.error;
  if (typeof errMsg === 'string' && errMsg.length > 0) return errMsg;
  return fallback;
}
