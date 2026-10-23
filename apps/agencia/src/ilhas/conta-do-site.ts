/**
 * **De onde vem a conta, para as ilhas da conta** (3.1 em diante) — o que todas repetiriam.
 *
 * Lido no build, como no totem (`conteudo/api.ts`): a conta vai à API quando o catálogo vem dela e a chave do
 * Turnstile existe; senão, é a demonstração, em memória, e a tela diz que nada é enviado.
 */
import type { ObterDesafio } from '@navegsistemas/dados'
import { ContaEmMemoria, contaHttp, type ContaDoSite } from '@navegsistemas/dados/conta'
import { InstanteLocal, linkDeWhatsApp, type DataCalendario } from '@navegsistemas/domain'

import { envioConfigurado, fonteConfigurada } from '../conteudo/api'
import { ATENDIMENTO, WHATSAPP_DAS_RESERVAS } from '../conteudo/atendimento'
import { FUSO_DA_OPERACAO } from '../conteudo/operacao'

export const ENVIO_DA_CONTA = envioConfigurado(
  fonteConfigurada(import.meta.env.PUBLIC_URL_DA_API),
  import.meta.env.PUBLIC_TURNSTILE_SITE_KEY,
)

/** O WhatsApp do atendimento: a saída quando a conta não responde (2.6). */
export const WHATSAPP_DA_CONTA =
  WHATSAPP_DAS_RESERVAS === null
    ? null
    : { numero: WHATSAPP_DAS_RESERVAS, link: linkDeWhatsApp(WHATSAPP_DAS_RESERVAS, ATENDIMENTO.mensagemInicial) }

/** O dia de hoje em Belém: a idade mínima conta por ele, como na API. */
export const hojeEmBelem = (): DataCalendario => InstanteLocal.data(InstanteLocal.emFuso(new Date(), FUSO_DA_OPERACAO))

/** A conta da configuração: a API, com o desafio da página (ou sem, `null`), ou a demonstração. */
export function contaConfigurada(obterDesafio: ObterDesafio | null, hoje: () => DataCalendario = hojeEmBelem): ContaDoSite {
  return ENVIO_DA_CONTA.tipo === 'API' ? contaHttp(ENVIO_DA_CONTA.url, obterDesafio) : new ContaEmMemoria(hoje)
}

/**
 * O que os links do e-mail (a confirmação, 3.2; a senha nova, 3.4) levam depois do `#`: o id da conta e o código, como
 * a API os confere.
 */
const LINK = /^#?([A-Za-z0-9_-]{1,40})\.([A-Za-z0-9_-]{43})$/

export function linkDoEndereco(hash: string): { readonly contaId: string; readonly codigo: string } | null {
  const [, contaId, codigo] = LINK.exec(hash) ?? []
  return contaId === undefined || codigo === undefined ? null : { contaId, codigo }
}

/** Onde o entrar deixa o e-mail digitado, para o "Esqueci a senha" vir preenchido. */
export const CHAVE_DO_EMAIL_DO_ENTRAR = 'naveg:email-do-entrar'

export function lembrarEmailDoEntrar(email: string): void {
  try {
    sessionStorage.setItem(CHAVE_DO_EMAIL_DO_ENTRAR, email)
  } catch {
    /* Sem o armazenamento (aba privada, bloqueado): o campo vem vazio, e só. */
  }
}

export function emailLembrado(): string {
  try {
    return sessionStorage.getItem(CHAVE_DO_EMAIL_DO_ENTRAR) ?? ''
  } catch {
    return ''
  }
}
