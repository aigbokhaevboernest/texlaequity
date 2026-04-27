const stats = [
  { label: "Active investors", value: "284,917" },
  { label: "Total payouts", value: "$48.2M" },
  { label: "Vehicles delivered", value: "12,408" },
  { label: "Avg. monthly ROI", value: "18.7%" },
];

const StatsTicker = () => {
  return (
    <section id="stats" className="relative py-24 border-t border-border/60">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 rounded-2xl overflow-hidden">
          {stats.map((s) => (
            <div key={s.label} className="bg-background p-8 lg:p-10">
              <p className="label-mono text-foreground/40 mb-3">{s.label}</p>
              <p className="font-display text-3xl md:text-4xl font-light tracking-tight text-foreground">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsTicker;
