/**
 * **A conta do cliente, do ponto de vista do site** — a porta, e as duas formas de atravessá-la (3.1 em diante).
 *
 * - **`contaHttp`** — as rotas `/conta` da API, atrás do próprio site (`/api`, ADR-0003). A sessão é um cookie do site,
 *   que o navegador manda e guarda sozinho: o site nunca o lê.
 * - **`contaEmMemoria`** — a demonstração (as prévias dos PRs e o site sem API): o domínio confere os campos como a
 *   API conferiria, e nada sai do navegador.
 *
 * Esta versão tem **o cadastro** (3.1), **o "Reenviar" e o link de confirmação** (3.2), e **entrar, sair e quem está
 * dentro** (3.3), e **a senha esquecida** (3.4). Meus dados (4.2) vem a seguir.
 *
 * O `POST /conta/confirmacao/reenvio` responde sempre `202` (não revela se o e-mail tem conta); o `POST
 * /conta/confirmacao` responde `200 EMAIL_CONFIRMADO` ou `JA_CONFIRMADO`, ou `410 LINK_VENCIDO` ou `LINK_INVALIDO`.
 *
 * ### O que cada resposta do `POST /conta` vira
 *
 * | resposta | resultado |
 * |---|---|
 * | `202` | `CONFIRA_O_EMAIL` — com conta nova ou com o e-mail que já tem conta: a API não revela (PO, 2026-10-21) |
 * | `422 CADASTRO_INVALIDO` | `INVALIDO`, com as pendências do domínio, campo por campo |
 * | `422 SENHA_FRACA` | `SENHA_FRACA`, com o motivo: `SENHA_COMUM` ou `SENHA_VAZADA` |
 * | `429` | `FALHA` por `LIMITE` |
 * | `403 DESAFIO_INVALIDO`, ou o desafio que não resolve | `FALHA` por `DESAFIO` |
 * | o desafio sem rede, a rede, ou qualquer outra | `FALHA` por `CONEXAO` |
 */
import {
  PENDENCIAS_DO_CADASTRO,
  pendenciasDoCadastro,
  type CadastroDaConta,
  type DataCalendario,
  type MotivoDaFalha,
  type PendenciaDoCadastro,
} from '@navegsistemas/domain'

import { DesafioSemConexao, type ObterDesafio } from './envio.js'
import type { Buscar } from './http.js'

/** Por que a senha foi recusada (3.1, C). A curta é pendência do domínio, conferida antes. */
export type MotivoDaSenhaFraca = 'SENHA_COMUM' | 'SENHA_VAZADA'

export type ResultadoDoCadastroNoSite =
  | { readonly caso: 'CONFIRA_O_EMAIL' }
  | { readonly caso: 'INVALIDO'; readonly pendencias: ReadonlySet<PendenciaDoCadastro> }
  | { readonly caso: 'SENHA_FRACA'; readonly motivo: MotivoDaSenhaFraca }
  | { readonly caso: 'FALHA'; readonly porque: MotivoDaFalha }

/** O "Reenviar" (3.2, B): a API responde sempre igual, com conta ou sem; só o limite e a rede mudam a tela. */
export type ResultadoDoReenvio =
  | { readonly caso: 'CONFIRA_O_EMAIL' }
  | { readonly caso: 'FALHA'; readonly porque: Exclude<MotivoDaFalha, 'DESAFIO'> }

/** O link de confirmação aberto (3.2, C e estado 4). */
export type ResultadoDaConfirmacao =
  | { readonly caso: 'EMAIL_CONFIRMADO' | 'JA_CONFIRMADO' | 'LINK_VENCIDO' | 'LINK_INVALIDO' }
  | { readonly caso: 'FALHA'; readonly porque: Exclude<MotivoDaFalha, 'DESAFIO'> }

/** Entrar (3.3). As respostas não dizem se o e-mail tem conta: a desativada só aparece com a senha certa (F). */
export type ResultadoDoEntrar =
  | { readonly caso: 'DENTRO'; readonly confirmada: boolean }
  | { readonly caso: 'CREDENCIAIS_INVALIDAS' | 'TENTATIVAS_DEMAIS' | 'CONTA_DESATIVADA' }
  | { readonly caso: 'FALHA'; readonly porque: MotivoDaFalha }

