/**
 * **O que o totem diz** — as perguntas de cada passo e o que cada pendência significa para quem reserva.
 *
 * São `Record` sobre as uniões do domínio, e não `switch` com `default`: um passo ou uma pendência nova no
 * domínio faz este arquivo deixar de compilar até alguém escrever o texto dela. É o mesmo "o compilador como
 * lista de tarefas" do `casoImpossivel`, do lado da tela.
 *
 * O texto é de tela, e a tela é de quem **não** trabalha no rio: nenhuma sigla interna, nenhum nome de enum.
 */
import type { PassoDaEncomenda, PassoDaReserva, PendenciaDaReserva } from '@navegsistemas/domain'

export interface TextoDoPasso {
  readonly pergunta: string
  /** Uma linha de apoio, quando a pergunta sozinha deixaria dúvida. */
  readonly ajuda?: string
}

export const TEXTO_DO_PASSO: Readonly<Record<PassoDaReserva, TextoDoPasso>> = {
  CATEGORIA: { pergunta: 'O que vai embarcar?' },
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
  CONFERENCIA: { pergunta: 'Confira a reserva' },
}

export const TEXTO_DA_PENDENCIA: Readonly<Record<PendenciaDaReserva, string>> = {
  CODIGO: 'Não foi possível gerar o código da reserva. Tente de novo.',
  CLIENTE_NOME: 'Informe o nome de quem faz a reserva.',
  CLIENTE_TELEFONE: 'O telefone precisa ser um celular com DDD, como (91) 98888-7777 — ou fique em branco.',
  TIPO_NAO_ADMITIDO: 'Este tipo de passagem não vale para esta acomodação.',
  GRATUIDADE_AUSENTE: 'Escolha qual é a gratuidade.',
  GRATUIDADE_INDEVIDA: 'A gratuidade escolhida não vale para este tipo de passagem.',
  QUANTIDADE: 'Essa quantidade de pessoas não cabe nesta acomodação.',
  CILINDRADA: 'Informe a cilindrada da moto.',
  VALIDADE: 'Esta saída já partiu. Escolha outra travessia.',
  CONVERSAO: 'Esta reserva não pode ser enviada.',
  CLIENTE_TELEFONE_AUSENTE: 'Quem manda e retira precisa deixar o celular com DDD: é por ele que o destino avisa.',
  DESTINATARIO_AUSENTE: 'Informe quem retira a encomenda no destino.',
  DESTINATARIO_INDEVIDO: 'Você mesmo retira esta encomenda: ela não leva destinatário.',
  DESTINATARIO_NOME: 'Informe o nome de quem retira a encomenda.',
  DESTINATARIO_TELEFONE: 'O celular de quem retira precisa ter DDD, como (96) 98888-7777.',
  VOLUMES: 'Uma encomenda vai de 1 a 20 volumes. Mais do que isso, fale com o atendimento.',
  COMPLEMENTO: 'O complemento cabe em 60 caracteres.',
}

/** As perguntas da seção "Envie sua encomenda" — `docs/plano-da-reserva-de-encomenda.md`, §3.2. */
export const TEXTO_DO_PASSO_DA_ENCOMENDA: Readonly<Record<PassoDaEncomenda, TextoDoPasso>> = {
  VOLUMES: { pergunta: 'O que vai mandar?', ajuda: 'Até 20 volumes. Mais do que isso, fale com o atendimento.' },
  PESO: {
    pergunta: 'Quanto pesa, mais ou menos?',
    ajuda: 'Todos os volumes juntos. No porto a encomenda é pesada, e vale o peso da balança.',
  },
  RETIRADA: { pergunta: 'Quem retira no destino?' },
  DESTINATARIO: {
    pergunta: 'Para quem vai?',
    ajuda: 'O celular é obrigatório: é por ele que o destino avisa que a encomenda chegou.',
  },
  REMETENTE: { pergunta: 'Quem está mandando?' },
  CONFERENCIA: { pergunta: 'Confira a encomenda' },
}

/** A ajuda do passo de quem manda muda com quem retira (C12): é o celular que passa a ser obrigatório. */
export const AJUDA_DO_REMETENTE = {
  retira: 'Você retira no destino, então o celular é obrigatório: é por ele que o destino avisa que a encomenda chegou.',
  naoRetira: 'O celular é opcional: ao final, você fala com o atendimento pelo WhatsApp.',
} as const

/** O aviso que acompanha o totem inteiro. */
export const AVISO_RESERVA_NAO_VENDA =
  'Isto é uma reserva, não uma venda: nada é pago aqui. O atendimento confirma a passagem com você pelo ' +
  'WhatsApp, e a reserva vale até a saída do barco.'

/** O aviso que acompanha a seção de encomenda. */
export const AVISO_ENCOMENDA_NAO_VENDA =
  'Isto é uma reserva, não uma venda: nada é pago aqui. O atendimento confirma com você pelo WhatsApp; no ' +
  'porto, a encomenda é pesada, o frete é cobrado, e ela é entregue antes da partida.'
