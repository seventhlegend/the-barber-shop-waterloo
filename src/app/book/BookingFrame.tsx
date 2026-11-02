import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BOOKING_PATH } from '../../lib/booking-routes';
import BrandLogo from '../components/BrandLogo';
import './booking.css';

export default function BookingFrame({ children, selection = false }: { children: ReactNode; selection?: boolean }) {
  return (
    <div className={`booking${selection ? ' booking-selection-frame' : ''}`}>
      <header className="booking-header">
        <a className="booking-wordmark" href="/" aria-label="The Barber Shop Waterloo, home"><BrandLogo /></a>
        <a className="booking-home" href={selection ? '/' : BOOKING_PATH}><ArrowLeft size={16} aria-hidden="true" />{selection ? 'Back' : 'Booking options'}</a>
      </header>
      <main>{children}</main>
      <footer className="booking-footer">{selection ? 'London time · Pay at the shop' : <>The Barber Shop · Waterloo <span>London time, always.</span></>}</footer>
    </div>
  );
}
