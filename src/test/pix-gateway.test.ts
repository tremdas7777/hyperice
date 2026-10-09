import { beforeEach, describe, expect, it, vi } from "vitest";

// Banco falso: só a tabela private_settings (chaves e gateway escolhido).
const settings = new Map<string, string>();
vi.mock("@/integrations/supabase/client.server", () => {
  const table = () => {
    let filter: { col: string; val: unknown } | null = null;
    const q = {
      select: () => q,
      eq: (col: string, val: unknown) => {
        filter = { col, val };
        return q;
      },
      in: () => q,
      maybeSingle: async () => {
        const v = filter ? settings.get(String(filter.val)) : undefined;
        return { data: v === undefined ? null : { value: v }, error: null };
      },
      upsert: async (row: { key: string; value: string }) => {
        settings.set(row.key, row.value);
        return { error: null };
      },
      delete: () => ({
        eq: async (_c: string, key: string) => {
          settings.delete(key);
          return { error: null };
        },
      }),
    };
    return q;
  };
  return { supabaseAdmin: { from: table } };
});

type Call = { url: string; init?: RequestInit | undefined };
let calls: Call[] = [];
const umbrellaTx: Record<string, { status: string; amount: number }> = {};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(async () => {
  settings.clear();
  calls = [];
  for (const k of Object.keys(umbrellaTx)) delete umbrellaTx[k];
  vi.resetModules();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url === "https://api-gateway.umbrellapag.com/api/user/transactions") {
        const body = JSON.parse(String(init?.body));
        umbrellaTx["tx-um-1"] = { status: "WAITING_PAYMENT", amount: body.amount };
        return json({
          status: 200,
          data: {
            id: "tx-um-1",
            status: "WAITING_PAYMENT",
            amount: body.amount,
            pix: { qrcode: "00020126UMBRELLA" },
          },
        });
      }
      if (url.startsWith("https://api-gateway.umbrellapag.com/api/user/transactions/")) {
        const id = decodeURIComponent(url.split("/").pop()!);
        const tx = umbrellaTx[id];
        return tx ? json({ data: { id, ...tx } }) : json({ message: "Não encontrada" }, 404);
      }
      if (url === "https://app.pixgateip.com/api/v1/cashin") {
        return json({ id: "pg-1", pix: "00020126PIXGATE", status: "pending" });
      }
      if (url.startsWith("https://app.pixgateip.com/api/stats/")) {
        const key = (init?.headers as Record<string, string>)["Apikey"];
        if (key === "pg-invalida-123456") return json({ message: "Client id inválido." }, 403);
        if (url.endsWith("/00000000-0000-0000-0000-000000000000"))
          return json({ message: "Não encontrado" }, 404);
        return json({ status: "paid", value: 99.9 });
      }
      throw new Error(`fetch inesperado: ${url}`);
    }),
  );
});

const pixInput = {
  amount: 9990,
  customer: { name: "Maria Silva", email: "m@x.com", phone: "11999999999", cpf: "52998224725" },
  address: {
    street: "Rua A",
    number: "10",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "sp",
    zipcode: "01001000",
  },
  description: "Produto",
  origin: "https://loja.com/checkout",
  ip: "1.2.3.4",
};

const load = () => import("@/lib/pix-gateway.server");

