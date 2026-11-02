import { DAYTIME_CATEGORY_ID, DAYTIME_NOTICE, DAYTIME_POLICY, VIP_CATEGORY_ID, VIP_NOTICE, VIP_POLICY } from './booking-policy.mjs';

const clock = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const BOOKING_PATH = '/book/';
export const bookingCategories = {
  daytime: {
    id: DAYTIME_CATEGORY_ID,
    href: '/book/daytime/',
    title: 'Daytime Services',
    shortTitle: 'Daytime',
    hours: `Before ${clock(DAYTIME_POLICY.cutoffMinutes)}`,
    description: 'Your regular cut, shave or treatment, at a time that fits your day.',
    notice: DAYTIME_NOTICE,
  },
  vip: {
    id: VIP_CATEGORY_ID,
    href: '/book/vip/',
    title: 'VIP After Hours',
    shortTitle: 'VIP After Hours',
    hours: `${clock(VIP_POLICY.startMinutes)}–${clock(VIP_POLICY.finishMinutes)}`,
    description: 'An evening appointment with Suleyman Tatar or Beyhan Kaya, after the day winds down.',
    notice: VIP_NOTICE,
  },
} as const;

export type BookingCategory = keyof typeof bookingCategories;
