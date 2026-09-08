import { authenticator } from 'otplib';

const PERIOD_SECONDS = 30;
const REFRESH_THRESHOLD_SECONDS = 5;

/**
 * Generates a TOTP code, but if the current 30s window is about to expire
 * (within REFRESH_THRESHOLD_SECONDS), waits for the next window first.
 * Prevents submitting a code to IdeaSoft that expires mid-flight.
 */
export async function generateFreshTotp(secret: string): Promise<string> {
  const secondsIntoWindow = Math.floor(Date.now() / 1000) % PERIOD_SECONDS;
  const secondsRemaining = PERIOD_SECONDS - secondsIntoWindow;

  if (secondsRemaining <= REFRESH_THRESHOLD_SECONDS) {
    await new Promise((resolve) => setTimeout(resolve, (secondsRemaining + 1) * 1000));
  }

  return authenticator.generate(secret);
}
