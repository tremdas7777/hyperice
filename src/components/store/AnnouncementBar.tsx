import { store } from "@/data/store";

export function AnnouncementBar() {
  const items = [...store.announcements, ...store.announcements];
  return (
    <div className="relative overflow-hidden bg-heat text-white">
      <div className="flex w-max animate-marquee py-2 [--marquee-duration:28s] hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {items.map((text, i) => (
              <span
                key={i}
                className="flex items-center gap-6 px-6 text-[11px] font-bold uppercase tracking-[0.18em]"
              >
                {text}
                <span className="h-1 w-1 rounded-full bg-white/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
