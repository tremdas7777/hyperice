import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPixGatewayState, PIX_GATEWAYS, savePixGateway } from "./pix-gateway.server";
import {
  deleteUmbrellaKey,
  getUmbrellaKeySource,
  saveUmbrellaKey,
  testUmbrellaKey,
} from "./umbrella.server";

const pw = z.object({ password: z.string().min(1).max(200) });

function assertAdmin(password: string) {
  if (password !== process.env["ADMIN_PASSWORD"]) throw new Error("Não autorizado");
}

function mask(token: string): string {
  if (token.length <= 8) return "••••";
  return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}

/** Gateway escolhido, gateway em uso e chave da Umbrella (mascarada). */
export const getPixGatewayStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const [state, umbrella] = await Promise.all([getPixGatewayState(), getUmbrellaKeySource()]);
    return {
      ...state,
      umbrellaKey: umbrella.key ? mask(umbrella.key) : null,
      umbrellaSource: umbrella.source,
    };
  });

export const setPixGatewayFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ gateway: z.enum(PIX_GATEWAYS) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    await savePixGateway(data.gateway);
    return { ok: true };
  });

export const saveUmbrellaKeyFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ key: z.string().trim().min(10).max(500) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    await saveUmbrellaKey(data.key);
    return { ok: true };
  });

export const deleteUmbrellaKeyFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    await deleteUmbrellaKey();
    return { ok: true };
  });

/** Valida a chave da Umbrella sem gerar cobrança nenhuma. */
export const testUmbrellaFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    return testUmbrellaKey();
  });
