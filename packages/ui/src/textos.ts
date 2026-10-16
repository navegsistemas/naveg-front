/**
 * **O que o totem diz** — as perguntas de cada passo e o que cada pendência significa para quem reserva.
 *
 * São `Record` sobre as uniões do domínio, e não `switch` com `default`: um passo ou uma pendência nova no
 * domínio faz este arquivo deixar de compilar até alguém escrever o texto dela. É o mesmo "o compilador como
 * lista de tarefas" do `casoImpossivel`, do lado da tela.
 *
 * O texto é de tela, e a tela é de quem **não** trabalha no rio: nenhuma sigla interna, nenhum nome de enum.
 */
import type { MotivoDaFalha, PassoDaReserva, PendenciaDaReserva } from '@navegsistemas/domain'

export interface TextoDoPasso {
  readonly pergunta: string
  /** Uma linha de apoio, quando a pergunta sozinha deixaria dúvida. */
  readonly ajuda?: string
}

export const TEXTO_DO_PASSO: Readonly<Record<PassoDaReserva, TextoDoPasso>> = {
  CATEGORIA: { pergunta: 'O que vai embarcar?' },
  EMBARQUE: { pergunta: 'O que vai embarcar?' },
  PORTE_DO_VEICULO: { pergunta: 'Leve ou pesado?' },
  ACOMODACAO: { pergunta: 'Onde você quer viajar?' },
  TIPO_TARIFARIO: {
    pergunta: 'Qual o tipo da passagem?',
    ajuda: 'Meia e gratuidade são conferidas no atendimento, com o documento de quem viaja.',
  },
  TIPO_GRATUIDADE: { pergunta: 'Qual gratuidade?' },
  QUANTIDADE_PESSOAS: { pergunta: 'Quantas pessoas?' },
  NATUREZA_VEICULO: { pergunta: 'Que tipo de veículo?' },
  CLASSE_VEICULO: { pergunta: 'Qual deles?' },
  CILINDRADA: { pergunta: 'Qual a cilindrada da moto?', ajuda: 'Ela define a faixa da tarifa.' },
  CLIENTE: {
    pergunta: 'Em nome de quem fica a reserva?',
    ajuda: 'O telefone é opcional: ao final, você fala com o atendimento pelo WhatsApp.',
  },
  TIPO_VOLUME: { pergunta: 'O que vai mandar?' },
  QUANTIDADE_VOLUMES: { pergunta: 'Quantos volumes?', ajuda: 'Até 20 volumes. Mais do que isso, fale com o atendimento.' },
  FAIXA_PESO: {
    pergunta: 'Quanto pesa, mais ou menos?',
    ajuda: 'Todos os volumes juntos. No porto a encomenda é pesada, e vale o peso da balança.',
  },
  DESTINATARIO: {
    pergunta: 'Quem recebe no destino?',
    ajuda: 'Opcional. Se outra pessoa vai buscar no porto, deixe o nome e o celular dela.',
  },
  CONFERENCIA: { pergunta: 'Confira a reserva' },
}

/**
 * **Quem manda, na encomenda do site** (2.7, decisão F): o celular é obrigatório, e a ajuda diz por quê. É o nó do
 * cliente com `telefoneObrigatorio`.
 */
export const TEXTO_DE_QUEM_MANDA: TextoDoPasso = {
  pergunta: 'Quem está mandando?',
  ajuda: 'É pelo celular que o atendimento fala com você e avisa quando a encomenda chegar.',
}

/**
 * **Por que os dias tracejados não abrem**, e o que fazer: a nota embaixo do calendário. Na encomenda, que se reserva na
 * semana (fluviapp-kmp#44), é a linha da decisão E (2.7), com o link do WhatsApp no lugar de "fale com o atendimento".
 */
export interface TextoDosTracejados {
  readonly porque: string
  /** O começo da frase que leva ao atendimento: "Para viajar nesses dias". */
  readonly paraQue: string
}

export const TRACEJADOS_DA_RESERVA: TextoDosTracejados = {
  porque: 'Os dias tracejados ainda não abrem para reserva pelo site.',
  paraQue: 'Para viajar nesses dias',
}

export const TRACEJADOS_DA_ENCOMENDA: TextoDosTracejados = {
  porque: 'A encomenda se reserva para os próximos 7 dias.',
  paraQue: 'Para mais adiante',
}

/** Sem o destinatário, quem retira fica para o atendimento (2.7, decisão G, texto do PO). */
export const RETIRADA_A_COMBINAR =
  'No destino, a encomenda é retirada no porto com documento. Quem vai buscar, você combina com o atendimento.'

