/** Safely extract a message string from an unknown catch value. */
export function toErrMsg(err: unknown, fallback = 'Server error.'): string {
  return err instanceof Error ? err.message : fallback;
}
