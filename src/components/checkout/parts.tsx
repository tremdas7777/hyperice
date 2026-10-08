import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { ArrowLeft, Check, Lock, SquarePen } from "lucide-react";
import { store } from "@/data/store";
import { cn } from "@/lib/utils";

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PixIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("text-pix", className)}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.5 7.6 6.9h1.1c.8 0 1.5.3 2 .8L12 9l1.3-1.3c.5-.5 1.2-.8 2-.8h1.1L12 2.5Zm-6.1 6L2.5 12l3.4 3.4h2.2c.4 0 .8-.2 1.1-.5L11 13.1a1.6 1.6 0 0 0-2.2-2.2L7.1 9c-.3-.3-.7-.5-1.1-.5Zm12.2 0h-2.2c-.4 0-.8.2-1.1.5l-1.8 1.8a1.6 1.6 0 0 0 2.2 2.2l1.8 1.8c.3.3.7.5 1.1.5h.1l3.4-3.4-3.5-3.4ZM12 15l-1.3 1.3c-.5.5-1.2.8-2 .8H7.6l4.4 4.4 4.4-4.4h-1.1c-.8 0-1.5-.3-2-.8L12 15Z" />
    </svg>
  );
}

/** Topo do checkout e das páginas do pedido: volta para a loja + selo de compra segura. */
export function CheckoutHeader({ back = true }: { back?: boolean }) {
  return (
    <header className="bg-ink text-white">
      <div className="mx-auto flex h-16 max-w-[1160px] items-center justify-between px-4">
        {back ? (
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar à loja</span>
          </a>
        ) : (
          <span className="w-8" />
        )}
        {store.showLogo ? (
          <span className="font-display text-2xl tracking-wide">
            {store.name}
            <span className="text-heat">.</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 font-display text-xl uppercase tracking-wide">
            <Lock className="h-4 w-4 text-heat" /> Checkout seguro
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60">
          <Lock className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ambiente criptografado</span>
        </span>
      </div>
    </header>
  );
}

export function Card({
  children,
  done,
  muted,
  className,
}: {
  children: ReactNode;
  done?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 md:p-6",
        done
          ? "border-stone bg-white"
          : muted
            ? "border-transparent bg-stone/50"
            : "border-ink/10 bg-white shadow-[0_18px_40px_-24px_rgba(11,11,12,0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  step,
  onEdit,
  sub,
  muted,
  done,
}: {
  title: string;
  step?: string;
  onEdit?: () => void;
  sub?: string;
  muted?: boolean;
  done?: boolean;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between gap-3">
        <h2
          className={cn(
            "flex items-center gap-2 font-display text-2xl uppercase leading-none",
            muted && "text-mute",
          )}
        >
          {done && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-white">
              <Check className="h-3.5 w-3.5" />
            </span>
          )}
          {title}
        </h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 text-xs font-semibold text-mute hover:text-ink"
          >
            Editar <SquarePen className="h-4 w-4" />
          </button>
        ) : (
          step && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                muted ? "bg-white/60 text-mute" : "bg-heat/10 text-heat",
              )}
            >
              {step}
            </span>
          )
        )}
      </div>
      {sub && <p className={cn("mt-2 text-[13px]", muted ? "text-mute" : "text-ink/70")}>{sub}</p>}
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  ok?: boolean;
  prefix?: string;
  wrap?: string;
};

export function Field({ label, ok, prefix, wrap, className, ...rest }: FieldProps) {
  const filled = Boolean(rest.value);
  return (
    <label className={cn("block", wrap)}>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      <span className="relative flex items-center">
        {prefix && <span className="absolute left-3.5 text-sm text-mute">{prefix}</span>}
        <input
          {...rest}
          className={cn(
            "h-12 w-full rounded-xl border px-3.5 text-base outline-none transition md:text-sm",
            "focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/10",
            filled ? "border-ink/20 bg-bone/60" : "border-stone bg-white",
            prefix && "pl-12",
            className,
          )}
        />
        {ok && (
          <span className="absolute right-3 grid h-5 w-5 place-items-center rounded-full bg-pix text-white">
            <Check className="h-3 w-3" />
          </span>
        )}
      </span>
    </label>
  );
}

/** Botão principal (laranja da loja, com brilho passando). */
export function PrimaryButton({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        "group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-heat text-[15px] font-bold uppercase tracking-wider text-white transition hover:bg-heat-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/35 to-transparent group-disabled:hidden" />
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
}

export function Radio({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
        on ? "border-ink" : "border-ink/25",
      )}
    >
      {on && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
    </span>
  );
}

export function CheckoutFooter() {
  return (
    <footer className="mt-auto bg-ink px-4 py-8 text-center text-[13px] text-white/60">
      <div className="flex items-center justify-center gap-2 text-white">
        <Lock className="h-5 w-5 text-heat" />
        <span className="text-left text-xs leading-tight">
          <b>PAGAMENTO</b>
          <br />
          100% SEGURO
        </span>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {["Master", "VISA", "Elo", "Amex"].map((b) => (
          <span
            key={b}
            className="flex h-7 w-11 items-center justify-center rounded-md bg-white/10 text-[9px] font-bold text-white"
          >
            {b}
          </span>
        ))}
        <span className="flex h-7 w-11 items-center justify-center rounded-md bg-white/10">
          <PixIcon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5">
        © {new Date().getFullYear()}
        {store.showLogo && ` ${store.name}`}
        {store.cnpj && ` · CNPJ ${store.cnpj}`}
        {store.email && ` · ${store.email}`} · Todos os direitos reservados
      </p>
    </footer>
  );
}
