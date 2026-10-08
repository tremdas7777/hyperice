const words = ["Recupere", "Relaxe", "Renove", "Calor", "Massagem", "Air Zoom"];

function Row({ reverse, className }: { reverse?: boolean; className: string }) {
  const content = (
    <div className="flex shrink-0 items-center">
      {words.map((w) => (
        <span
          key={w}
          className="flex items-center gap-8 px-8 font-display text-4xl uppercase sm:text-6xl"
        >
          {w}
          <span className="inline-block h-3 w-3 rotate-45 bg-current opacity-60" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`overflow-hidden py-4 ${className}`}>
      <div
        className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"} [--marquee-duration:26s]`}
      >
        {content}
        <div aria-hidden className="flex">
          {content}
        </div>
      </div>
    </div>
  );
}

export function MarqueeBand() {
  return (
    <section aria-hidden className="relative z-10 -mt-6 overflow-hidden py-8">
      <Row className="-rotate-2 scale-105 bg-heat text-white shadow-xl" />
      <Row reverse className="-mt-3 rotate-1 scale-105 bg-ink text-white" />
    </section>
  );
}
