import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { bookingCategories } from '../../lib/booking-routes';
import BookingFrame from './BookingFrame';

export const metadata: Metadata = {
  title: 'Book an appointment | The Barber Shop Waterloo',
  description: 'Choose Daytime Services or VIP After Hours at The Barber Shop Waterloo. Book your appointment online and pay at the shop.',
  alternates: { canonical: 'https://waterloobarber.shop/book/' },
};

export default function BookPage() {
  return (
    <BookingFrame selection>
      <div className="booking-shell booking-selection">
        <h1>Book your visit.</h1>
        <div className="booking-choices" aria-label="Choose your appointment type">
          {Object.entries(bookingCategories).map(([key, category]) => (
            <a key={key} href={category.href} className={`booking-choice booking-choice-${key}`}>
              <div>
                <h2>{category.shortTitle}</h2>
                <p className="booking-choice-hours">{category.hours}</p>
              </div>
              <ArrowRight size={22} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </BookingFrame>
  );
}
