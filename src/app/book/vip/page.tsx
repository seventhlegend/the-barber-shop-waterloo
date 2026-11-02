import type { Metadata } from 'next';
import BookingFlow from '../BookingFlow';
import BookingFrame from '../BookingFrame';

export const metadata: Metadata = {
  title: 'Book VIP After Hours | The Barber Shop Waterloo',
  description: 'Book an evening service with Suleyman Tatar or Beyhan Kaya. Live availability and prices from Square. Pay at the shop.',
  alternates: { canonical: 'https://waterloobarber.shop/book/vip/' },
  robots: { index: false, follow: true },
};

export default function VipBookingPage() {
  return <BookingFrame><BookingFlow category="vip" /></BookingFrame>;
}
