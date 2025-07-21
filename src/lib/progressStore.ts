const progressMap = new Map<string, string>();

export function setProgress(key: string, value: string) {
  progressMap.set(key, value);
}

export function getProgress(key: string): string | undefined {
  return progressMap.get(key);
}

export function clearProgress(key: string) {
  progressMap.delete(key);
}