/**
 * **O que muda no site** (naveg-front#65): ele pergunta quantos viajam antes da acomodação, e a acomodação é a do grupo
 * todo (UI 2.2, decisões I e J). O quiosque segue com `TEXTO_DO_PASSO`.
 */
export const TEXTO_DO_PASSO_NO_SITE: Readonly<Partial<Record<PassoDaReserva, TextoDoPasso>>> = {
  /* O celular é obrigatório no site (2.3, A), e a ajuda diz para que serve (B). */
  CLIENTE: {
    pergunta: 'Em nome de quem fica a reserva?',
    ajuda: 'É pelo WhatsApp deste celular que o atendimento confirma a reserva com você.',
  },
  QUANTIDADE_PESSOAS: { pergunta: 'Quantos viajam?' },
  CLASSE_VEICULO: { pergunta: 'Qual?' },
  ACOMODACAO: {
    pergunta: 'Onde vocês querem viajar?',
    ajuda: 'Escolha uma para o grupo. Se não couber todo mundo, o atendimento divide.',
  },
}

export const TEXTO_DA_PENDENCIA: Readonly<Record<PendenciaDaReserva, string>> = {
  CODIGO: 'Não foi possível gerar o código da reserva. Tente de novo.',
  CLIENTE_NOME: 'Informe o nome de quem faz a reserva.',
  CLIENTE_TELEFONE: 'O telefone precisa ser um celular com DDD, como (91) 98888-7777 — ou fique em branco.',
  TIPO_NAO_ADMITIDO: 'Este tipo de passagem não vale para esta acomodação.',
  GRATUIDADE_AUSENTE: 'Escolha qual é a gratuidade.',
  GRATUIDADE_INDEVIDA: 'A gratuidade escolhida não vale para este tipo de passagem.',
  QUANTIDADE: 'Uma reserva vai de 1 a 50 pessoas. Mais do que isso, fale com o atendimento.',
  CILINDRADA: 'Informe a cilindrada da moto.',
  /* 2.6, D (PO, 2026-10-16): o 409 é a saída que partiu ou foi suspensa — a frase diz só o que vale nos dois. */
  VALIDADE: 'Esta saída não está mais aberta para reserva. Ela partiu, ou foi suspensa. O resto da reserva continua aqui.',
  CONVERSAO: 'Esta reserva não pode ser enviada.',
  CLIENTE_TELEFONE_AUSENTE: 'Deixe o celular com DDD: é por ele que o atendimento fala com você e avisa quando a encomenda chegar.',
  DESTINATARIO_AUSENTE: 'Informe quem retira a encomenda no destino.',
  DESTINATARIO_INDEVIDO: 'Você mesmo retira esta encomenda: ela não leva destinatário.',
  DESTINATARIO_NOME: 'Informe o nome de quem retira a encomenda.',
  DESTINATARIO_TELEFONE: 'O celular de quem retira precisa ter DDD, como (96) 98888-7777.',
  VOLUMES: 'Uma encomenda vai de 1 a 20 volumes. Mais do que isso, fale com o atendimento.',
  COMPLEMENTO: 'O complemento cabe em 60 caracteres.',
}

/** O aviso que acompanha o totem inteiro. */
export const AVISO_RESERVA_NAO_VENDA =
  'Isto é uma reserva, não uma venda: nada é pago aqui. O atendimento confirma a passagem com você pelo ' +
  'WhatsApp, e a reserva vale até a saída do barco.'

/**
 * **Quando o envio falha** (2.6, A, PO, 2026-10-16): uma frase por motivo, num quadro acima do botão, que vira "Tentar de
 * novo". A saída pelo WhatsApp, quando há, vem da tela: no quiosque ela não serve.
 */
export const FALHA_DO_ENVIO: Readonly<Record<MotivoDaFalha, string>> = {
  CONEXAO:
    'A reserva não foi enviada. A internet pode ter caído, ou o sistema está fora do ar por um instante. O que você escolheu continua aqui.',
  LIMITE: 'Muitas reservas deste aparelho em pouco tempo. Tente de novo daqui a alguns minutos.',
  DESAFIO: 'A verificação contra robô não passou. Atualize a página e tente de novo.',
}

/** Na encomenda, a saída fechada pode ser também a semana que passou (2.6, D). */
export const VALIDADE_DA_ENCOMENDA =
  'Esta saída não está mais aberta para encomenda: ela partiu, foi suspensa, ou passou dos próximos 7 dias.'

/** As saídas que não carregam (2.6, C). */
export const CATALOGO_NAO_CARREGOU = 'As saídas não carregaram. Pode ser a internet. O que você escolheu continua aqui.'
