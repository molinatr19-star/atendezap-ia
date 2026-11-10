import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { CrmRuleError, getBoard, moveLeadToStage } from "@/server/services/crmService";

import { resetDatabase, TEST_WORKSPACE_ID } from "./fixtures";

const WS = TEST_WORKSPACE_ID;

/** Duas etapas; três leads em "Novo" (a, b, c) e um em "Proposta" (d). */
async function setupBoard(workspaceId = WS) {
  await prisma.workspace.create({ data: { id: workspaceId, name: workspaceId } });
  const novo = await prisma.pipelineStage.create({
    data: { workspaceId, name: "Novo", position: 0 },
  });
  const proposta = await prisma.pipelineStage.create({
    data: { workspaceId, name: "Proposta", position: 1 },
  });
  const ids: Record<string, string> = {};
  const entries: [string, string, number][] = [
    ["a", novo.id, 0],
    ["b", novo.id, 1],
    ["c", novo.id, 2],
    ["d", proposta.id, 0],
  ];
  for (const [name, stageId, position] of entries) {
    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        name,
        phoneE164: `+5511900${workspaceId.length}${position}${name.charCodeAt(0)}`,
      },
    });
    const lead = await prisma.lead.create({
      data: { workspaceId, contactId: contact.id, stageId, position, valueCents: 1000 },
    });
    ids[name] = lead.id;
  }
  return { novo: novo.id, proposta: proposta.id, ids };
}

const names = async (stageId: string) =>
  (
    await prisma.lead.findMany({
      where: { stageId },
      orderBy: { position: "asc" },
      include: { contact: true },
    })
  ).map((lead) => `${lead.contact.name}@${lead.position}`);

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Kanban: mover leads", () => {
  it("entre colunas, renumerando origem e destino", async () => {
    const { novo, proposta, ids } = await setupBoard();

    await moveLeadToStage(ids.b, proposta, 0, WS);

    expect(await names(novo)).toEqual(["a@0", "c@1"]);
    expect(await names(proposta)).toEqual(["b@0", "d@1"]);
  });

  it("reordena dentro da mesma coluna", async () => {
    const { novo, ids } = await setupBoard();

    await moveLeadToStage(ids.a, novo, 2, WS);

    expect(await names(novo)).toEqual(["b@0", "c@1", "a@2"]);
  });

  it("o quadro lido reflete a nova ordem", async () => {
    const { proposta, ids } = await setupBoard();
    await moveLeadToStage(ids.c, proposta, 5, WS);

    const board = await getBoard(WS);
    expect(board.map((stage) => stage.leads.map((lead) => lead.contactName))).toEqual([
      ["a", "b"],
      ["d", "c"],
    ]);
  });

  it("não move lead de outro workspace (isolamento)", async () => {
    const other = await setupBoard("ws-outro");
    await setupBoard();

    await expect(moveLeadToStage(other.ids.a, other.proposta, 0, WS)).rejects.toThrow(CrmRuleError);
    expect(await names(other.novo)).toEqual(["a@0", "b@1", "c@2"]);
  });
});
