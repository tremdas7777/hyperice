import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type Gateway = "pixgate" | "umbrella";

// Estado do servidor simulado: troca de gateway exige chave, como no servidor de verdade.
const server = {
  selected: "pixgate" as Gateway,
  keys: { pixgate: "pg-••••7890", umbrella: "umb-••••7890" } as Record<Gateway, string | null>,
  saved: [] as string[],
};
const state = () => ({
  selected: server.selected,
  active: server.selected,
  configured: { pixgate: !!server.keys.pixgate, umbrella: !!server.keys.umbrella },
  keys: {
    pixgate: { key: server.keys.pixgate, source: server.keys.pixgate ? "admin" : null },
    umbrella: { key: server.keys.umbrella, source: server.keys.umbrella ? "admin" : null },
  },
});

vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/pix-gateway.functions", () => ({
  getPixGatewayStatus: async () => state(),
  setPixGatewayFn: async ({ data }: { data: { gateway: Gateway } }) => {
    server.selected = data.gateway;
    return { ok: true };
  },
  savePixgateKeyFn: async ({ data }: { data: { key: string } }) => {
    server.saved.push(`pixgate:${data.key}`);
    server.keys.pixgate = `${data.key.slice(0, 4)}••••${data.key.slice(-4)}`;
    return { ok: true };
  },
  deletePixgateKeyFn: async () => {
    server.keys.pixgate = null;
    return { ok: true };
  },
  saveUmbrellaKeyFn: async ({ data }: { data: { key: string } }) => {
    server.saved.push(`umbrella:${data.key}`);
    return { ok: true };
  },
  deleteUmbrellaKeyFn: async () => ({ ok: true }),
  testUmbrellaFn: async () => ({ ok: true }),
  testPixgateFn: async () => ({ ok: false, status: 403, error: "Chave recusada pela PixGate" }),
}));

import { PixGatewayCard } from "@/components/admin/PixGatewayCard";

describe("card do gateway do Pix no admin", () => {
  it("começa na PixGate e troca nos dois sentidos", async () => {
    render(<PixGatewayCard password="x" />);
    expect(await screen.findByText("Em uso: PixGate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PixGate" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Umbrella" }));
    expect(await screen.findByText("Em uso: Umbrella")).toBeInTheDocument();
    expect(screen.getByText(/próximos Pix saem pela Umbrella/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "PixGate" }));
    await waitFor(() => expect(screen.getByText("Em uso: PixGate")).toBeInTheDocument());
  });

  it("troca a chave da PixGate pelo painel", async () => {
    render(<PixGatewayCard password="x" />);
    const input = await screen.findByLabelText("Chave da API PixGate");
    fireEvent.change(input, { target: { value: "nova-chave-pixgate-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar chave PixGate" }));

    expect(await screen.findByText(/Chave da PixGate salva/)).toBeInTheDocument();
    expect(server.saved).toContain("pixgate:nova-chave-pixgate-123");
    await waitFor(() => expect(input).toHaveValue(""));
    expect(input).toHaveAttribute("placeholder", "Chave em uso (nova••••-123)");
  });

  it("tem botão de testar a chave de cada gateway", async () => {
    render(<PixGatewayCard password="x" />);
    fireEvent.click(await screen.findByRole("button", { name: "Testar chave PixGate" }));
    expect(
      await screen.findByText("Chave da PixGate com problema: Chave recusada pela PixGate"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Testar chave Umbrella" }));
    expect(
      await screen.findByText("Chave da Umbrella aceita (teste sem gerar pedido)."),
    ).toBeInTheDocument();
  });
});
