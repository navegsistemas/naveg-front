/**
 * **O atendimento** — o argumento e quem o cumpre.
 *
 * A seção vende uma coisa só: *do outro lado tem gente que conhece a operação*. Ela existe porque o totem, por
 * melhor que fique, responde a perguntas fechadas — e a travessia tem as abertas, que é onde uma pessoa ganha
 * de um formulário.
 *
 * ### Um atendente hoje, e a lista já é lista
 *
 * A NAVEG opera com um canal de atendimento. [ATENDENTES] podia ser um objeto só, e não é: a grade é
 * `auto-fit`, os cenários percorrem a lista, e acrescentar o segundo é **uma entrada** — não uma refatoração
 * de componente no dia em que o time crescer.
 *
 * ### O que não está aqui, e por quê
 *
 * **Agência.** Com uma só, o campo diria "NAVEG" em todo cartão — informação que não distingue nada gasta a
 * atenção de quem lê. Ele volta quando houver a segunda, e aí passa a distinguir.
 *
 * **Nome e foto.** Ainda não chegaram, e o cartão desenha o **wireframe** no lugar, como a vitrine faz com as
 * fotos das embarcações. É melhor que um nome inventado: nome de mentira numa página institucional é o tipo de
 * coisa que vai para produção porque parecia pronta.
 */
import type { SlugIcone } from '@naveg/design-system'

export interface PontoDoAtendimento {
  readonly icone: SlugIcone
  readonly titulo: string
  readonly texto: string
}

export interface Atendente {
  readonly id: string
  /** `null` enquanto não informado — o cartão desenha o lugar dele. */
  readonly nome: string | null
  readonly funcao: string
  readonly horario: string
  /**
   * Como as pessoas escrevem, com parêntese e traço. Quem normaliza é `normalizarTelefone`, e um número
   * malformado **quebra o build** em vez de virar um link que não abre.
   *
   * `null` enquanto o número não chega.
   */
  readonly whatsapp: string | null
  /** Arquivo em `public/atendentes/`. `null` = wireframe. */
  readonly foto: string | null
  readonly alt: string | null
}

export const ATENDIMENTO = {
  pontos: [
    {
      icone: 'pessoa',
      titulo: 'Quem responde conhece a travessia',
      texto:
        'Não é robô nem central terceirizada. É atendente da NAVEG, que sabe o que cabe em cada ferry boat, ' +
        'como funcionam rede, suíte e camarote, e o que muda quando se embarca um veículo.',
    },
    {
      icone: 'relogio',
      titulo: '24 horas, todos os dias',
      texto:
        'A travessia entre Belém e Macapá não tem horário comercial, e quem precisa remarcar às três da ' +
        'manhã também não. O atendimento acompanha a operação.',
    },
    {
      icone: 'reserva',
      titulo: 'A reserva chega pronta',
      texto:
        'Quem reserva pelo totem manda o código junto com a primeira mensagem. O atendente abre a reserva ' +
        'direto no aplicativo, confere os dados e emite — sem repetir nada do que já foi preenchido.',
    },
  ] satisfies readonly PontoDoAtendimento[],

  /** A mensagem que o botão já deixa escrita. Curta: quem abre a conversa vai completar com o caso dele. */
  mensagemInicial:
    'Olá! Vim pelo site da NAVEG e gostaria de informações sobre a travessia Belém ⇄ Macapá.',
} as const

export const ATENDENTES: readonly Atendente[] = [
  {
    id: 'atendimento-naveg',
    nome: null,
    funcao: 'Atendente',
    horario: '24 horas, todos os dias',
    whatsapp: null,
    foto: null,
    alt: null,
  },
]

/** O que o cartão mostra enquanto o nome não chega. */
export const NOME_PROVISORIO = 'Atendimento NAVEG'
