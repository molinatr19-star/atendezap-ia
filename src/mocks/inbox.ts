import { DEMO_WORKSPACE_ID } from "@/config/workspace";
import type { Contact, Conversation, Message, MessageAuthor } from "@/types/domain";

/**
 * Caixa de entrada fictícia de uma empresa inventada ("Casa Aurora Móveis Planejados"),
 * usada apenas pelo seed (prisma/seed.ts). Nomes e telefones são fictícios (+55 11 90000-00XX).
 * Os horários são relativos ao momento do seed, para a demonstração sempre parecer "recente".
 */

type ScriptLine = [author: MessageAuthor, minutesAgo: number, content: string];

type InboxSeed = {
  contact: Omit<Contact, "workspaceId">;
  conversation: Omit<Conversation, "workspaceId" | "contactId" | "lastMessageAt" | "lastInboundAt">;
  script: ScriptLine[];
};

const buildSeeds = (minutesAgo: (minutes: number) => string): InboxSeed[] => [
  {
    contact: {
      id: "ct-01",
      name: "Mariana Alves",
      phoneE164: "+5511900000001",
      city: "São Paulo, SP",
      tags: ["cozinha", "orçamento"],
      optIn: true,
      createdAt: minutesAgo(60 * 24 * 3),
    },
    conversation: {
      id: "cv-01",
      status: "open",
      assignee: "ai",
      unreadCount: 0,
      leadStage: "Qualificação",
    },
    script: [
      ["contact", 42, "Oi! Vocês fazem cozinha planejada sob medida?"],
      [
        "ai",
        41,
        "Olá, Mariana! Fazemos sim. Para eu adiantar seu orçamento: qual é o tamanho aproximado da cozinha e qual estilo você procura?",
      ],
      ["contact", 35, "Tem uns 3 x 4 metros. Queria algo moderno, branco com madeira."],
      [
        "ai",
        34,
        "Ótima combinação! Posso agendar uma visita técnica gratuita para medição. Você prefere manhã ou tarde?",
      ],
      ["contact", 6, "Tarde, de preferência quinta-feira."],
      [
        "ai",
        5,
        "Perfeito. Tenho quinta-feira às 14h ou às 16h. Qual horário fica melhor para você?",
      ],
    ],
  },
  {
    contact: {
      id: "ct-02",
      name: "Rafael Souza",
      phoneE164: "+5511900000002",
      city: "Guarulhos, SP",
      tags: ["dormitório"],
      optIn: true,
      createdAt: minutesAgo(60 * 24 * 12),
    },
    conversation: {
      id: "cv-02",
      status: "pending",
      assignee: "human",
      unreadCount: 2,
      leadStage: "Proposta enviada",
      handoffReason: "O contato pediu para falar com um atendente.",
    },
    script: [
      ["contact", 58, "Boa tarde. Recebi a proposta do guarda-roupa, mas queria negociar o valor."],
      [
        "ai",
        57,
        "Boa tarde, Rafael! Posso explicar os itens da proposta. Sobre condições comerciais, prefere que eu chame alguém da equipe?",
      ],
      ["contact", 55, "Prefiro falar com uma pessoa, por favor."],
      [
        "ai",
        55,
        "Claro! Já transferi sua conversa para a nossa equipe comercial. Em instantes alguém vai te responder.",
      ],
      ["contact", 18, "Ainda estou aguardando."],
      ["contact", 9, "Alguém disponível?"],
    ],
  },
  {
    contact: {
      id: "ct-03",
      name: "Juliana Costa",
      phoneE164: "+5511900000003",
      city: "Osasco, SP",
      tags: ["pós-venda", "entrega"],
      optIn: true,
      createdAt: minutesAgo(60 * 24 * 40),
    },
    conversation: {
      id: "cv-03",
      status: "pending",
      assignee: "human",
      unreadCount: 1,
      leadStage: "Fechado",
      handoffReason: "Reclamação sobre prazo de entrega (assunto sensível).",
    },
    script: [
      [
        "contact",
        96,
        "A montagem do meu painel de TV estava marcada para hoje e ninguém apareceu. Estou muito chateada.",
      ],
      [
        "ai",
        95,
        "Juliana, sinto muito pelo transtorno. Vou encaminhar agora para a equipe de pós-venda, que tem acesso à agenda de montagem.",
      ],
      ["contact", 31, "Preciso de uma posição ainda hoje."],
    ],
  },
  {
    contact: {
      id: "ct-04",
      name: "Pedro Henrique Lima",
      phoneE164: "+5511900000004",
      city: "São Paulo, SP",
      tags: ["showroom"],
      optIn: true,
      createdAt: minutesAgo(60 * 5),
    },
    conversation: {
      id: "cv-04",
      status: "resolved",
      assignee: "ai",
      unreadCount: 0,
    },
    script: [
      ["contact", 190, "Qual o horário do showroom no sábado?"],
      [
        "ai",
        190,
        "Olá, Pedro! No sábado o showroom abre das 9h às 14h. Fica na Av. Exemplo, 1000 (endereço fictício).",
      ],
      ["contact", 185, "Valeu!"],
      ["ai", 185, "Por nada! Se quiser, posso agendar um horário com um projetista."],
    ],
  },
  {
    contact: {
      id: "ct-05",
      name: "Camila Rocha",
      phoneE164: "+5511900000005",
      city: "Santo André, SP",
      tags: ["home office"],
      optIn: true,
      createdAt: minutesAgo(60 * 24),
    },
    conversation: {
      id: "cv-05",
      status: "open",
      assignee: "ai",
      unreadCount: 1,
      leadStage: "Novo lead",
    },
    script: [
      ["contact", 15, "Olá, vocês fazem escrivaninha planejada para home office?"],
      [
        "ai",
        14,
        "Olá, Camila! Fazemos sim, com opções de nichos e gaveteiros. Você já tem as medidas do espaço?",
      ],
      ["contact", 2, "Tenho sim, 1,80 m de largura."],
    ],
  },
  {
    contact: {
      id: "ct-06",
      name: "Lucas Martins",
      phoneE164: "+5511900000006",
      city: "Barueri, SP",
      tags: ["orçamento"],
      optIn: true,
      createdAt: minutesAgo(60 * 24 * 6),
    },
    conversation: {
      id: "cv-06",
      status: "open",
      assignee: "human",
      assignedUserName: "Bruna",
      unreadCount: 0,
      leadStage: "Proposta enviada",
    },
    script: [
      ["contact", 60 * 31, "Vou analisar a proposta com minha esposa e retorno."],
      ["user", 60 * 30, "Combinado, Lucas! Qualquer dúvida sobre os acabamentos, é só chamar."],
    ],
  },
  {
    contact: {
      id: "ct-07",
      name: "Fernanda Ribeiro",
      phoneE164: "+5511900000007",
      city: "São Paulo, SP",
      tags: ["pagamento"],
      optIn: true,
      createdAt: minutesAgo(60 * 24 * 2),
    },
    conversation: {
      id: "cv-07",
      status: "open",
      assignee: "human",
      assignedUserName: "Bruna",
      unreadCount: 0,
      leadStage: "Negociação",
      handoffReason: "Dúvida sobre condições de pagamento.",
    },
    script: [
      ["contact", 130, "Vocês parcelam no cartão?"],
      [
        "ai",
        129,
        "Fernanda, para condições de pagamento vou te passar para a nossa consultora, que consegue simular as opções.",
      ],
      [
        "user",
        110,
        "Oi, Fernanda! Aqui é a Bruna. Parcelamos em até 10x sem juros no cartão. Quer que eu simule para o valor da sua proposta?",
      ],
      ["contact", 104, "Quero sim!"],
      ["user", 100, "Enviei a simulação no seu e-mail. Fico no aguardo!"],
    ],
  },
  {
    contact: {
      id: "ct-08",
      name: "Thiago Nunes",
      phoneE164: "+5511900000008",
      city: "São Caetano do Sul, SP",
      tags: ["garantia"],
      optIn: true,
      createdAt: minutesAgo(60 * 24 * 90),
    },
    conversation: {
      id: "cv-08",
      status: "resolved",
      assignee: "human",
      assignedUserName: "Diego",
      unreadCount: 0,
      leadStage: "Fechado",
    },
    script: [
      ["contact", 60 * 26, "Uma dobradiça do armário soltou. Está na garantia?"],
      ["user", 60 * 25, "Olá, Thiago! Está sim. Agendei a assistência para amanhã às 10h."],
      ["contact", 60 * 25 - 5, "Perfeito, obrigado!"],
    ],
  },
];

