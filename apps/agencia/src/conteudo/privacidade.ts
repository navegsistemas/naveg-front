/**
 * **A política de privacidade** (passo 13.4) — o que a página `/privacidade` declara sobre si mesma.
 *
 * O texto mora na página (`pages/privacidade.astro`), porque é um documento e só aparece lá. Aqui fica o que
 * muda junto com ele e o que outros lugares leem: a versão, a data, os prazos e **o que ainda falta**.
 *
 * ### A política diz o que o site faz hoje, e nada além
 *
 * Ela não pode dizer menos do que o site faz, nem prometer o que ele ainda não faz (plano da venda online, U7).
 * As seções da conta e da compra entram com a 7.4 e a 7.6, cada uma mudando a versão e a data. Enquanto uma
 * promessa depende de algo que ainda não está no ar, ela vai marcada como pendência na própria página — e a
 * página diz, no topo, que é um rascunho em revisão.
 */

/** Sobe a cada mudança de conteúdo; a data acompanha. A versão antiga não se reescreve, se substitui. */
export const VERSAO_DA_POLITICA = '1.0'
/** ISO `yyyy-MM-dd`. */
export const DATA_DA_POLITICA = '2026-10-07'

/** Por quanto tempo o dado pessoal de uma reserva fica guardado depois da data da viagem (PO, 2026-10-07). */
export const DIAS_DE_GUARDA_DA_RESERVA = 14

/**
 * **O que a política ainda espera** — cada item aparece na página onde a promessa depende dele, e enquanto a
 * lista não estiver vazia a página se declara rascunho. A entrada sai daqui no dia em que a coisa estiver no ar.
 */
export const PENDENCIAS_DA_POLITICA = {
  /** O alias `privacidade@gruponaveg.com.br`, a cadastrar no Workspace (PO, 2026-10-07). */
  emailDoEncarregado: 'o e-mail do encarregado (privacidade@gruponaveg.com.br, a cadastrar)',
  /** A tarefa que apaga o dado pessoal depois do prazo — naveg-api-vercel#21. */
  anonimizacao: 'a anonimização automática depois do prazo (naveg-api-vercel#21)',
  /** O site deixa de pedir quem retira a encomenda — fluviapp-kmp#41. */
  semDestinatario: 'a encomenda sem destinatário (fluviapp-kmp#41)',
  /** A revisão de um advogado, que a U7 junta com a das seções da conta e da compra. */
  revisaoJuridica: 'a revisão jurídica, com as bases legais',
} as const

export type PendenciaDaPolitica = keyof typeof PENDENCIAS_DA_POLITICA

/** A data por extenso, como se lê no topo: "7 de outubro de 2026". */
export function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  const nome = MESES[Number(mes) - 1]
  if (ano === undefined || dia === undefined || nome === undefined) throw new Error(`data ilegível: ${iso}`)
  return `${Number(dia)} de ${nome} de ${ano}`
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
] as const
