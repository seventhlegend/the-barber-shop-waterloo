import type { Metadata } from 'next';
import BookingFlow from '../BookingFlow';
import BookingFrame from '../BookingFrame';

export const metadata: Metadata = {
  title: 'Book Daytime Services | The Barber Shop Waterloo',
  description: 'Browse daytime services, choose your specialist and book an available appointment. Pay at the shop.',
  alternates: { canonical: 'https://waterloobarber.shop/book/daytime/' },
  robots: { index: false, follow: true },
};

export default function DaytimeBookingPage() {
  return <BookingFrame><BookingFlow category="daytime" /></BookingFrame>;
}