describe("gateway do Pix", () => {
  it("usa a PixGate por padrão", async () => {
    settings.set("umbrella_api_key", "umb-key-1234567890");
    settings.set("pixgate_api_key", "pg-key-1234567890");
    const { createPix, getPixGatewayState } = await load();
    expect(await getPixGatewayState()).toMatchObject({ selected: "pixgate", active: "pixgate" });
    expect(await createPix(pixInput)).toEqual({
      id: "pg-1",
      qrcode: "00020126PIXGATE",
      status: "pending",
    });
    const body = JSON.parse(String(calls[0]!.init!.body));
    expect(body).toMatchObject({
      nome: "Maria Silva",
      cpf: "52998224725",
      valor: 99.9,
      postback: "https://loja.com/api/public/pix-webhook",
    });
  });

  it("Umbrella escolhida: gera o Pix com a chave e os campos da Umbrella", async () => {
    settings.set("umbrella_api_key", "umb-key-1234567890");
    settings.set("pixgate_api_key", "pg-key-1234567890");
    const { createPix, savePixGateway } = await load();
    await savePixGateway("umbrella");

    const charge = await createPix(pixInput);
    expect(charge).toEqual({
      id: "um_tx-um-1",
      qrcode: "00020126UMBRELLA",
      status: "waiting_payment",
    });

    const call = calls.find((c) => c.url.includes("umbrellapag") && c.init?.method === "POST")!;
    const headers = call.init!.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("umb-key-1234567890");
    expect(headers["User-Agent"]).toBe("UMBRELLAB2B/1.0");
    const body = JSON.parse(String(call.init!.body));
    expect(body).toMatchObject({
      amount: 9990,
      currency: "BRL",
      paymentMethod: "PIX",
      postbackUrl: "https://loja.com/api/public/pix-webhook?gw=um",
      customer: { document: { number: "52998224725", type: "CPF" } },
      items: [{ title: "Produto", unitPrice: 9990, quantity: 1 }],
    });
    expect(body.customer.address).toMatchObject({ streetNumber: "10", state: "SP", country: "BR" });
  });

  it("gateway escolhido sem chave: usa o outro para o checkout não parar", async () => {
    settings.set("umbrella_api_key", "umb-key-1234567890");
    const { createPix, getPixGatewayState } = await load();
    expect(await getPixGatewayState()).toMatchObject({ selected: "pixgate", active: "umbrella" });
    expect((await createPix(pixInput)).id).toBe("um_tx-um-1");
  });

  it("chave da PixGate salva no painel tem prioridade sobre o secret", async () => {
    vi.stubEnv("PIXGATE_API_KEY", "pg-secret-1234567890");
    const { savePixgateKey, getPixgateKeySource } = await import("@/lib/pixgate.server");
    expect(await getPixgateKeySource()).toEqual({ key: "pg-secret-1234567890", source: "secret" });
    await savePixgateKey("pg-painel-1234567890");
    expect(await getPixgateKeySource()).toEqual({ key: "pg-painel-1234567890", source: "admin" });

    const { createPix } = await load();
    await createPix(pixInput);
    expect((calls[0]!.init!.headers as Record<string, string>)["Apikey"]).toBe(
      "pg-painel-1234567890",
    );
    vi.unstubAllEnvs();
  });

  it("troca pelo painel nos dois sentidos e vale no próximo Pix", async () => {
    settings.set("umbrella_api_key", "umb-key-1234567890");
    settings.set("pixgate_api_key", "pg-key-1234567890");
    const { createPix, savePixGateway } = await load();

    await savePixGateway("pixgate");
    expect((await createPix(pixInput)).id).toBe("pg-1");

    await savePixGateway("umbrella");
    expect((await createPix(pixInput)).id).toBe("um_tx-um-1");
  });

  it("não deixa ativar um gateway sem chave", async () => {
    settings.set("pixgate_api_key", "pg-key-1234567890");
    const { savePixGateway } = await load();
    await expect(savePixGateway("umbrella")).rejects.toThrow(/chave da Umbrella/);
    expect(settings.get("pix_gateway")).toBeUndefined();
  });

  it("status de cada pedido vai ao gateway que gerou o Pix, mesmo depois da troca", async () => {
    settings.set("umbrella_api_key", "umb-key-1234567890");
    settings.set("pixgate_api_key", "pg-key-1234567890");
    const { createPix, fetchPixStatus, savePixGateway } = await load();
    await savePixGateway("umbrella");
    const um = await createPix(pixInput);

    await savePixGateway("pixgate");
    umbrellaTx["tx-um-1"]!.status = "PAID";
    expect(await fetchPixStatus(um.id)).toEqual({ status: "paid", amount: 9990 });
    expect(calls.at(-1)!.url).toContain("umbrellapag.com/api/user/transactions/tx-um-1");

    await savePixGateway("umbrella");
    expect(await fetchPixStatus("pg-1")).toEqual({ status: "paid", amount: 9990 });
    expect(calls.at(-1)!.url).toContain("pixgateip.com/api/stats/pg-1");
  });

  it("status da Umbrella conta como pago só quando PAID", async () => {
    const { isPaidStatus } = await import("@/lib/pix-status");
    expect(isPaidStatus("paid")).toBe(true);
    expect(isPaidStatus("PAID")).toBe(true);
    for (const s of ["waiting_payment", "WAITING_PAYMENT", "refused", "pending", "processing"])
      expect(isPaidStatus(s)).toBe(false);
  });

  it("lê o Pix copia e cola nos formatos possíveis da Umbrella", async () => {
    const { umbrellaQrcode } = await import("@/lib/umbrella.server");
    expect(umbrellaQrcode({ pix: { qrcode: "A" } })).toBe("A");
    expect(umbrellaQrcode({ pix: { qrCode: "B" } })).toBe("B");
    expect(umbrellaQrcode({ pix: "C" })).toBe("C");
    expect(umbrellaQrcode({ pix: null, qrCode: "D" })).toBe("D");
    expect(umbrellaQrcode({ pix: null, qrCode: null })).toBeNull();
  });
});

