// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DA LOJA — edite aqui nome, preço, variantes,
// imagens e textos. Todo o site (loja e checkout) lê deste arquivo.
// Chaves de gateway, pixels e tokens ficam no painel /admin.
// ─────────────────────────────────────────────────────────────

import { FREE_SHIPPING_TEXT } from "@/lib/shipping";

export const store = {
  name: "RECOVR",
  showLogo: false, // mostra o nome acima como logo no cabeçalho e no rodapé
  tagline: "Recovery wear",
  /** Nome genérico enviado ao gateway (aparece na cobrança) — sem detalhes do produto real. */
  gatewayName: "Recovery Slide",
  // WhatsApp de suporte (DDI + DDD + número). O botão só aparece se for ativado no /admin.
  whatsapp: "", // ex.: '5511999999999'
  instagram: "", // ex.: 'https://instagram.com/sualoja'
  email: "", // ex.: 'contato@sualoja.com.br'
  cnpj: "", // ex.: '00.000.000/0001-00'
  city: "São Paulo, SP — Brasil",
  // `card: true` = só aparece quando o cartão estiver ativo no /admin.
  announcements: [
    { text: "Kit 2 pares por R$ 267" },
    { text: FREE_SHIPPING_TEXT },
    { text: "12x sem juros no cartão", card: true },
    { text: "5% de desconto no Pix", card: true },
    { text: "Troca fácil em até 7 dias" },
  ] as { text: string; card?: boolean }[],
};

const NIKE_PDP = (id: string, preset = "t_web_pdp_936_v2") =>
  `https://static.nike.com/a/images/${preset}/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/${id}/Nike+Air+Zoom+Hyperslide.png`;

const NIKE_EDITORIAL = (id: string, size: string) =>
  `https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/${size},c_limit/${id}/nike-air-zoom-hyperslide-the-nike-x-hyperice-recovery-slide-explained.jpg`;

export type ProductImage = { src: string; thumb: string; alt: string };
type Gallery = [ProductImage, ...ProductImage[]];

const gallery = (ids: [string, ...string[]], colorName: string): Gallery =>
  ids.map((id, i) => ({
    src: NIKE_PDP(id),
    thumb: NIKE_PDP(id, "t_PDP_144_v1"),
    alt: `Nike Air Zoom Hyperslide ${colorName} — foto ${i + 1}`,
  })) as Gallery;

export type ColorVariant = {
  id: string;
  name: string;
  style: string;
  swatch: string;
  images: Gallery;
  // Vídeo turntable 360° em loop (pasta public/videos). Sem vídeo, mostra a foto.
  spin360?: string;
};

export type SizeVariant = {
  br: string;
  usM: string;
  usW: string;
  cm: string;
};

export const sizes: SizeVariant[] = [
  { br: "35", usM: "4", usW: "5", cm: "22" },
  { br: "36", usM: "5", usW: "6", cm: "23" },
  { br: "37", usM: "6", usW: "7", cm: "24" },
  { br: "38", usM: "7", usW: "8", cm: "25" },
  { br: "39/40", usM: "8", usW: "9", cm: "26" },
  { br: "41", usM: "9", usW: "10", cm: "27" },
  { br: "42", usM: "10", usW: "11", cm: "28" },
  { br: "43", usM: "11", usW: "12", cm: "29" },
  { br: "44", usM: "12", usW: "13", cm: "30" },
  { br: "45", usM: "13", usW: "14", cm: "31" },
  { br: "46", usM: "14", usW: "15", cm: "32" },
  { br: "47", usM: "15", usW: "16", cm: "33" },
  { br: "48", usM: "16", usW: "17", cm: "34" },
];

