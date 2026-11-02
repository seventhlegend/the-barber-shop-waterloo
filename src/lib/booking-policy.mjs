export const DAYTIME_CATEGORY_ID = '5WANQKJL7SXJ3G6UTWJSPEQH';
export const VIP_CATEGORY_ID = 'V7A55PRHQFS5ZGUPWX5GDX57';
// See PROJECT_GUIDE.md. Prices and durations come from the VIP Square services.
export const VIP_POLICY = { startMinutes: 20 * 60, finishMinutes: 24 * 60, minimumLeadMinutes: 90 };
// Only these verified Square Team IDs offer VIP. Working days, breaks and
// closing times stay in Square; never copy a recurring staff schedule here.
export const VIP_STAFF_IDS = ['TMwTM4USQOtky2wH', 'TMjP0H-6qwXwl7ie'];
export const BRAZILIAN_SERVICE_ID = '26OAPY6WANNEFAZ5UMNTDTYT';
export const BRAZILIAN_EARLIEST_START_MINUTES = 18 * 60;
export const BOOKING_TIME_ZONE = 'Europe/London';
export const HOLD_DURATION_MS = 10 * 60 * 1000;
// See PROJECT_GUIDE.md before changing this shared frontend/API policy.
export const DAYTIME_POLICY = { cutoffMinutes: 20 * 60, requireFinishByCutoff: false };
const cutoffLabel = `${Math.floor(DAYTIME_POLICY.cutoffMinutes / 60).toString().padStart(2, '0')}:${(DAYTIME_POLICY.cutoffMinutes % 60).toString().padStart(2, '0')}`;
export const DAYTIME_NOTICE = `Daytime appointments ${DAYTIME_POLICY.requireFinishByCutoff ? 'finish by' : 'start before'} ${cutoffLabel}, London time.`;
const clockLabel = minutes => `${Math.floor(minutes / 60) % 24}`.padStart(2, '0') + ':' + `${minutes % 60}`.padStart(2, '0');
export const VIP_NOTICE = `VIP appointments run ${clockLabel(VIP_POLICY.startMinutes)}–${clockLabel(VIP_POLICY.finishMinutes)}, London time, and finish by ${clockLabel(VIP_POLICY.finishMinutes)}. Book at least ${VIP_POLICY.minimumLeadMinutes} minutes ahead.`;
export const VIP_STAFF_NOTICE = 'VIP with Suleyman Tatar and Beyhan Kaya. Available days and times follow the Square calendar.';

const clock = new Intl.DateTimeFormat('en-GB', { timeZone: BOOKING_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// Apply this on both sides of the API, including GMT/BST transitions.
export function isDaytimeSlot(startAt, durationMinutes, earliestStartMinutes = 0) {
  const start = Date.parse(startAt);
  if (!Number.isFinite(start) || !Number.isSafeInteger(durationMinutes) || durationMinutes <= 0) return false;
  const [hour, minute] = clock.format(start).split(':').map(Number);
  const minutes = hour * 60 + minute;
  return minutes >= earliestStartMinutes && minutes < DAYTIME_POLICY.cutoffMinutes && (!DAYTIME_POLICY.requireFinishByCutoff || minutes + durationMinutes <= DAYTIME_POLICY.cutoffMinutes);
}

export function isVipSlot(startAt, durationMinutes, now = Date.now()) {
  const start = Date.parse(startAt);
  if (!Number.isFinite(start) || !Number.isFinite(now) || !Number.isSafeInteger(durationMinutes) || durationMinutes <= 0) return false;
  const [hour, minute] = clock.format(start).split(':').map(Number);
  const minutes = hour * 60 + minute;
  return minutes >= VIP_POLICY.startMinutes && minutes + durationMinutes <= VIP_POLICY.finishMinutes && start - now >= VIP_POLICY.minimumLeadMinutes * 60000;
}

// Derive the rule from the server-verified Square category, never a client mode flag.
export function isServiceSlot(startAt, durationMinutes, service, now = Date.now(), staffId) {
  if (service?.categoryId === VIP_CATEGORY_ID) return isVipSlot(startAt, durationMinutes, now) && VIP_STAFF_IDS.includes(staffId);
  if (service?.categoryId === DAYTIME_CATEGORY_ID) return isDaytimeSlot(startAt, durationMinutes, service.earliestStartMinutes);
  return false;
}
