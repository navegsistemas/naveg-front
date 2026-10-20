/**
 * **O atendimento da conta** — `empresas/{agência}/atendimentosDeConta/{id}` (fluviapp-kmp#71, #73 e #77; ADR-0022 D5).
 *
 * O que a pessoa não resolve sozinha no site, quem atende resolve no painel (PO, 2026-10-16: "anormalidades devem ser
 * capazes de serem sanadas pelo backend"). Cada documento é, ao mesmo tempo, **o pedido e o registro**: o Supervisor
 * grava o que quer; **o servidor da agência executa o que é dele** (mandar e-mail, tirar a conta dos aparelhos,
 * liberar o bloqueio, apagar a conta) e fecha o pedido como `FEITO` ou `RECUSADO`. Desativar, reativar, tirar o
 * documento e corrigir o cadastro o painel faz sozinho, e o registro já nasce `FEITO`.
 *
 * A fonte é o `AtendimentoDaContaDocumento.kt` e o `AtendimentoDaConta.kt` do `fluviapp-kmp`, e a regra
 * `atendimentosDeConta` de lá. **Sem dado pessoal no registro** além do id da conta: o e-mail novo da correção vai no
 * pedido só até o servidor fechá-lo, e o fechamento o apaga.
 */

/** As ações, na ordem do `AcaoNaConta` do Kotlin. */
export const ACOES_NA_CONTA = [
  'REENVIAR_CONFIRMACAO',
  'ENVIAR_TROCA_DE_SENHA',
  'CORRIGIR_EMAIL',
  'LIBERAR_TENTATIVAS',
  'ENCERRAR_SESSOES',
  'APAGAR_CONTA',
  'DESATIVAR',
  'REATIVAR',
  'TIRAR_DOCUMENTO',
  'CORRIGIR_CADASTRO',
] as const
export type AcaoNaConta = (typeof ACOES_NA_CONTA)[number]

/**
 * **As que o servidor executa** (`executadaPeloServidor = true` no Kotlin, e a lista do `pedidoAoServidor` da regra).
 * As outras nascem `FEITO` pelo painel, e a API não as vê pendentes.
 */
export const ACOES_DO_SERVIDOR = [
  'REENVIAR_CONFIRMACAO',
  'ENVIAR_TROCA_DE_SENHA',
  'CORRIGIR_EMAIL',
  'LIBERAR_TENTATIVAS',
  'ENCERRAR_SESSOES',
  'APAGAR_CONTA',
] as const satisfies readonly AcaoNaConta[]
export type AcaoDoServidor = (typeof ACOES_DO_SERVIDOR)[number]

export const SITUACOES_DO_ATENDIMENTO = ['PENDENTE', 'FEITO', 'RECUSADO'] as const
export type SituacaoDoAtendimento = (typeof SITUACOES_DO_ATENDIMENTO)[number]

/**
 * **Os motivos de recusa que o painel sabe dizer** (#84). A regra aceita qualquer texto até 60; um motivo fora desta
 * lista o painel mostra cru.
 */
export const MOTIVOS_DA_RECUSA = ['EMAIL_EM_USO', 'CONTA_DESATIVADA', 'CONTA_CONFIRMADA', 'CONTA_INEXISTENTE'] as const
export type MotivoDaRecusa = (typeof MOTIVOS_DA_RECUSA)[number]

/** O limite do motivo na regra. */
export const LIMITE_DO_MOTIVO = 60

/** As chaves, na ordem do `AtendimentoDaContaDocumento.kt` — as mesmas do `hasOnly` da regra. */
export const CAMPOS_DO_ATENDIMENTO = [
  'contaId',
  'acao',
  'emailNovo',
  'porId',
  'porNome',
  'criadoEm',
  'situacao',
  'concluidoEm',
  'motivo',
] as const

/** A forma gravada. Plana; datas em epoch millis. */
export interface AtendimentoDaContaDocumento {
  readonly contaId: string
  readonly acao: AcaoNaConta
  /** Só em `CORRIGIR_EMAIL`, e só até o servidor fechar o pedido. */
  readonly emailNovo?: string | null
  readonly porId: string
  readonly porNome: string
  readonly criadoEm: number
  readonly situacao: SituacaoDoAtendimento
  readonly concluidoEm?: number | null
  readonly motivo?: string | null
}

