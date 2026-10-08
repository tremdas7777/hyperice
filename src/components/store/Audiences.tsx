import { Briefcase, Dumbbell, Footprints, Plane } from "lucide-react";
import { motion } from "motion/react";
import { audiences } from "@/data/store";
import { Eyebrow, Reveal, SplitTitle } from "./primitives";

const icons = [Dumbbell, Footprints, Briefcase, Plane];

export function Audiences() {
  return (
    <section className="bg-bone py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Eyebrow className="text-mute">Para quem é</Eyebrow>
        <SplitTitle
          text={"Para todo mundo\nque vive em movimento."}
          className="mt-4 font-display text-[clamp(2.6rem,5.5vw,4.5rem)] uppercase leading-[0.92]"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a, i) => {
            const Icon = icons[i % icons.length] ?? Dumbbell;
            return (
              <Reveal key={a.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="group h-full rounded-3xl bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-shadow hover:shadow-xl"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white transition-colors group-hover:bg-heat">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 font-display text-3xl uppercase">{a.title}</h3>
                  <p className="mt-2 leading-relaxed text-mute">{a.text}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