/** Quem está dentro neste aparelho (3.3): o cookie que vale, ou ninguém. */
export type ResultadoDaSessao =
  | { readonly caso: 'DENTRO'; readonly confirmada: boolean }
  | { readonly caso: 'FORA' }
  | { readonly caso: 'FALHA' }

export interface ContaDoSite {
  /** Cria a conta. O desafio é pedido aqui, um por envio, como na reserva. */
  criar(cadastro: CadastroDaConta): Promise<ResultadoDoCadastroNoSite>
  /** Pede outro link de confirmação para o e-mail. O anterior deixa de valer. */
  reenviar(email: string): Promise<ResultadoDoReenvio>
  /** Confere o link do e-mail; confirmado, a API já deixa a pessoa dentro (o cookie vem na resposta). */
  confirmar(contaId: string, codigo: string): Promise<ResultadoDaConfirmacao>
  /** Entra com o e-mail e a senha, e o desafio da página (ação `entrar`). Dentro, o cookie vem na resposta. */
  entrar(email: string, senha: string): Promise<ResultadoDoEntrar>
  /** Quem está dentro neste aparelho. */
  sessao(): Promise<ResultadoDaSessao>
  /** Sai deste aparelho: a API apaga o cookie. `false`: não deu (a rede). */
  sair(): Promise<boolean>
  /** Pede o link de troca de senha (3.4, B): a API responde sempre igual, com conta ou sem. */
  esqueci(email: string): Promise<ResultadoDoReenvio>
  /** A senha nova, com o link aberto (3.4, C). Trocada, a pessoa fica dentro (o cookie vem na resposta). */
  novaSenha(contaId: string, codigo: string, senha: string): Promise<ResultadoDaSenhaNova>
}

/** A senha nova pelo link (3.4). */
export type ResultadoDaSenhaNova =
  | { readonly caso: 'DENTRO' | 'LINK_INVALIDO' | 'LINK_VENCIDO' | 'CONTA_DESATIVADA' }
  | { readonly caso: 'SENHA_FRACA'; readonly motivo: 'SENHA_CURTA' | MotivoDaSenhaFraca }
  | { readonly caso: 'FALHA'; readonly porque: Exclude<MotivoDaFalha, 'DESAFIO'> }

/** Um `POST` com JSON: a resposta, ou `null` quando a rede caiu. */
async function postar(buscar: Buscar, endereco: string, corpo: unknown): Promise<Response | null> {
  try {
    return await buscar(endereco, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corpo),
    })
  } catch {
    return null
  }
}

const falha = (porque: MotivoDaFalha = 'CONEXAO') => ({ caso: 'FALHA', porque }) as const

async function lerJson(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json()
  } catch {
    return null
  }
}

function listaDoCorpo(corpo: unknown): readonly unknown[] {
  const lista = (corpo as { pendencias?: unknown } | null)?.pendencias
  return Array.isArray(lista) ? lista : []
}

const fetchDoNavegador: Buscar = (url, init) => fetch(url, init)

/**
 * @param obterDesafio o Turnstile da página, para o cadastro. `null` nas páginas que não criam conta (o link de
 *   confirmação): ali o `criar` falha pelo desafio, sem chegar à API.
 */