/** **Um pedido ao servidor**, como a API o lê: pendente, e de uma ação que é dela. */
export interface PedidoDeAtendimento {
  readonly id: string
  readonly contaId: string
  readonly acao: AcaoDoServidor
  /** Presente só em `CORRIGIR_EMAIL`. */
  readonly emailNovo: string | null
  readonly porId: string
  readonly porNome: string
  readonly criadoEm: number
}

/**
 * O documento → o pedido que a API executa, ou `null` quando ele não é um: já fechado, de uma ação do painel, de
 * uma ação desconhecida, ou a correção do e-mail sem o e-mail novo. Fail-closed: o servidor não executa o que não
 * entende.
 */
export function pedidoDoDocumento(id: string, dado: unknown): PedidoDeAtendimento | null {
  if (typeof dado !== 'object' || dado === null || id.length === 0) return null
  const d = dado as Record<string, unknown>
  const acao = ACOES_DO_SERVIDOR.find((a) => a === d['acao'])
  const { contaId, porId, porNome, criadoEm, emailNovo } = d
  if (
    d['situacao'] !== 'PENDENTE' || acao === undefined ||
    typeof contaId !== 'string' || contaId.length === 0 ||
    typeof porId !== 'string' || typeof porNome !== 'string' ||
    typeof criadoEm !== 'number' || !Number.isInteger(criadoEm)
  ) {
    return null
  }
  const novo = typeof emailNovo === 'string' && emailNovo.length > 0 ? emailNovo : null
  if ((acao === 'CORRIGIR_EMAIL') !== (novo !== null)) return null
  return { id, contaId, acao, emailNovo: novo, porId, porNome, criadoEm }
}

/** O que o servidor muda ao fechar o pedido — as quatro chaves que a regra deixa (`servidorFecha`). */
export interface FechamentoDoAtendimento {
  readonly situacao: 'FEITO' | 'RECUSADO'
  readonly concluidoEm: number
  readonly motivo: string | null
  /** Sempre `null`: o e-mail novo sai do registro ao fechar. */
  readonly emailNovo: null
}

/** **Feito.** */
export function atendimentoFeito(concluidoEm: number): FechamentoDoAtendimento {
  return { situacao: 'FEITO', concluidoEm, motivo: null, emailNovo: null }
}

/** **Recusado**, com o motivo que o painel mostra. O motivo passa do limite da regra só por erro nosso: corta-se. */
export function atendimentoRecusado(concluidoEm: number, motivo: MotivoDaRecusa | string): FechamentoDoAtendimento {
  return { situacao: 'RECUSADO', concluidoEm, motivo: motivo.slice(0, LIMITE_DO_MOTIVO), emailNovo: null }
}

// ---------------------------------------------------------------------------------------------------------
// O endereço do servidor
// ---------------------------------------------------------------------------------------------------------

/**
 * `empresas/{agência}/servidorDoSite/endereco` → `{ url }`: **onde o painel avisa o servidor** de que há pedido. O
 * pedido já está gravado; o aviso só o faz ser executado na hora. Grava o próprio servidor, ou o ADM.
 */
export const CAMPOS_DO_ENDERECO_DO_SERVIDOR = ['url'] as const
export const CAMINHO_DO_ENDERECO_DO_SERVIDOR = 'servidorDoSite/endereco'

export interface EnderecoDoServidorDocumento {
  readonly url: string
}

/** A forma da regra: `http://` ou `https://`, sem espaço, e no máximo 200 caracteres depois do esquema. */
const PADRAO_DO_ENDERECO = /^https?:\/\/[^ ]{1,200}$/

/** A URL → o documento do endereço, ou `null` quando a regra o recusaria. */
export function enderecoDoServidor(url: string): EnderecoDoServidorDocumento | null {
  const limpa = url.trim()
  return PADRAO_DO_ENDERECO.test(limpa) ? { url: limpa } : null
}
