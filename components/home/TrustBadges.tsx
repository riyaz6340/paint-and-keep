export default function TrustBadges() {
  const badges = [
    { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: '🎨', title: 'Premium Paints', desc: 'Non-toxic, child-safe colors' },
    { icon: '📦', title: 'All-Inclusive Kits', desc: 'Everything you need inside' },
    { icon: '💝', title: 'Perfect Gifts', desc: 'For birthdays & occasions' },
  ];

  return (
    <section className="border-y border-gray-100 bg-surface-secondary py-8" aria-label="Trust badges">
      <div className="container-page">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {badges.map((badge) => (
            <div key={badge.title} className="flex flex-col items-center text-center">
              <span className="text-3xl mb-2">{badge.icon}</span>
              <h3 className="text-sm font-bold text-text-primary">{badge.title}</h3>
              <p className="mt-0.5 text-xs text-text-secondary">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