export const colors: ColorVariant[] = [
  {
    id: "preto",
    name: "Preto",
    style: "66000-001",
    swatch: "#151515",
    images: gallery(
      [
        "0fdb1ba8-0699-4b16-aeb7-e808533a0018",
        "092efcd5-ac04-4419-8fb0-8d66f0126f4e",
        "07ebefb3-843a-4061-975b-25d9df86c1bd",
        "ea5e78ca-db46-4d28-ba22-f7f828e6a789",
        "3b723994-0523-4ea5-b7e3-791b8baf7615",
        "d2c04604-5e56-41ab-b4ea-5c78081c81e7",
        "1ac537f9-2048-4965-bab8-6ba6fc2987b1",
      ],
      "Preto",
    ),
    spin360: "/videos/hyperslide-preto-360.mp4",
  },
  {
    id: "orewood",
    name: "Orewood Brown",
    style: "66005-001",
    swatch: "#d8cfc0",
    images: gallery(
      [
        "0007ccc2-f9ee-4027-bf96-12c830ebfc1e",
        "f7f89519-be44-4135-9e2f-d61d6b8a3848",
        "79877fa0-5c18-4619-bf6a-53f4a0233b1f",
        "dbb045c3-2d61-44c7-8382-6ff639fb5f8d",
        "a58eefd6-e56b-485b-9c84-86de67d730b5",
        "6cbd25f6-947b-4f4d-9725-010fdf2eeaea",
        "65ce1a86-0a14-4df0-af69-8411a1f75552",
      ],
      "Orewood Brown",
    ),
    spin360: "/videos/hyperslide-orewood-360.mp4",
  },
];

export const defaultColor = colors[0]!;

// Variantes = cor × tamanho, tudo em um único produto.
// Para marcar um tamanho como esgotado, adicione em `soldOut[corId]`.
export const soldOut: Record<string, string[]> = {
  preto: [],
  orewood: [],
};

export const product = {
  brand: "Nike x Hyperice",
  name: "Nike Air Zoom Hyperslide",
  short: "Hyperslide",
  price: 197,
  compareAtPrice: null as number | null, // ex.: 2199.9 para mostrar "de/por"
  // Parcelas no cartão e desconto do Pix valem quando o cartão está ativo no /admin.
  installments: 12,
  pixDiscount: 0.05,
  description:
    "Feito para a recuperação depois do treino, da viagem, de um dia longo e de tudo o que vem no meio. Calor, vibração e amortecimento responsivo trabalham juntos para você sentir os pés mais leves a cada passo.",
  specs: [
    "Pod magnético removível, encaixado na tira ajustável",
    "3 níveis de calor — até 47 °C",
    "3 intensidades de vibração",
    "Ciclos de recuperação de 15 minutos",
    "Controle direto no pod ou pelo app Hyperice",
    "Amortecimento Nike Air Zoom em todo o comprimento",
    "Pode ser usado com ou sem o pod",
  ],
  shipping: [
    `${FREE_SHIPPING_TEXT} para todo o Brasil.`,
    "Envio em até 2 dias úteis após a confirmação do pagamento.",
    "Troca ou devolução em até 7 dias após o recebimento.",
  ],
};

// Oferta: 2 pares por um preço fechado. O cliente escolhe a cor e a numeração
// de cada par (podem ser iguais ou diferentes).
export const kit = {
  name: "Kit 2 pares",
  short: "Kit 2 pares",
  pairs: 2,
  price: 267,
};

const MIND_IMG = (file: string) => `https://cdn.shopify.com/s/files/1/0828/2846/0285/files/${file}`;