export type DemoInbox = {
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
};

/** Monta a caixa de entrada de demonstração com horários relativos a `now`. */
export function buildDemoInbox(now: number): DemoInbox {
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  const seeds = buildSeeds(minutesAgo);

  const buildMessages = (conversationId: string, script: ScriptLine[]): Message[] =>
    script.map(([author, ago, content], index) => ({
      id: `${conversationId}-m${index + 1}`,
      conversationId,
      direction: author === "contact" ? "inbound" : "outbound",
      author,
      content,
      deliveryStatus: author === "contact" ? undefined : "read",
      createdAt: minutesAgo(ago),
    }));

  const contacts = seeds.map(({ contact }) => ({ ...contact, workspaceId: DEMO_WORKSPACE_ID }));
  const messages = seeds.flatMap(({ conversation, script }) =>
    buildMessages(conversation.id, script),
  );
  const conversations = seeds.map(({ contact, conversation, script }): Conversation => {
    const own = buildMessages(conversation.id, script);
    const lastInbound = own.findLast((message) => message.direction === "inbound");
    return {
      ...conversation,
      workspaceId: DEMO_WORKSPACE_ID,
      contactId: contact.id,
      lastMessageAt: own[own.length - 1].createdAt,
      lastInboundAt: (lastInbound ?? own[0]).createdAt,
    };
  });

  return { contacts, conversations, messages };
}
