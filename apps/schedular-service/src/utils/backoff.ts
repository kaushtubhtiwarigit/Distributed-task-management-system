export function calculateExponentialBackoff(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 300000, // 5 minutes
  jitterFactor: number = 0.1
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  const jitter = cappedDelay * jitterFactor * Math.random();
  const finalDelay = cappedDelay + jitter;
  
  return Math.floor(finalDelay);
}

export function calculateNextRetryTime(
  currentTime: Date = new Date(),
  backoffDelay: number
): Date {
  return new Date(currentTime.getTime() + backoffDelay);
}

export function isReadyForRetry(
  nextRetryAt: Date | undefined,
  currentTime: Date = new Date()
): boolean {
  if (!nextRetryAt) {
    return true;
  }
  
  return currentTime >= nextRetryAt;
}
