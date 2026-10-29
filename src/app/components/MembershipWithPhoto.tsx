const memberships = [
  {
    name: "Classic Membership",
    price: "Free",
    benefits: [
      "Birthday week 40% off any service",
      "1 free annual hair & scalp analysis",
      "1 free annual facial mask",
    ],
  },
  {
    name: "Premium Pro Membership",
    price: "£150 one time",
    benefits: [
      "Custom name-printed barber bag",
      "After-hours appointments (up to 8PM)",
      "10% off on products",
      "Plus classic membership benefits",
    ],
  },
  {
    name: "Executive VIP Membership",
    price: "£150/month",
    benefits: [
      "Weekly haircut or beard service",
      "Exclusive after-hours appointments (up to 9PM)",
      "20% discount on all products",
      "Plus classic membership benefits",
    ],
  },
];

export default function MembershipWithPhoto() {
  return (
    <section id="membership" className="bg-[#211c18] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-5 md:mb-16 md:flex-row md:items-end md:justify-between">
          <h2 className="font-playfair text-5xl leading-tight text-barber-cream md:text-6xl">Membership</h2>
          <p className="max-w-md text-base leading-relaxed text-barber-grey md:text-lg">
            Make good grooming part of your routine. Choose the membership that suits you.
          </p>
        </div>

        <div className="grid border-t border-barber-cream/25 md:grid-cols-3">
          {memberships.map((membership) => (
            <article key={membership.name} className="flex flex-col border-b border-barber-cream/25 py-8 md:pr-8 md:pb-0 md:border-b-0 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-barber-cream/25 md:[&:not(:first-child)]:pl-8">
              <h3 className="font-playfair text-2xl leading-snug text-barber-cream">{membership.name}</h3>
              <p className="mt-3 text-xl font-semibold text-barber-gold">{membership.price}</p>
              <ul className="mt-8 flex-1 space-y-3 text-base leading-relaxed text-barber-grey">
                {membership.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
              </ul>
              <a
                href={`mailto:cut@waterloobarber.shop?subject=${encodeURIComponent(`Enquiry: ${membership.name}`)}`}
                className="mt-8 inline-flex min-h-11 w-fit items-center border-b border-barber-gold pb-1 font-semibold text-barber-cream transition-colors hover:text-barber-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-barber-gold"
              >
                Enquire about membership <span aria-hidden="true" className="ml-2">→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
