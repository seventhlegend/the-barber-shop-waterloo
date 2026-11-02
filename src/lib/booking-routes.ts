import { DAYTIME_CATEGORY_ID, DAYTIME_NOTICE, VIP_CATEGORY_ID, VIP_NOTICE } from './booking-policy.mjs';

export const BOOKING_PATH = '/book/';
export const bookingCategories = {
  daytime: {
    id: DAYTIME_CATEGORY_ID,
    href: '/book/daytime/',
    title: 'Daytime Services',
    description: 'Your regular cut, shave or treatment, at a time that fits your day.',
    notice: DAYTIME_NOTICE,
    action: 'Book a daytime visit',
  },
  vip: {
    id: VIP_CATEGORY_ID,
    href: '/book/vip/',
    title: 'VIP After Hours',
    description: 'An evening appointment with Suleyman Tatar or Beyhan Kaya, after the day winds down.',
    notice: VIP_NOTICE,
    action: 'Book an evening visit',
  },
} as const;

export type BookingCategory = keyof typeof bookingCategories;
