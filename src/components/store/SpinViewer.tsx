import { useEffect, useRef, useState } from "react";
import type { ColorVariant } from "@/data/store";

/**
 * Chinelo girando 360° a partir de um vídeo turntable em loop.
 * Gira sozinho; ao arrastar na horizontal, o cliente controla a rotação.
 * O `className` precisa posicionar o elemento (ex.: `absolute inset-0`).
 */
export function SpinViewer({
  color,
  active = true,
  className = "",
  mediaClassName = "",
}: {
  color: ColorVariant;
  active?: boolean;
  className?: string;
  mediaClassName?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const drag = useRef({ active: false, lastX: 0, moved: false });
  const [ready, setReady] = useState(false);
  const poster = color.images[1]?.src ?? color.images[0].src;

  useEffect(() => {
    setReady(false);
  }, [color.id]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active && !drag.current.active) v.play().catch(() => {});
    else v.pause();
  }, [active, color.id]);

  if (!color.spin360) {
    return (
      <div className={`grid place-items-center ${className}`}>
        <img
          src={poster}
          alt={color.images[1]?.alt ?? ""}
          className={`h-full w-full object-contain ${mediaClassName}`}
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
        if (active) video.current?.play().catch(() => {});
      }}
      onPointerCancel={() => {
        drag.current.active = false;
        if (active) video.current?.play().catch(() => {});
      }}
    >
      {/* Foto real enquanto o vídeo carrega (é o mesmo quadro inicial do vídeo) */}
      <img
        src={poster}
        alt=""
        aria-hidden
        draggable={false}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
          ready ? "opacity-0" : "opacity-100"
        } ${mediaClassName}`}
      />
      <video
        key={color.id}
        ref={video}
        src={color.spin360}
        muted
        loop
        playsInline
        autoPlay={active}
        preload="auto"
        disablePictureInPicture
        onCanPlay={() => setReady(true)}
        aria-label={`${color.name} girando 360°`}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
          ready ? "opacity-100" : "opacity-0"
        } ${mediaClassName}`}
      />
    </div>
  );
}