export function contaHttp(urlDaApi: string, obterDesafio: ObterDesafio | null, buscar: Buscar = fetchDoNavegador): ContaDoSite {
  const raiz = `${urlDaApi.replace(/\/+$/, '')}/conta`
  return {
    async criar(cadastro) {
      let desafio: string
      try {
        if (obterDesafio === null) return falha('DESAFIO')
        desafio = await obterDesafio()
      } catch (erro) {
        return falha(erro instanceof DesafioSemConexao ? 'CONEXAO' : 'DESAFIO')
      }

      let resposta: Response
      try {
        resposta = await buscar(raiz, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...cadastro, desafio }),
        })
      } catch {
        return falha()
      }

      const dado = await lerJson(resposta)
      const codigo = (dado as { erro?: unknown } | null)?.erro
      switch (resposta.status) {
        case 202:
          return { caso: 'CONFIRA_O_EMAIL' }
        case 422: {
          const lista = listaDoCorpo(dado)
          if (codigo === 'SENHA_FRACA') {
            if (lista.includes('SENHA_VAZADA')) return { caso: 'SENHA_FRACA', motivo: 'SENHA_VAZADA' }
            if (lista.includes('SENHA_COMUM')) return { caso: 'SENHA_FRACA', motivo: 'SENHA_COMUM' }
          }
          const pendencias = lista.filter((p): p is PendenciaDoCadastro =>
            (PENDENCIAS_DO_CADASTRO as readonly unknown[]).includes(p),
          )
          return pendencias.length > 0 ? { caso: 'INVALIDO', pendencias: new Set(pendencias) } : falha()
        }
        case 429:
          return falha('LIMITE')
        case 403:
          return falha(codigo === 'DESAFIO_INVALIDO' ? 'DESAFIO' : 'CONEXAO')
        default:
          return falha()
      }
    },

    async reenviar(email) {
      const resposta = await postar(buscar, `${raiz}/confirmacao/reenvio`, { email })
      if (resposta?.status === 202) return { caso: 'CONFIRA_O_EMAIL' }
      return { caso: 'FALHA', porque: resposta?.status === 429 ? 'LIMITE' : 'CONEXAO' }
    },

    async confirmar(contaId, codigo) {
      const resposta = await postar(buscar, `${raiz}/confirmacao`, { contaId, codigo })
      if (resposta === null) return { caso: 'FALHA', porque: 'CONEXAO' }
      const dado = await lerJson(resposta)
      const situacao = (dado as { situacao?: unknown; erro?: unknown } | null)?.situacao
      const codigoDoErro = (dado as { erro?: unknown } | null)?.erro
      if (resposta.status === 200 && (situacao === 'EMAIL_CONFIRMADO' || situacao === 'JA_CONFIRMADO')) {
        return { caso: situacao }
      }
      if (resposta.status === 410 && (codigoDoErro === 'LINK_VENCIDO' || codigoDoErro === 'LINK_INVALIDO')) {
        return { caso: codigoDoErro }
      }
      /* O corpo que não é um link (o endereço cortado no e-mail): para a pessoa, é um link que não vale. */
      if (resposta.status === 400) return { caso: 'LINK_INVALIDO' }
      return { caso: 'FALHA', porque: resposta.status === 429 ? 'LIMITE' : 'CONEXAO' }
    },

    async entrar(email, senha) {
      if (obterDesafio === null) return falha('DESAFIO')
      let desafio: string
      try {
        desafio = await obterDesafio()
      } catch (erro) {
        return falha(erro instanceof DesafioSemConexao ? 'CONEXAO' : 'DESAFIO')
      }
      const resposta = await postar(buscar, `${raiz}/entrar`, { email, senha, desafio })
      if (resposta === null) return falha()
      const dado = (await lerJson(resposta)) as { erro?: unknown; situacao?: unknown; confirmada?: unknown } | null
      if (resposta.status === 200 && dado?.situacao === 'DENTRO') return { caso: 'DENTRO', confirmada: dado.confirmada === true }
      switch (dado?.erro) {
        case 'CREDENCIAIS_INVALIDAS':
        case 'TENTATIVAS_DEMAIS':
        case 'CONTA_DESATIVADA':
          return { caso: dado.erro }
        case 'LIMITE_EXCEDIDO':
          return falha('LIMITE')
        case 'DESAFIO_INVALIDO':
          return falha('DESAFIO')
        default:
          return falha()
      }
    },

    async sessao() {
      let resposta: Response
      try {
        resposta = await buscar(`${raiz}/sessao`, { headers: { Accept: 'application/json' } })
      } catch {
        return { caso: 'FALHA' }
      }
      if (resposta.status === 401) return { caso: 'FORA' }
      const dado = (await lerJson(resposta)) as { situacao?: unknown; confirmada?: unknown } | null
      return resposta.status === 200 && dado?.situacao === 'DENTRO'
        ? { caso: 'DENTRO', confirmada: dado.confirmada === true }
        : { caso: 'FALHA' }
    },

    async sair() {
      const resposta = await postar(buscar, `${raiz}/sair`, {})
      return resposta !== null && resposta.status === 204
    },

    async esqueci(email) {
      const resposta = await postar(buscar, `${raiz}/senha/esqueci`, { email })
      if (resposta?.status === 202) return { caso: 'CONFIRA_O_EMAIL' }
      return { caso: 'FALHA', porque: resposta?.status === 429 ? 'LIMITE' : 'CONEXAO' }
    },

    async novaSenha(contaId, codigo, senha) {
      const resposta = await postar(buscar, `${raiz}/senha/nova`, { contaId, codigo, senha })
      if (resposta === null) return { caso: 'FALHA', porque: 'CONEXAO' }
      const dado = (await lerJson(resposta)) as { situacao?: unknown; erro?: unknown } | null
      if (resposta.status === 200 && dado?.situacao === 'DENTRO') return { caso: 'DENTRO' }
      switch (dado?.erro) {
        case 'LINK_INVALIDO':
        case 'LINK_VENCIDO':
        case 'CONTA_DESATIVADA':
          return { caso: dado.erro }
        case 'SENHA_FRACA': {
          const lista = listaDoCorpo(dado)
          const motivo = lista.includes('SENHA_VAZADA') ? 'SENHA_VAZADA' : lista.includes('SENHA_COMUM') ? 'SENHA_COMUM' : 'SENHA_CURTA'
          return { caso: 'SENHA_FRACA', motivo }
        }
        /* O corpo que não é um link (o endereço cortado): para a pessoa, um link que não vale. */
        case 'CORPO_INVALIDO':
          return { caso: 'LINK_INVALIDO' }
        default:
          return { caso: 'FALHA', porque: resposta.status === 429 ? 'LIMITE' : 'CONEXAO' }
      }
    },
  }
}

