import type { Metadata } from 'next';
import BookingDemo from './BookingDemo';

export const metadata: Metadata = {
  title: 'Book an appointment | The Barber Shop Waterloo',
  robots: { index: false, follow: false },
};

export default function BookingDemoPage() {
  return <BookingDemo />;
}
