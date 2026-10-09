import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Estado do servidor simulado: troca de gateway exige chave, como no servidor de verdade.
const server = {
  selected: "umbrella" as "umbrella" | "pixgate",
  configured: { umbrella: true, pixgate: true },
};
const state = () => ({
  selected: server.selected,
  active: server.selected,
  configured: server.configured,
  umbrellaKey: "umb-••••7890",
  umbrellaSource: "admin" as const,
});

vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/pix-gateway.functions", () => ({
  getPixGatewayStatus: async () => state(),
  setPixGatewayFn: async ({ data }: { data: { gateway: "umbrella" | "pixgate" } }) => {
    server.selected = data.gateway;
    return { ok: true };
  },
  saveUmbrellaKeyFn: async () => ({ ok: true }),
  deleteUmbrellaKeyFn: async () => ({ ok: true }),
  testUmbrellaFn: async () => ({ ok: true }),
}));

import { PixGatewayCard } from "@/components/admin/PixGatewayCard";

describe("card do gateway do Pix no admin", () => {
  it("mostra o gateway em uso e troca nos dois sentidos", async () => {
    render(<PixGatewayCard password="x" />);
    expect(await screen.findByText("Em uso: Umbrella")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Umbrella" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "PixGate" }));
    expect(await screen.findByText("Em uso: PixGate")).toBeInTheDocument();
    expect(screen.getByText(/próximos Pix saem pela PixGate/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Umbrella" }));
    await waitFor(() => expect(screen.getByText("Em uso: Umbrella")).toBeInTheDocument());
  });
});
