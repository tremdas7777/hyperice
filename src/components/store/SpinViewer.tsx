import { useEffect, useRef, useState } from "react";
import type { ColorVariant } from "@/data/store";

/**
 * Chinelo girando 360° a partir de um vídeo turntable em loop.
 * Gira sozinho; ao arrastar na horizontal, o cliente controla a rotação.
 * O `className` precisa posicionar o elemento (ex.: `absolute inset-0`).
 *
 * Desempenho: a foto (mesmo quadro inicial do vídeo) aparece na hora; o vídeo só é baixado quando
 * o visualizador chega perto da tela e a página já terminou de carregar, e fica pausado fora da tela.
 * `priority` marca a foto como a imagem principal da página (o topo da home).
 */
export function SpinViewer({
  color,
  active = true,
  priority = false,
  className = "",
  mediaClassName = "",
}: {
  color: ColorVariant;
  active?: boolean;
  priority?: boolean;
  className?: string;
  mediaClassName?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const drag = useRef({ active: false, lastX: 0, moved: false });
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [load, setLoad] = useState(false);
  const poster = color.images[1]?.src ?? color.images[0].src;
  const playing = active && visible;

  useEffect(() => {
    setReady(false);
  }, [color.id]);

  // Na tela (ou quase): pode carregar e tocar. Escondido (display: none) nunca entra na tela.
  useEffect(() => {
    const el = box.current;
    if (!el || !color.spin360) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [color.spin360]);

  // Baixa o vídeo depois do carregamento da página (ou em até 3 s), para não disputar banda com
  // o que aparece primeiro.
  useEffect(() => {
    if (!visible || load) return;
    const start = () => setLoad(true);
    if (document.readyState === "complete") {
      const t = window.setTimeout(start, 150);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(start, 3000);
    window.addEventListener("load", start, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("load", start);
    };
  }, [visible, load]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing && !drag.current.active) v.play().catch(() => {});
    else v.pause();
  }, [playing, load, color.id]);

  if (!color.spin360) {
    return (
      <div className={`grid place-items-center ${className}`}>
        <img
          src={poster}
          alt={color.images[1]?.alt ?? ""}
          className={`h-full w-full object-contain ${mediaClassName}`}
          {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
        />
      </div>
    );
  }

  const scrub = (dx: number, width: number) => {
    const v = video.current;
    if (!v || !v.duration) return;
    // Arrastar a largura inteira do visualizador = uma volta completa
    let t = v.currentTime - (dx / width) * v.duration;
    t = ((t % v.duration) + v.duration) % v.duration;
    v.currentTime = t;
  };

  return (
    <div
      ref={box}
      className={`select-none ${className}`}
      style={{ touchAction: "pan-y", cursor: "grab" }}
      onPointerDown={(e) => {
        drag.current = { active: true, lastX: e.clientX, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.cursor = "grabbing";
        video.current?.pause();
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.active) return;
        const dx = e.clientX - d.lastX;
        if (Math.abs(dx) < 1) return;
        d.lastX = e.clientX;
        d.moved = true;
        scrub(dx, e.currentTarget.clientWidth);
      }}
      onPointerUp={(e) => {
        drag.current.active = false;
        e.currentTarget.style.cursor = "grab";
        if (playing) video.current?.play().catch(() => {});
      }}
      onPointerCancel={() => {
        drag.current.active = false;
        if (playing) video.current?.play().catch(() => {});
      }}
    >
      {/* Foto real enquanto o vídeo carrega (é o mesmo quadro inicial do vídeo) */}
      <img
        src={poster}
        alt=""
        aria-hidden
        draggable={false}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
          ready ? "opacity-0" : "opacity-100"
        } ${mediaClassName}`}
      />
      {load && (
        <video
          key={color.id}
          ref={video}
          src={color.spin360}
          muted
          loop
          playsInline
          autoPlay={playing}
          preload="auto"
          disablePictureInPicture
          onCanPlay={() => setReady(true)}
          aria-label={`${color.name} girando 360°`}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
            ready ? "opacity-100" : "opacity-0"
          } ${mediaClassName}`}
        />
      )}
    </div>
  );
}
