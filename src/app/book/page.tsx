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
        <div className="booking-intro">
          <h1>Make time for yourself.</h1>
          <p>A fresh cut by day. A little time out after dark. Choose your visit.</p>
        </div>
        <div className="booking-choices">
          {Object.entries(bookingCategories).map(([key, category]) => (
            <a key={key} href={category.href} className={`booking-choice booking-choice-${key}`}>
              <div>
                <h2>{category.title}</h2>
                <p className="booking-choice-description">{category.description}</p>
              </div>
              <div>
                <p className="booking-choice-hours">{category.notice}</p>
                <span className="booking-choice-action">{category.action}<ArrowRight size={20} aria-hidden="true" /></span>
              </div>
            </a>
          ))}
        </div>
        <p className="booking-selection-note">Book online. Pay at the shop. Prices and available appointments come directly from our Square calendar.</p>
      </div>
    </BookingFrame>
  );
}