/**
 * **A conta da demonstração**: confere os campos pelo domínio, como a API, e responde como ela. Os cadastros ficam
 * na memória da aba, para os cenários conferirem; nenhum e-mail sai.
 */
export class ContaEmMemoria implements ContaDoSite {
  readonly cadastros: CadastroDaConta[] = []

  constructor(private readonly hoje: () => DataCalendario) {}

  async criar(cadastro: CadastroDaConta): Promise<ResultadoDoCadastroNoSite> {
    const pendencias = pendenciasDoCadastro(cadastro, this.hoje())
    if (pendencias.size > 0) return { caso: 'INVALIDO', pendencias }
    this.cadastros.push(cadastro)
    return { caso: 'CONFIRA_O_EMAIL' }
  }

  readonly reenvios: string[] = []

  /** Responde como a API: sempre "Confira seu e-mail", e nenhum e-mail sai. */
  async reenviar(email: string): Promise<ResultadoDoReenvio> {
    this.reenvios.push(email)
    return { caso: 'CONFIRA_O_EMAIL' }
  }

  /** Na demonstração não há e-mail, nem link: qualquer link aberto é um que não vale. */
  async confirmar(): Promise<ResultadoDaConfirmacao> {
    return { caso: 'LINK_INVALIDO' }
  }

  /** Quem entrou, na memória da aba. A demonstração não guarda senha: entra quem tiver se cadastrado com o e-mail. */
  dentro = false

  async entrar(email: string): Promise<ResultadoDoEntrar> {
    const conhecido = this.cadastros.some((c) => c.email.trim().toLowerCase() === email.trim().toLowerCase())
    if (!conhecido) return { caso: 'CREDENCIAIS_INVALIDAS' }
    this.dentro = true
    return { caso: 'DENTRO', confirmada: false }
  }

  async sessao(): Promise<ResultadoDaSessao> {
    return this.dentro ? { caso: 'DENTRO', confirmada: false } : { caso: 'FORA' }
  }

  async sair(): Promise<boolean> {
    this.dentro = false
    return true
  }

  /** Como a API: sempre "Confira seu e-mail", e nenhum e-mail sai. */
  async esqueci(email: string): Promise<ResultadoDoReenvio> {
    this.reenvios.push(email)
    return { caso: 'CONFIRA_O_EMAIL' }
  }

  /** Na demonstração não há link: qualquer um aberto é um que não vale. */
  async novaSenha(): Promise<ResultadoDaSenhaNova> {
    return { caso: 'LINK_INVALIDO' }
  }
}
