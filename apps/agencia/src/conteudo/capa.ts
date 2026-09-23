/**
 * **O que a capa afirma.**
 *
 * Três coisas, nesta ordem de importância: qual é a travessia, há quanto tempo, e com o quê. É o que responde
 * *"isso aqui serve para mim?"* antes de qualquer botão.
 *
 * A ordem das credenciais não é decorativa — a **rota vem primeiro** porque é o filtro: quem não vai a Macapá
 * não tem o que fazer no resto da página, e descobrir isso no terceiro item seria fazê-lo ler três vezes mais
 * para chegar a um "não".
 */
import type { SlugIcone } from '@navegsistemas/design-system'

export interface Credencial {
  readonly icone: SlugIcone
  /** O número ou o nome, em destaque. */
  readonly valor: string
  /** A linha que explica o destaque. */
  readonly rotulo: string
}

export interface Acao {
  readonly rotulo: string
  readonly href: string
}

export const CAPA = {
  titulo: 'Belém ⇄ Macapá, com reserva em um minuto',
  lead:
    'A NAVEG opera a travessia entre Belém e Macapá há 15 anos, com três ferry boats para passageiros e ' +
    'veículos. Reserve sua passagem por aqui, sem cadastro, e o atendimento emite para você.',

  acaoPrimaria: { rotulo: 'Reservar passagem', href: '#totem' } satisfies Acao,
  /**
   * Aponta para os atendentes, e não para o WhatsApp.
   *
   * O número do atendimento é pendência do passo 10, e um botão que leva a lugar nenhum é pior do que um botão
   * que leva a menos: a seção de atendentes já traz o canal de cada agência quando o passo 4 fechar.
   */
  acaoSecundaria: { rotulo: 'Falar com atendente', href: '#atendentes' } satisfies Acao,

  credenciais: [
    {
      icone: 'local',
      valor: 'Belém ⇄ Macapá',
      rotulo: 'Travessia regular, nos dois sentidos',
    },
    {
      icone: 'relogio',
      valor: '15 anos',
      rotulo: 'De operação entre o Pará e o Amapá',
    },
    {
      icone: 'barco',
      valor: '3 ferry boats',
      rotulo: 'Para passageiros e veículos',
    },
  ] satisfies readonly Credencial[],
} as const
