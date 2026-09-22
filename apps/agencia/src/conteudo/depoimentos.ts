/**
 * **As avaliações, e as redes.**
 *
 * ### A lista está vazia, e isso é o conteúdo
 *
 * [DEPOIMENTOS] é `[]` porque nenhuma avaliação real chegou — e não há entrada de exemplo aqui **de propósito**.
 * Depoimento inventado é a peça de conteúdo falso mais fácil de deixar passar: ele tem nome de gente, cidade de
 * verdade, e ninguém no code review pergunta se aquela pessoa existe. Com a lista vazia, a página desenha
 * [MOLDES_DA_VITRINE] moldes em branco — a forma fica demonstrável e o texto falso **não existe no
 * repositório**, então não tem como ir a produção.
 *
 * ### Não há formulário de avaliação nesta fase
 *
 * Coletar avaliação é **escrever dado**, e escrita pública cai na mesma fronteira do totem: Rules, App Check e
 * a revisão de segurança do passo 9 ([ADR-0002]). A Fase 1 sai com a vitrine; o formulário entra depois do
 * totem, reaproveitando a fronteira que já terá sido montada e revisada, em vez de abrir uma segunda.
 */
import type { SlugIcone } from '@naveg/design-system'

export interface Depoimento {
  readonly id: string
  readonly autor: string
  readonly cidade: string
  /** Qual travessia a pessoa fez — é o que dá contexto à nota. */
  readonly travessia: string
  /** De 1 a [NOTA_MAXIMA]. */
  readonly nota: number
  readonly texto: string
}

export const NOTA_MAXIMA = 5

/** Vazia até chegar avaliação de verdade. Ver a nota do cabeçalho. */
export const DEPOIMENTOS: readonly Depoimento[] = []

/** Quantos moldes em branco a vitrine desenha enquanto não há depoimento. */
export const MOLDES_DA_VITRINE = 3

export interface Rede {
  readonly id: string
  readonly nome: string
  readonly icone: SlugIcone
  /** `null` enquanto o endereço não chega. */
  readonly url: string | null
  /** O arroba, como se exibe. `null` junto com a [url]. */
  readonly perfil: string | null
  /**
   * O domínio que a [url] **tem** de ter.
   *
   * Existe para um cenário: um link de rede social colado errado leva a página institucional da empresa para o
   * perfil de outra pessoa, e ninguém confere clicando. Aqui o build confere.
   */
  readonly dominio: string
}

/**
 * As redes da Meta.
 *
 * O WhatsApp não está aqui — ele é **canal de atendimento**, não vitrine, e já tem o lugar dele na seção de
 * atendimento, com botão próprio e mensagem pronta. Repeti-lo como ícone social daria dois caminhos para a
 * mesma conversa, um deles sem contexto nenhum.
 */
export const REDES: readonly Rede[] = [
  {
    id: 'instagram',
    nome: 'Instagram',
    icone: 'instagram',
    url: null,
    perfil: null,
    dominio: 'instagram.com',
  },
  {
    id: 'facebook',
    nome: 'Facebook',
    icone: 'facebook',
    url: null,
    perfil: null,
    dominio: 'facebook.com',
  },
]

export const CHAMADA_DAS_REDES = 'Acompanhe as saídas, os avisos de maré e as novidades da frota.'