// Oferta do popup ao clicar em comprar: Nike Mind 001 Slide por um preço especial.
// O preço é aplicado no servidor; "de" = preço normal de varejo do modelo (por par).
export const mindSlide = {
  name: "Nike Mind 001 Slide",
  /** Opções do seletor de unidades: preço total por quantidade de pares. */
  offers: [
    { pairs: 1, price: 99 },
    { pairs: 2, price: 149 },
  ],
  compareAtPrice: 1199,
  description:
    "O slide conceitual da Nike: design escultural, conforto imediato e uma presença que não passa despercebida.",
  sizes: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  colors: [
    {
      id: "black-chrome",
      name: "Black Chrome",
      image: MIND_IMG("Slide_Nike_Mind_001_Black_Chrome_Preto.webp?v=1782999745"),
      alt: MIND_IMG(
        "slide-nike-mind-001-black-chrome-preto-lk-hq4307-001-1-7010926.webp?v=1782999746",
      ),
    },
    {
      id: "light-bone",
      name: "Light Bone",
      image: MIND_IMG("Slide_Nike_Mind_001_Light_Bone_Bege.webp?v=1782999742"),
      alt: MIND_IMG(
        "slide-nike-mind-001-light-bone-bege-lk-hq4307-002-1-5695871.webp?v=1782999743",
      ),
    },
    {
      id: "light-smoke-grey",
      name: "Light Smoke Grey",
      image: MIND_IMG("Slide_Nike_Mind_001_Light_Smoke_Grey_Cinza.webp?v=1782999741"),
      alt: MIND_IMG(
        "slide-nike-mind-001-light-smoke-grey-cinza-lk-hq4307-003-1-6709465.webp?v=1782999741",
      ),
    },
    {
      id: "fragment-black",
      name: "Fragment Black",
      image: MIND_IMG("nike-mind-001-slide-fragment-black-1_1.png?v=1782999685"),
      alt: MIND_IMG("nike-mind-001-slide-fragment-black-2.png?v=1782999685"),
    },
    {
      id: "geode-teal",
      name: "Geode Teal",
      image: MIND_IMG("Slide_Nike_Mind_001_Geode_Teal_Verde.webp?v=1782999688"),
      alt: MIND_IMG(
        "slide-nike-mind-001-geode-teal-verde-lk-hq4307-301-37-4152885.webp?v=1782999687",
      ),
    },
    {
      id: "mineral-slate",
      name: "Mineral Slate",
      image: MIND_IMG("Slide_Nike_Mind_001_Mineral_Slate_Verde.webp?v=1782999692"),
      alt: MIND_IMG(
        "slide-nike-mind-001-mineral-slate-verde-lk-hq4307-300-38-3141579.webp?v=1782999692",
      ),
    },
    {
      id: "blackened-blue",
      name: "Blackened Blue",
      image: MIND_IMG("Slide_Nike_Mind_001_Blackened_Blue_Azul.webp?v=1782999667"),
      alt: MIND_IMG(
        "slide-nike-mind-001-blackened-blue-azul-lk-hq4307-400-38-7213335.webp?v=1782999668",
      ),
    },
    {
      id: "pearl-pink",
      name: "Pearl Pink",
      image: MIND_IMG("Slide_Nike_Mind_001_Pearl_Pink_Rosa.webp?v=1782999669"),
      alt: MIND_IMG("Slide_Nike_Mind_001_Pearl_Pink_Rosa.webp?v=1782999669"),
    },
    {
      id: "white-speed-red",
      name: "White Speed Red",
      image: MIND_IMG("Slide_Nike_Mind_001_White_Speed_Red_Branco.webp?v=1782999684"),
      alt: MIND_IMG(
        "slide-nike-mind-001-white-speed-red-branco-lk-hq4307-101-34-7978313.webp?v=1782999684",
      ),
    },
    {
      id: "solar-red",
      name: "Solar Red",
      image: MIND_IMG("Slide_Nike_Mind_001_Solar_Red_Vermelho.webp?v=1782999744"),
      alt: MIND_IMG(
        "slide-nike-mind-001-solar-red-vermelho-lk-hq4307-600-1-5206126.webp?v=1782999744",
      ),
    },
    {
      id: "team-red",
      name: "Team Red",
      image: MIND_IMG("Nikee_Mind_001_Slide_Team_Red_University_Red.webp?v=1782999689"),
      alt: MIND_IMG(
        "slide-nike-mind-001-team-red-vermelho-lk-hq4307-601-3176250.webp?v=1782999689",
      ),
    },
  ],
};

// Upsell pós-compra: meia Nike Everyday Lightweight (pacote com 3 pares), branca e/ou preta.
// O preço é por cor (pacote) e é aplicado no servidor.
export const socks = {
  name: "Meia Nike Everyday Lightweight (3 pares)",
  /** Nome genérico enviado ao gateway. */
  gatewayName: "Meia esportiva",
  price: 19.9,
  description: "Cano invisível, fios macios com tecnologia antissuor para manter o pé seco.",
  colors: [
    { id: "branca", name: "Branca", image: "https://imgnike-a.akamaihd.net/768x768/02382151.jpg" },
    { id: "preta", name: "Preta", image: "https://imgnike-a.akamaihd.net/768x768/023821ID.jpg" },
  ],
  // Tamanhos da Nike com a faixa de numeração BR de cada um.
  sizes: [
    { id: "P", from: 34, to: 38 },
    { id: "M", from: 38, to: 42 },
    { id: "G", from: 42, to: 46 },
    { id: "GG", from: 46, to: 50 },
  ],
};

export const editorial = {
  heroGlow: NIKE_EDITORIAL("0ba4ca4a-0b11-4e29-a0bc-eb92c2ab31e4", "h_2432"),
  pod: NIKE_EDITORIAL("c68c4082-5d78-4788-877e-4a07f8f9b188", "h_1133"),
  sole: NIKE_EDITORIAL("7ceb480a-f559-4081-8b80-6905419becaa", "h_1133"),
  strap: NIKE_EDITORIAL("90908f6f-d55c-468f-867e-0c7e103bcc57", "h_1133"),
  podOnStrap: NIKE_EDITORIAL("23d22c6b-8493-4118-a80d-6685d9c2ed9f", "h_1133"),
  floating: NIKE_EDITORIAL("042a3ce5-aa87-47a8-8918-12b93bdf1307", "w_1824"),
};

