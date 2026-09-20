export const REMINDER_WINDOW_DAYS = 30;
export const REMINDER_WINDOW_MS = REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function computeRemindAt(
  startsAt: string,
  now = new Date()
): string | null {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime()) || start <= now) return null;

  const twentyFourHoursBefore = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourBefore = new Date(start.getTime() - 60 * 60 * 1000);

  let remindAt =
    twentyFourHoursBefore > now ? twentyFourHoursBefore : oneHourBefore;

  if (remindAt <= now) remindAt = oneHourFromNow;
  if (remindAt >= start) return null;

  return remindAt.toISOString();
}

export function isEventTooFarForReminder(
  startsAt: string,
  now = new Date()
): boolean {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return true;
  return start.getTime() - now.getTime() > REMINDER_WINDOW_MS;
}

export function canSetEventReminder(
  startsAt: string,
  now = new Date()
): boolean {
  return (
    !isEventTooFarForReminder(startsAt, now) &&
    computeRemindAt(startsAt, now) !== null
  );
}
