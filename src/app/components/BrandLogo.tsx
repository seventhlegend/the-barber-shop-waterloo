export default function BrandLogo() {
  return (
    <span className="brand-logo">
      <img src="/logo.svg" width={40} height={40} alt="" className="brand-logo-mark" />
      <span className="brand-logo-copy">
        <span className="brand-logo-name">The Barber Shop</span>
        <span className="brand-logo-location">Waterloo · London</span>
      </span>
    </span>
  );
}