export const banners = [
  {
    image: editorial.heroGlow,
    eyebrow: "Calor + massagem",
    title: "Recuperação\nque você calça.",
    text: "O pod Hyperice aquece até 47 °C e massageia o peito do pé em ciclos de 15 minutos.",
    align: "left" as const,
    dark: true,
  },
  {
    image: editorial.floating,
    eyebrow: "Nike Air Zoom",
    title: "Macio de ponta\na ponta.",
    text: "Air Zoom em todo o comprimento para uma pisada macia e responsiva, do pós-treino ao dia a dia.",
    align: "right" as const,
    dark: false,
  },
  {
    image: editorial.pod,
    eyebrow: "Pod magnético",
    title: "Encaixa.\nLiga. Relaxa.",
    text: "Ajuste calor e vibração no próprio pod ou pelo app Hyperice. Sem o pod, é um slide premium.",
    align: "left" as const,
    dark: false,
  },
];

export const stats = [
  { value: 3, suffix: "", label: "níveis de calor" },
  { value: 47, suffix: "°C", label: "temperatura máxima" },
  { value: 3, suffix: "", label: "intensidades de vibração" },
  { value: 15, suffix: "min", label: "por ciclo de recuperação" },
];

export const steps = [
  {
    title: "Encaixe o pod",
    text: "O pod magnético se prende à tira ajustável em segundos.",
  },
  {
    title: "Escolha o nível",
    text: "Três níveis de calor e três de vibração — no botão do pod ou no app Hyperice.",
  },
  {
    title: "Recupere",
    text: "Ciclos de 15 minutos aliviam a tensão e relaxam os pés. Depois, tire o pod e siga o dia.",
  },
];

export const audiences = [
  {
    title: "Atletas",
    text: "Pós-treino e pós-jogo, a recuperação começa assim que você tira o tênis.",
  },
  { title: "Corredores", text: "Calor e vibração para soltar os pés depois dos quilômetros." },
  { title: "Rotina em pé", text: "Para quem passa horas em pé no trabalho ou na rua." },
  { title: "Viagens", text: "Leve, sem fio e com pod removível — cabe na mala e no hotel." },
];

export const faq = [
  {
    q: "O que é o Nike Air Zoom Hyperslide?",
    a: "É um chinelo slide de recuperação criado pela Nike em parceria com a Hyperice. Une amortecimento Nike Air Zoom em todo o comprimento a um pod que aplica calor e vibração no peito do pé.",
  },
  {
    q: "Como o pod funciona?",
    a: "O pod magnético removível fica na tira ajustável. Ele tem 3 níveis de calor (até cerca de 47 °C) e 3 intensidades de vibração, em ciclos de recuperação de 15 minutos.",
  },
  {
    q: "Dá para usar sem o pod?",
    a: "Sim. Sem o pod ele funciona como um slide premium com amortecimento Air Zoom para o dia a dia.",
  },
  {
    q: "Como controlo o calor e a vibração?",
    a: "Direto nos controles do próprio pod ou pelo app Hyperice no celular.",
  },
  {
    q: "É só para atletas?",
    a: "Não. É indicado para qualquer pessoa que passa muito tempo em pé: atletas, corredores, quem viaja muito ou trabalha em pé.",
  },
  {
    q: "Qual tamanho devo escolher?",
    a: "Use o guia de tamanhos na página do produto. Se ficar entre dois números, recomendamos o maior — a tira é ajustável.",
  },
  {
    q: "No kit de 2 pares, posso escolher a cor e o tamanho de cada par?",
    a: "Pode. Você escolhe a cor (Preto ou Orewood Brown) e a numeração de cada par separadamente — dois iguais ou um de cada, como preferir. Ideal para presentear ou dividir.",
  },
  {
    q: "Qual o prazo de entrega e como funciona a troca?",
    a: `Enviamos em até 2 dias úteis após a confirmação do pagamento. ${FREE_SHIPPING_TEXT} em produtos. Você pode trocar ou devolver em até 7 dias após o recebimento.`,
  },
];
