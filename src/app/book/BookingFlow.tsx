'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, RefreshCw } from 'lucide-react';
import { DAYTIME_NOTICE, VIP_CATEGORY_ID, VIP_NOTICE, VIP_STAFF_NOTICE, isServiceSlot } from '../../lib/booking-policy.mjs';
import { bookingCategories, type BookingCategory } from '../../lib/booking-routes';
import BookingPolicy, { CancellationPolicy } from './BookingPolicy';

type Slot = { id: string; startAt: string; staffId: string; staffName: string; durationMinutes: number };
type Staff = { id: string; name: string };
type Service = { id: string; categoryId: string; name: string; description: string; durationMinutes: number; price: number; priceDescription: string; earliestStartMinutes: number; staff: Staff[]; totals: { subtotal: number; tax: number; total: number; dueToday: number; dueAtAppointment: number } | null };
type Config = { today: string; maxDate: string; categories: { id: string; name: string }[]; services: Service[]; bookingsEnabled: boolean; environment: string; policy: CancellationPolicy };
type Review = { policy: CancellationPolicy; slot: Slot; service: Service; price: number; checkedAt: string; paymentStatus: 'NOT_TAKEN'; bookingStatus: 'NOT_CREATED' };
type Reservation = { id: string; status: 'READY' | 'EXPIRED' | 'PROCESSING' | 'COMPLETE' | 'FAILED' | 'NEEDS_ATTENTION'; slot: Slot; service: Service; amount: number; error?: string; message?: string; bookingId?: string; legacy?: boolean };
type ReservationReference = { id: string; token: string };
type Hold = { id: string; status: 'ACTIVE' | 'EXPIRED' | 'RELEASED' | 'CONSUMED'; expiresAt: string; serverNow: string; date: string; service: Service; slot: Slot; policy: CancellationPolicy };
const holdStorageKey = 'waterloo-appointment-hold';
const newReference = () => ({ id: crypto.randomUUID(), token: Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('') });
const amount = (pence: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
const checkoutStorageKey = 'waterloo-current-checkout';
const money = (pence: number) => pence === 0 ? 'Free' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }).format(pence / 100);
const time = (value: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const fullDate = (value: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00Z`));

async function api<T>(path: string, body?: object, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/booking/${path}`, { ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}), cache: 'no-store', signal });
  let data;
  try { data = await response.json(); } catch { throw new Error('The calendar service is unavailable. Please retry or contact the shop.'); }
  if (!response.ok) throw Object.assign(new Error(data.error || 'The calendar could not be loaded. Please try again.'), { status: response.status });
  return data;
}