describe("testar chave (sem gerar pedido)", () => {
  it("PixGate: chave aceita e chave recusada, sem chamar o cashin", async () => {
    settings.set("pixgate_api_key", "pg-key-1234567890");
    const { testPixgateKey } = await import("@/lib/pixgate.server");
    expect(await testPixgateKey()).toEqual({ ok: true, status: 404 });

    vi.resetModules();
    settings.set("pixgate_api_key", "pg-invalida-123456");
    const fresh = await import("@/lib/pixgate.server");
    expect(await fresh.testPixgateKey()).toMatchObject({ ok: false, status: 403 });
    expect(calls.some((c) => c.url.includes("/v1/cashin"))).toBe(false);
  });

  it("PixGate sem chave: avisa sem chamar a API", async () => {
    const { testPixgateKey } = await import("@/lib/pixgate.server");
    expect(await testPixgateKey()).toMatchObject({ ok: false });
    expect(calls).toHaveLength(0);
  });

  it("Umbrella: só consulta, nunca cria transação", async () => {
    settings.set("umbrella_api_key", "umb-key-1234567890");
    const { testUmbrellaKey } = await import("@/lib/umbrella.server");
    expect(await testUmbrellaKey()).toEqual({ ok: true, status: 404 });
    expect(calls.every((c) => !c.init?.method || c.init.method === "GET")).toBe(true);
  });
});

describe("webhook", () => {
  async function post(url: string, body: unknown) {
    const seen: string[] = [];
    vi.doMock("@/lib/pix-orders.server", () => ({
      isPaidStatus: (s: string) => s === "paid",
      fetchGatewayStatus: async (id: string) => {
        seen.push(id);
        return { status: "paid", amount: 100 };
      },
      reportPaidOnce: async () => undefined,
    }));
    const { Route } = await import("@/routes/api/public/pix-webhook");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- handler interno da rota
    const handler = (Route.options as any).server.handlers.POST;
    await handler({ request: new Request(url, { method: "POST", body: JSON.stringify(body) }) });
    return seen;
  }

  it("Umbrella: usa o objectId e o prefixo um_", async () => {
    const seen = await post("https://loja.com/api/public/pix-webhook?gw=um", {
      objectId: "abc-123",
      data: { status: "paid" },
    });
    expect(seen).toEqual(["um_abc-123"]);
  });

  it("PixGate e HyperCash continuam como antes", async () => {
    expect(await post("https://loja.com/api/public/pix-webhook", { id: "pg-9" })).toEqual(["pg-9"]);
    expect(
      await post("https://loja.com/api/public/pix-webhook?gw=hc", { data: { id: "card-1" } }),
    ).toEqual(["hc_card-1"]);
  });
});
