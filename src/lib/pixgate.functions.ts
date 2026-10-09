import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { deletePixgateKey, getPixgateKeySource, savePixgateKey } from "./pixgate.server";

const pw = z.object({ password: z.string().min(1).max(200) });

function assertAdmin(password: string) {
  if (password !== process.env["ADMIN_PASSWORD"]) throw new Error("Não autorizado");
}

function mask(token: string): string {
  if (token.length <= 8) return "••••";
  return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}

/** Chave em uso (mascarada) e de onde ela vem: /admin ou secret do Lovable. */
export const getPixgateStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const k = await getPixgateKeySource();
    return { key: k.key ? mask(k.key) : null, source: k.source };
  });

export const savePixgateKeyFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ key: z.string().trim().min(10).max(500) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    await savePixgateKey(data.key);
    return { ok: true };
  });

export const deletePixgateKeyFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    await deletePixgateKey();
    return { ok: true };
  });
