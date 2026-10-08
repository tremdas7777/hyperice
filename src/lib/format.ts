import { product } from "@/data/store";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatBRL = (value: number) => brl.format(value);

export const pixPrice = (value: number) => value * (1 - product.pixDiscount);

export const installment = (value: number) => value / product.installments;

export const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};
