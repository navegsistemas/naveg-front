/**
 * **O que a capa afirma.**
 *
 * A travessia está no título, e é o filtro: quem não vai a Macapá descobre isso na primeira linha. As
 * credenciais vêm depois, e respondem às três perguntas seguintes de quem ficou — com que frequência, há quanto
 * tempo, e com o quê.
 *
 * A primeira credencial já foi "Belém ⇄ Macapá", e repetia o título logo acima (achado 4 da ficha 1.2, no
 * roteiro de UI/UX). Deu lugar a um fato novo: a saída diária.
 */
import type { SlugIcone } from '@navegsistemas/design-system'
import { linkDeWhatsApp } from '@navegsistemas/domain'

import { ATENDIMENTO, WHATSAPP_DAS_RESERVAS } from './atendimento'
import { EMBARCACOES, type Embarcacao } from './embarcacoes'

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

/**
 * **A embarcação cuja foto é o fundo da capa.** Escolha do PO (2026-10-08): a foto do Maria Ivanir no pôr do
 * sol. Sem foto, a capa volta ao fundo liso — e o texto, que é o que importa, não muda.
 */
const ID_DA_FOTO_DA_CAPA = 'maria-ivanir'

const daFoto: Embarcacao | undefined = EMBARCACOES.find((embarcacao) => embarcacao.id === ID_DA_FOTO_DA_CAPA)

export const CAPA = {
  titulo: 'Belém ⇄ Macapá, com reserva em um minuto',
  /* Duas ou três linhas no celular (decisão E da 1.2). Os 15 anos e os três ferry boats saíram daqui porque as
     credenciais logo abaixo já os dizem. */
  lead: 'Reserve sua passagem ou mande sua encomenda por aqui, e o atendimento da NAVEG cuida do resto.',

  foto: daFoto?.imagem ?? null,

  acaoPrimaria: { rotulo: 'Reservar passagem', href: '#totem' } satisfies Acao,
  /** A segunda porta, para quem quer mandar uma caixa e não comprar passagem (§3.1 do plano). */
  acaoDaEncomenda: { rotulo: 'Enviar encomenda', href: '#encomendas' } satisfies Acao,
  /**
   * **O WhatsApp, direto** (decisões B e C da 1.2). Era um botão que rolava até os atendentes, porque o número
   * estava pendente; o número chegou, e o desvio perdeu o motivo. É link, e não botão: dois botões de mesmo peso
   * já disputam a atenção, e um terceiro empilhado tomava um terço da tela do celular.
   *
   * `null` se o número sair do cadastro: a capa fica sem o link, em vez de um link que não abre nada.
   */
  acaoDoWhatsapp:
    WHATSAPP_DAS_RESERVAS === null
      ? null
      : ({
          rotulo: 'Falar no WhatsApp',
          href: linkDeWhatsApp(WHATSAPP_DAS_RESERVAS, ATENDIMENTO.mensagemInicial),
        } satisfies Acao),

  credenciais: [
    {
      icone: 'relogio',
      valor: 'Saída todos os dias',
      rotulo: 'Nos dois sentidos da travessia',
    },
    {
      icone: 'estrela',
      valor: '15 anos',
      rotulo: 'De operação entre o Pará e o Amapá',
    },
    {
      icone: 'barco',
      valor: '3 ferry boats',
      rotulo: 'Para passageiros, veículos e encomendas',
    },
  ] satisfies readonly Credencial[],
} as const