export default function BookingFlow({ category }: { category: BookingCategory }) {
  const categoryDetails = bookingCategories[category];
  const categoryId = categoryDetails.id;
  const [previousCategory, setPreviousCategory] = useState<BookingCategory | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState('');
  const [configAttempt, setConfigAttempt] = useState(0);
  const [date, setDate] = useState('');
  const [staffId, setStaffId] = useState('any');
  const [serviceId, setServiceId] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [stage, setStage] = useState<'service' | 'time' | 'details' | 'preview' | 'result'>('service');
  const [customer, setCustomer] = useState({ givenName: '', familyName: '', email: '', phone: '', birthday: '' });
  const [countryCode, setCountryCode] = useState('+44');
  const [customCountryCode, setCustomCountryCode] = useState('+');
  const [appointmentNote, setAppointmentNote] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [hold, setHold] = useState<Hold | null>(null);
  const [holdReference, setHoldReference] = useState<ReservationReference | null>(null);
  const [holdBusy, setHoldBusy] = useState(false);
  const [holdRemaining, setHoldRemaining] = useState(0);
  const holdClock = useRef({ remaining: 0, receivedAt: 0 });
  const [review, setReview] = useState<Review | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [consent, setConsent] = useState(false);
  const [checkout, setCheckout] = useState<Reservation | null>(null);
  const [reference, setReference] = useState<ReservationReference | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const requestVersion = useRef(0);
  const service = config?.services.find(value => value.id === serviceId) || (hold?.service.id === serviceId ? hold.service : undefined);
  const availableStaff = service?.staff || [];
  const holdActive = hold?.status === 'ACTIVE' && holdRemaining > 0;
  const phone = customer.phone.trim().startsWith('+') ? customer.phone.trim() : `${countryCode === 'other' ? customCountryCode : countryCode}${customer.phone.replace(/[\s().-]/g, '').replace(/^0+/, '')}`;
  const applyHold = useCallback((value: Hold) => {
    holdClock.current = { remaining: Math.max(0, Date.parse(value.expiresAt) - Date.parse(value.serverNow)), receivedAt: performance.now() };
    setHoldRemaining(holdClock.current.remaining); setHold(value);
  }, []);
  const calendarReady = !!service;
  const visibleServices = config?.services.filter(value => value.categoryId === categoryId && `${value.name} ${value.description}`.toLocaleLowerCase('en-GB').includes(serviceSearch.trim().toLocaleLowerCase('en-GB'))) || [];
  const updateService = (updated: Service) => setConfig(previous => previous ? { ...previous, services: previous.services.map(value => value.id === updated.id ? updated : value) } : previous);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(checkoutStorageKey);
      if (!stored) return;
      const saved = JSON.parse(stored) as ReservationReference;
      if (!saved.id || !saved.token) return;
      setReference(saved); setStage('result');
      api<Reservation>('reservation/status', saved).then(value => {
        if (!value.legacy && value.service.categoryId !== categoryId) { setPreviousCategory(value.service.categoryId === VIP_CATEGORY_ID ? 'vip' : 'daytime'); return; }
        setCheckout(value);
      }).catch(() => setError('We could not check your previous booking. Use “Check booking status” before making another reservation.'));
    } catch { /* Storage may be unavailable in private browsing. */ }
  }, [categoryId]);

  useEffect(() => {
    const controller = new AbortController();
    try {
      const stored = sessionStorage.getItem(holdStorageKey);
      if (stored) {
        const saved = JSON.parse(stored) as ReservationReference;
        api<Hold>('hold/status', saved, controller.signal).then(value => {
          // One shared hold survives old URLs and navigation between categories.
          // Resume it only on its own route; never replace this page's category.
          if (value.service.categoryId !== categoryId) {
            if ((value.status === 'ACTIVE' && Date.parse(value.expiresAt) > Date.parse(value.serverNow)) || value.status === 'CONSUMED') setPreviousCategory(value.service.categoryId === VIP_CATEGORY_ID ? 'vip' : 'daytime');
            return;
          }
          setHoldReference(saved);
          applyHold(value);
          if (value.status === 'CONSUMED') {
            setReference(saved); setStage('result');
            void api<Reservation>('reservation/status', saved).then(setCheckout).catch(() => setError('Check this reservation with the shop before booking again.'));
          } else if (!sessionStorage.getItem(checkoutStorageKey)) {
            setDate(value.date); setServiceId(value.service.id); setStaffId(value.slot.staffId); setSelected(value.slot); setStage('details');
          }
        }).catch(() => { if (!controller.signal.aborted) setError('Your previous hold could not be restored. Check your connection before choosing a time again.'); });
      }
    } catch { /* Browser storage is optional. */ }
    return () => controller.abort();
  }, [applyHold, categoryId]);

  useEffect(() => {
    if (!hold || hold.status !== 'ACTIVE') return;
    const tick = () => setHoldRemaining(Math.max(0, holdClock.current.remaining - (performance.now() - holdClock.current.receivedAt)));
    tick(); const interval = setInterval(tick, 1000);
    const refreshHold = () => { if (document.visibilityState === 'visible' && holdReference) void api<Hold>('hold/status', holdReference).then(applyHold).catch(() => {}); };
    document.addEventListener('visibilitychange', refreshHold);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', refreshHold); };
  }, [hold, holdReference, applyHold]);

  useEffect(() => {
    if (checkout?.status !== 'PROCESSING' || !reference) return;
    const timeout = setTimeout(() => {
      api<Reservation>('reservation/status', reference).then(result => { setCheckout(result); setError(''); }).catch(() => { setError('Connection interrupted. Check the same booking reference before making another reservation.'); setCheckout(previous => previous ? { ...previous } : previous); });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [checkout, reference]);

  useEffect(() => {
    const controller = new AbortController();
    api<Config>('config', undefined, controller.signal).then(data => { setConfig(data); setDate(previous => previous || data.today); setConfigError(''); }).catch(err => { if (!controller.signal.aborted) { setConfigError(err.message); setLoading(false); } });
    return () => controller.abort();
  }, [configAttempt]);

  useEffect(() => {
    if (stage !== 'time') return;
    if (!date || !calendarReady) { setSelected(null); setSlots([]); setLoading(false); return; }
    if (staffId !== 'any' && !availableStaff.some(member => member.id === staffId)) { setStaffId('any'); setSelected(null); setSlots([]); return; }
    const controller = new AbortController();
    const version = ++requestVersion.current;
    setLoading(true); setError(''); setSelected(null); setSlots([]); setReview(null); setCheckedAt('');
    api<{ slots: Slot[]; service: Service; checkedAt: string }>('availability', { date, staffId, serviceId }, controller.signal).then(data => {
      if (version !== requestVersion.current) return;
      setSlots(data.slots.filter(slot => isServiceSlot(slot.startAt, slot.durationMinutes, data.service, Date.parse(data.checkedAt), slot.staffId))); setCheckedAt(data.checkedAt); updateService(data.service);
    }).catch(err => { if (!controller.signal.aborted && version === requestVersion.current) setError(err.message); }).finally(() => { if (!controller.signal.aborted && version === requestVersion.current) setLoading(false); });
    return () => controller.abort();
  }, [date, staffId, serviceId, calendarReady, refresh, stage]);

  function go(next: typeof stage) { setStage(next); setError(''); setTimeout(() => titleRef.current?.focus(), 0); }
  async function releaseHold() {
    if (holdReference) {
      try { await api<Hold>('hold/release', holdReference); }
      catch (err) { if (![403, 404].includes((err as { status?: number }).status || 0)) throw err; }
    }
    setHold(null); setHoldReference(null); setHoldRemaining(0);
    try { sessionStorage.removeItem(holdStorageKey); } catch { /* Optional storage. */ }
  }
  async function changeAppointment(next: 'time' | 'service' = 'time') {
    setHoldBusy(true); setError('');
    try { await releaseHold(); setReview(null); setPolicyAccepted(false); setSelected(null); setRefresh(value => value + 1); go(next); }
    catch { setError('We could not release this hold. Please retry, or wait until its timer ends.'); }
    finally { setHoldBusy(false); }
  }
  async function startHold() {
    if (!selected || holdBusy) return;
    if (!config?.bookingsEnabled) { go('details'); return; }
    setHoldBusy(true); setError('');
    const active = holdReference || newReference();
    setHoldReference(active);
    try { sessionStorage.setItem(holdStorageKey, JSON.stringify(active)); } catch { /* Optional storage. */ }
    try {
      const value = await api<Hold>('hold/create', { ...active, date, staffId: selected.staffId, slotId: selected.id, serviceId });
      applyHold(value); updateService(value.service); setSelected(value.slot); go('details');
    } catch (err) { setError(err instanceof Error ? err.message : 'The appointment could not be held. Choose another time.'); }
    finally { setHoldBusy(false); }
  }
  function chooseService(next: Service) {
    requestVersion.current++;
    if (next.categoryId !== categoryId) return;
    setServiceId(next.id); setStaffId('any'); setSelected(null); setReview(null); setSlots([]); setCheckedAt(''); setConsent(false); setLoading(true); setRefresh(value => value + 1); go('time');
  }
  function changeDay(offset: number) {
    const next = new Date(`${date || config?.today}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + offset);
    setSelected(null); setDate(next.toISOString().slice(0, 10));
  }
  async function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || reviewing || (config?.bookingsEnabled && !holdActive)) return;
    setReviewing(true); setError('');
    try {
      const data = await api<Review>('review', { date, staffId: selected.staffId, slotId: selected.id, serviceId, ...(holdReference ? { holdId: holdReference.id, holdToken: holdReference.token } : {}) });
      setPolicyAccepted(false); setReview(data); updateService(data.service); go('preview');
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
    finally { setReviewing(false); }
  }

  async function confirmBooking() {
    if (!selected || !review || !consent || !policyAccepted || !holdActive || !holdReference || confirming) return;
    setConfirming(true); setError('');
    const active = reference || holdReference;
    try {
      const prepared = await api<Reservation>('reservation/prepare', { ...active, date, staffId: selected.staffId, slotId: selected.id, serviceId, expectedAmount: review.price, customer: { ...customer, phone, consent }, appointmentNote, policyAccepted, policyVersion: review.policy.version });
      setReference(active);
      try { sessionStorage.setItem(checkoutStorageKey, JSON.stringify(active)); } catch { /* Server ledger remains the source of truth. */ }
      if (prepared.status !== 'READY') { setCheckout(prepared); go('result'); return; }
      setCheckout({ ...prepared, status: 'PROCESSING' }); go('result');
      try { setCheckout(await api<Reservation>('reservation/confirm', { ...active, confirmed: true })); }
      catch { setError('We are checking the same booking. Keep your reference and check its status before making another reservation.'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'The appointment could not be booked. Please try again.'); }
    finally { setConfirming(false); }
  }

  async function startAgain() {
    try { await releaseHold(); } catch { setError('Please retry releasing your hold before choosing another appointment.'); return; }
    try { sessionStorage.removeItem(checkoutStorageKey); } catch { /* Optional browser storage. */ }
    setReference(null); setCheckout(null); setReview(null); setSelected(null); setRefresh(value => value + 1); go('service');
  }

  const current = stage === 'service' ? 0 : stage === 'time' ? 1 : stage === 'details' ? 2 : 3;
  const stepTitles = ['Your service', 'Your time', 'Your details', 'Review & confirm'];
  const shownSlot = checkout?.slot || selected;
  const shownService = checkout?.service || review?.service || service;
  const categoryNotice = categoryId === VIP_CATEGORY_ID ? VIP_NOTICE : DAYTIME_NOTICE;
  const shownNotice = (shownService?.categoryId || categoryId) === VIP_CATEGORY_ID ? VIP_NOTICE : DAYTIME_NOTICE;
  const shownDate = shownSlot ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(shownSlot.startAt)) : date;

  return (
      <div className="booking-shell">
        <div className="booking-intro">
          <h1>{categoryDetails.title}</h1>
          <p>{categoryDetails.description} Choose your service, specialist and time below.</p>
          <p className="booking-status-note">{!config ? 'Checking the booking calendar…' : config.bookingsEnabled ? config.environment === 'sandbox' ? 'Sandbox booking test · pay at the shop.' : 'Book online. Pay at the shop.' : 'Preview only · online booking is currently unavailable.'}</p>
        </div>
        <ol className="booking-steps" aria-label="Booking progress">
          {stepTitles.map((label, index) => <li key={label} aria-current={current === index ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}
        </ol>
        <div className="booking-layout">
          <section className="booking-workspace" aria-label="Appointment selection">
            <h2 ref={titleRef} tabIndex={-1}>{previousCategory ? 'Continue your previous appointment' : stage === 'result' ? checkout?.status === 'COMPLETE' ? 'Your appointment is confirmed' : (checkout?.status === 'FAILED' || checkout?.status === 'EXPIRED') ? 'Booking not completed' : checkout?.status === 'READY' ? 'Booking not submitted' : checkout?.status === 'NEEDS_ATTENTION' ? 'Please contact the shop' : 'Confirming your booking' : stepTitles[current]}</h2>
            {previousCategory ? <div className="booking-message"><p>You already started an appointment in {bookingCategories[previousCategory].title}. Continue there to check its status or choose another appointment.</p><a href={bookingCategories[previousCategory].href}>Continue {bookingCategories[previousCategory].title}<ArrowRight size={16} aria-hidden="true" /></a></div> : configError ? <div className="booking-message" role="alert"><p>{configError}</p><button className="booking-text-button" onClick={() => { setConfigError(''); setLoading(true); setConfigAttempt(value => value + 1); }}>Try again</button><a href="mailto:cut@waterloobarber.shop">Contact the shop</a></div> : !config ? <p role="status" className="booking-loading">Loading the Square calendar…</p> : <>
              {stage === 'service' && <>
                <p className="booking-muted">{categoryNotice}</p>
                {categoryId === VIP_CATEGORY_ID && <p className="booking-muted">{VIP_STAFF_NOTICE}</p>}
                <label className="booking-service-search">Find a service<input type="search" value={serviceSearch} onChange={event => setServiceSearch(event.target.value)} placeholder="Haircut, colour, nails…" /></label>
                <div className="booking-service-list">
                  {visibleServices.map(value => <button type="button" key={value.id} className="booking-service-option" onClick={() => chooseService(value)} aria-label={`Choose ${value.name}, ${money(value.price)}, ${value.durationMinutes} minutes`}>
                    <span className="booking-service-copy"><strong>{value.name}</strong>{value.description && <span>{value.description}</span>}{value.priceDescription && <small>{value.priceDescription}</small>}</span>
                    <span className="booking-service-amount"><strong>{money(value.price)}</strong><small>{value.durationMinutes} min</small></span><ArrowRight size={18} aria-hidden="true" />
                  </button>)}
                </div>
                {!visibleServices.length && <div className="booking-message"><p>{serviceSearch ? 'No services match your search.' : 'No services are currently available in this category. Please contact the shop.'}</p>{serviceSearch && <button className="booking-text-button" onClick={() => setServiceSearch('')}>Show all services in this category</button>}</div>}
              </>}
              {stage === 'time' && service && <>
                <div className="booking-current-service"><div><h3>{service.name}</h3><p>{money(service.price)} · {service.durationMinutes} min</p></div><button className="booking-text-button" disabled={holdBusy} onClick={() => void changeAppointment('service')}>Change service</button></div>
                <div className="booking-controls">
                  <label>Specialist<select value={staffId} onChange={event => setStaffId(event.target.value)}><option value="any">Any available specialist</option>{availableStaff.map(staff => <option value={staff.id} key={staff.id}>{staff.name}</option>)}</select></label>
                  <div className="booking-date-control"><label htmlFor="appointment-date">Appointment date</label><div className="booking-date-row"><button type="button" aria-label="Previous day" disabled={!date || date <= config.today} onClick={() => changeDay(-1)}><ChevronLeft size={18} aria-hidden="true" /></button><input id="appointment-date" aria-label="Appointment date" type="date" required value={date} min={config.today} max={config.maxDate} onInput={event => { setSelected(null); setDate(event.currentTarget.value); }} onChange={event => { setSelected(null); setDate(event.target.value); }} /><button type="button" aria-label="Next day" disabled={!date || date >= config.maxDate} onClick={() => changeDay(1)}><ChevronRight size={18} aria-hidden="true" /></button></div></div>
                </div>
                <div className="booking-time-heading"><div><h3>{date ? fullDate(date) : 'Choose a date'}</h3><p>{shownNotice}</p></div><button className="booking-refresh" type="button" aria-label="Refresh available times" disabled={loading || !date} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={18} aria-hidden="true" /></button></div>
                {service.categoryId === VIP_CATEGORY_ID && <p className="booking-muted">{VIP_STAFF_NOTICE}</p>}
                <div aria-live="polite" aria-busy={loading}>
                  {loading ? <p className="booking-loading" role="status">Checking Square for available times…</p> : error ? <div className="booking-message" role="alert"><p>{error}</p><button className="booking-text-button" onClick={() => setRefresh(value => value + 1)}>Try again</button></div> : !date ? <div className="booking-message"><p>Choose an appointment date to see available times.</p></div> : !slots.length ? <div className="booking-message"><h3>No available appointments</h3><p>Square has no {service.categoryId === VIP_CATEGORY_ID ? 'VIP after-hours' : 'daytime'} times for this selection. Try another date or specialist.</p><button className="booking-text-button" onClick={() => changeDay(1)} disabled={date >= config.maxDate}>Try the next day <ArrowRight size={16} aria-hidden="true" /></button></div> : <fieldset className="booking-time-field"><legend className="sr-only">Available appointments</legend><div className="booking-times">{slots.map(slot => <label key={slot.id} className={`booking-slot ${selected?.id === slot.id ? 'is-selected' : ''}`}><input type="radio" name="appointment" value={slot.id} checked={selected?.id === slot.id} onChange={() => setSelected(slot)} /><span>{time(slot.startAt)}</span><small>{slot.staffName}</small></label>)}</div></fieldset>}
                </div>
                {checkedAt && !loading && <p className="booking-freshness">Checked with Square at {time(checkedAt)} · Times can change until booked.</p>}
                <button className="booking-primary" disabled={!selected || loading || holdBusy || !!error} onClick={startHold}>{holdBusy ? 'Holding your appointment…' : 'Continue to your details'} <ArrowRight size={18} aria-hidden="true" /></button>
              </>}
              {hold && (stage === 'details' || stage === 'preview' || (stage === 'result' && checkout?.status === 'READY')) && <div className="booking-hold" role="timer" aria-live="off" aria-label={holdActive ? 'Appointment hold time remaining' : 'Appointment hold expired'}>
                <strong>{holdActive ? `Appointment held for ${Math.floor(holdRemaining / 60000).toString().padStart(2, '0')}:${Math.floor((holdRemaining % 60000) / 1000).toString().padStart(2, '0')}` : 'Your 10-minute hold has ended'}</strong>
                <p role={holdActive ? undefined : 'alert'}>{holdActive ? 'This time is held on this website. Availability is checked again when you confirm.' : 'Choose an available time again to continue.'}</p>
                {!holdActive && <button type="button" className="booking-text-button" disabled={holdBusy || confirming} onClick={() => void changeAppointment()}>Choose your time again</button>}
              </div>}
              {stage === 'details' && <form onSubmit={preview}>
                <p className="booking-muted">{config.bookingsEnabled ? 'We’ll use your contact details to create your appointment with The Barber Shop and Square.' : 'Your details stay in this page while online booking is unavailable. They are not sent to Square or saved.'}</p>
                <div className="booking-customer-fields">
                  <label>First name<input autoComplete="given-name" name="givenName" required maxLength={100} value={customer.givenName} onChange={event => setCustomer({ ...customer, givenName: event.target.value })} /></label>
                  <label>Last name<input autoComplete="family-name" name="familyName" required maxLength={100} value={customer.familyName} onChange={event => setCustomer({ ...customer, familyName: event.target.value })} /></label>
                  <label className="booking-full">Email address<input type="email" autoComplete="email" name="email" required maxLength={254} value={customer.email} onChange={event => setCustomer({ ...customer, email: event.target.value })} /></label>
                  <div className="booking-full booking-phone-row"><label>Country code<select value={countryCode} onChange={event => setCountryCode(event.target.value)}><option value="+44">UK +44</option><option value="+353">Ireland +353</option><option value="+1">US / Canada +1</option><option value="+90">Türkiye +90</option><option value="+33">France +33</option><option value="+49">Germany +49</option><option value="+31">Netherlands +31</option><option value="+34">Spain +34</option><option value="+39">Italy +39</option><option value="+61">Australia +61</option><option value="+91">India +91</option><option value="other">Other country</option></select>{countryCode === 'other' && <input type="tel" aria-label="International calling code" required pattern="\+[1-9][0-9]{0,2}" maxLength={4} value={customCountryCode} onChange={event => setCustomCountryCode(event.target.value)} />}</label><label>Phone number<input type="tel" autoComplete="tel-national" name="phone" required maxLength={30} minLength={7} value={customer.phone} onChange={event => setCustomer({ ...customer, phone: event.target.value })} /></label></div>
                  <label className="booking-full">Date of birth (optional — for birthday offers)<input type="date" name="birthday" min="1900-01-01" max={config.today} value={customer.birthday} onInput={event => setCustomer({ ...customer, birthday: event.currentTarget.value })} onChange={event => setCustomer({ ...customer, birthday: event.target.value })} /><span className="booking-muted">Shared with the shop. Birthday discounts are not applied automatically.</span></label>
                </div>
                <details className="booking-note"><summary>Appointment note (optional)</summary><label>Anything you’d like us to know?<textarea rows={4} maxLength={1000} value={appointmentNote} onChange={event => setAppointmentNote(event.target.value)} /></label><p className="booking-muted">{appointmentNote.length}/1,000 characters</p></details>
                <BookingPolicy policy={hold?.policy || config.policy} startAt={selected?.startAt} />
                {config.bookingsEnabled && <label className="booking-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>I agree to share my contact details with The Barber Shop and Square for this booking.</span></label>}
                {error && <div className="booking-message" role="alert"><p>{error}</p><button type="button" className="booking-text-button" onClick={() => void changeAppointment()}>Choose another time</button></div>}
                <button className="booking-primary" disabled={reviewing || (config.bookingsEnabled && !holdActive)} type="submit">{reviewing ? 'Rechecking your time…' : 'Review your appointment'}<ArrowRight size={18} aria-hidden="true" /></button>
                <button className="booking-text-button booking-back" type="button" disabled={reviewing} onClick={() => void changeAppointment()}><ArrowLeft size={16} aria-hidden="true" /> Change your appointment</button>
              </form>}
              {stage === 'preview' && review && <>
                <p className="booking-muted">Ready to review, {customer.givenName}. Your selected time was checked again with Square at {time(review.checkedAt)}.</p>
                <dl className="booking-contact"><div><dt>Name</dt><dd>{customer.givenName} {customer.familyName}</dd></div><div><dt>Email</dt><dd>{customer.email}</dd></div><div><dt>Phone</dt><dd>{phone}</dd></div></dl>
                {customer.birthday && <p className="booking-muted">Date of birth: {customer.birthday}</p>}
                {appointmentNote && <div className="booking-reviewed-note"><h3>Appointment note</h3><p>{appointmentNote}</p></div>}
                <BookingPolicy policy={review.policy} startAt={review.slot.startAt} />
                {config.bookingsEnabled && <label className="booking-consent"><input type="checkbox" checked={policyAccepted} onChange={event => setPolicyAccepted(event.target.checked)} /><span>I have read and accept the cancellation policy.</span></label>}
                <div className="booking-confirm-panel">
                  <h3>{review.price === 0 ? 'Free consultation' : 'Pay at the shop'}</h3>
                  <p className="booking-muted">{review.price === 0 ? 'This consultation is free.' : `The service price is ${money(review.price)}, payable when you visit. No online payment or card details are required.`}</p>
                  {config.bookingsEnabled ? <button type="button" className="booking-primary" disabled={confirming || !consent || !policyAccepted || !holdActive} onClick={confirmBooking}>{confirming ? 'Confirming your appointment…' : 'Confirm appointment'}<ArrowRight size={18} aria-hidden="true" /></button> : <div className="booking-message"><p>Online booking is currently unavailable. Your time has not been reserved.</p><a href="mailto:cut@waterloobarber.shop">Contact the shop</a></div>}
                  {error && <div className="booking-message" role="alert"><p>{error}</p><button className="booking-text-button" onClick={() => void changeAppointment()}>Review another time</button></div>}
                </div>
                <button className="booking-text-button booking-back" disabled={confirming} onClick={() => go('details')}><ArrowLeft size={16} aria-hidden="true" /> Edit your details</button>
              </>}
              {stage === 'result' && <div aria-live="polite" className="booking-result">
                {checkout?.status === 'COMPLETE' ? <>
                  <p>Your appointment is confirmed in the shop’s Square calendar.</p>
                  <p className="booking-muted">{checkout.amount === 0 ? 'This consultation is free. No payment is required.' : `Pay ${money(checkout.amount)} at the shop when you visit. No payment was taken online.`}</p>
                  <dl className="booking-contact"><div><dt>Booking</dt><dd>{checkout.bookingId}</dd></div></dl>
                  <p className="booking-muted">Save your booking reference. For changes or cancellations, contact the shop.</p>
                  <button className="booking-text-button" onClick={startAgain}>Book another appointment</button>
                </> : (checkout?.status === 'FAILED' || checkout?.status === 'EXPIRED') ? <>
                  <div className="booking-message" role="alert"><p>{checkout.error}</p></div>
                  <button className="booking-primary" onClick={startAgain}>Choose an appointment again</button>
                </> : checkout?.status === 'READY' ? <>
                  <p>Your appointment has not been submitted. Confirm this reservation or return to choose another time.</p>
                  <button className="booking-primary" disabled={confirming || !reference || !holdActive} onClick={async () => { if (!reference) return; setConfirming(true); setError(''); try { setCheckout(await api<Reservation>('reservation/confirm', { ...reference, confirmed: true })); } catch { setError('We could not confirm the booking. Check its status before trying again.'); } finally { setConfirming(false); } }}>Confirm appointment</button>
                  {error && <p role="alert">{error}</p>}
                  <button className="booking-text-button" disabled={confirming} onClick={startAgain}>Choose another appointment</button>
                </> : checkout?.status === 'NEEDS_ATTENTION' ? <div className="booking-message" role="alert"><p>{checkout.error}</p>{checkout.bookingId && <p>Booking reference: {checkout.bookingId}</p>}</div> : <>
                  <p role="status">{checkout?.message || 'We’re confirming your appointment with Square. Please wait before making another reservation.'}</p>
                  {reference && <p className="booking-reference">Your reference: {reference.id}</p>}
                  {error && <p className="booking-muted" role="alert">{error}</p>}
                  {reference && <button className="booking-text-button" onClick={async () => { try { setCheckout(await api<Reservation>('reservation/status', reference)); setError(''); } catch { setError('We could not check the booking yet. Keep your reference and try again.'); } }}>Check booking status</button>}
                </>}
              </div>}
            </>}
          </section>
          <aside className="booking-summary" aria-label="Your appointment">
            <h2>Your appointment</h2>
            <p className="booking-service-name">{shownService?.name || (categoryId === VIP_CATEGORY_ID ? 'Choose a VIP service' : 'Choose a daytime service')}</p>
            <p className="booking-muted">{shownService?.description || 'Browse the services to start your appointment.'}</p>
            <dl className="booking-summary-details">
              <div><dt><Clock3 size={17} aria-hidden="true" />Duration</dt><dd>{shownSlot?.durationMinutes || shownService?.durationMinutes || '—'} minutes</dd></div>
              <div><dt>Specialist</dt><dd>{shownSlot?.staffName || (staffId === 'any' ? 'Any available' : service?.staff.find(staff => staff.id === staffId)?.name)}</dd></div>
              <div><dt><CalendarDays size={17} aria-hidden="true" />Date &amp; time</dt><dd>{shownSlot ? <>{fullDate(shownDate)}<br />{time(shownSlot.startAt)}–{time(new Date(Date.parse(shownSlot.startAt) + shownSlot.durationMinutes * 60000).toISOString())} London time</> : 'Choose a time'}</dd></div>
            </dl>
            <div className="booking-total"><span>{shownService?.price === 0 ? 'Consultation' : 'Pay at the shop'}</span><strong>{shownService ? money(shownService.price) : '—'}</strong></div>
            {shownService?.totals && <dl className="booking-price-breakdown"><div><dt>Subtotal</dt><dd>{amount(shownService.totals.subtotal)}</dd></div><div><dt>Taxes</dt><dd>{amount(shownService.totals.tax)}</dd></div><div><dt>Total</dt><dd>{amount(shownService.totals.total)}</dd></div><div className="booking-due-today"><dt>Due today</dt><dd>{amount(shownService.totals.dueToday)}</dd></div><div><dt>Due at appointment</dt><dd>{amount(shownService.totals.dueAtAppointment)}</dd></div></dl>}
            <p className="booking-muted">Complimentary whisky, wine, coffee &amp; soft drinks.</p>
            <p className="booking-summary-note">{shownNotice}</p>
            <a className="booking-fallback" href="mailto:cut@waterloobarber.shop">Need a hand? Contact the shop <ArrowRight size={15} aria-hidden="true" /></a>
          </aside>
        </div>
      </div>
  );
}
