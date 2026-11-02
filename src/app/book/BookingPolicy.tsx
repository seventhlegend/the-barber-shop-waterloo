export type CancellationPolicy = { version: string; allowUserCancel: boolean; windowSeconds: number | null; text: string; type: string | null; noShowFee: number | null };
const money = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount / 100);

export default function BookingPolicy({ policy, startAt }: { policy?: CancellationPolicy; startAt?: string }) {
  if (!policy) return null;
  const hours = policy.windowSeconds === null ? null : policy.windowSeconds / 3600;
  const passed = startAt && policy.windowSeconds !== null && Date.parse(startAt) - Date.now() <= policy.windowSeconds * 1000;
  return <section className="booking-policy" aria-label="Cancellation policy">
    <h3>Cancellation policy</h3>
    <p className="booking-muted">{!policy.allowUserCancel ? 'Online cancellation and rescheduling are not available. Contact the shop if you need to make a change.' : passed ? `The ${hours}-hour cancellation and rescheduling notice window has already passed for this appointment. Contact the shop to discuss any changes.` : hours !== null ? `Please allow at least ${hours} hours’ notice for cancellation or rescheduling. Contact the shop if you need to make a change.` : 'Contact the shop for cancellation or rescheduling requests.'}</p>
    <details><summary>See full policy</summary>
      {policy.text ? <p className="booking-muted booking-policy-text">{policy.text}</p> : <p className="booking-muted">The shop has a custom cancellation policy. Please contact the shop for its full terms.</p>}
      {policy.noShowFee !== null && policy.noShowFee > 0 && <p className="booking-muted">Listed no-show fee: {money(policy.noShowFee)}. Contact the shop for how this policy applies. No fee is collected online here.</p>}
      <a className="booking-text-button" href="/#location">Contact the shop</a>
    </details>
  </section>;
}
