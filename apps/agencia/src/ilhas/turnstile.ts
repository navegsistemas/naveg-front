/**
 * **A verificação contra robô** — o token do Turnstile que diz à API "tem gente do outro lado".
 *
 * Sem App Check (que é só para clientes Firebase), é o Turnstile que separa uma pessoa de um script mandando
 * reservas. Desde a 2.8 (PO, 2026-10-21), ele é **um passo visível da conferência**: o widget é desenhado dentro do
 * cartão, acima do "Confirmar reserva", começa sozinho quando a conferência abre e sai com ela. Antes, ele morava
 * num contêiner fixo no rodapé da tela, fora do totem, e ficava lá depois de verificado.
 *
 * - o script da Cloudflare só é carregado **na conferência**, e não com a página: quem só olha as saídas não baixa
 *   nada da Cloudflare;
 * - **um token por envio**. Tokens não se reaproveitam (a API os confere uma vez): o envio leva o token, e o widget
 *   é zerado para buscar outro, que serve ao "Tentar de novo";
 * - o token que vence (5 minutos) é renovado pelo próprio widget, e a conferência volta a "Verificando…";
 * - **sem internet, a falha é da conexão, não do robô** (aceite do roteiro 3, PO, 2026-10-20): o script que não
 *   carrega, ou o widget que falha com o aparelho fora da rede, dão `SEM_CONEXAO`, e o envio, `DesafioSemConexao`.
 */
import { DesafioSemConexao, type ObterDesafio } from '@navegsistemas/dados'

interface OpcoesDoWidget {
  readonly sitekey: string
  readonly action: string
  readonly appearance: 'always' | 'execute' | 'interaction-only'
  readonly size: 'normal' | 'flexible' | 'compact'
  readonly language: string
  readonly 'refresh-expired': 'auto' | 'manual' | 'never'
  readonly callback: (token: string) => void
  readonly 'error-callback': () => void
  readonly 'timeout-callback': () => void
  readonly 'expired-callback': () => void
}

interface Turnstile {
  render(contêiner: HTMLElement, opcoes: OpcoesDoWidget): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const PRAZO_MS = 120_000

let carregamento: Promise<Turnstile> | null = null

function carregar(): Promise<Turnstile> {
  if (window.turnstile !== undefined) return Promise.resolve(window.turnstile)
  carregamento ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => (window.turnstile !== undefined ? resolve(window.turnstile) : reject(new Error('turnstile ausente')))
    /* O script que não carrega é a rede (ou um bloqueador): sai da página, para o Tentar de novo pôr outro. */
    script.onerror = () => {
      carregamento = null
      script.remove()
      reject(new DesafioSemConexao('o script do Turnstile não carregou'))
    }
    document.head.appendChild(script)
  })
  return carregamento
}

/** Em que pé está a verificação: é o que a conferência mostra e o que libera o botão. */
export type EstadoDaVerificacao = 'VERIFICANDO' | 'VERIFICADA' | 'SEM_CONEXAO' | 'FALHOU'

export interface VerificacaoContraRobo {
  /** Desenha o widget em `alvo` (a conferência abriu); devolve quem o tira (ela fechou). */
  montar(alvo: HTMLElement): () => void
  /** Avisa a cada mudança; devolve quem para de avisar. É o `subscribe` do `useSyncExternalStore`. */
  ouvir(aoMudar: () => void): () => void
  estado(): EstadoDaVerificacao
  /** Depois de uma falha: desenha de novo, e carrega o script de novo se foi ele que não veio. */
  tentarDeNovo(): void
  /** O token do envio, para o `envioHttp`. Consome o token: o próximo envio espera outro. */
  readonly obterDesafio: ObterDesafio
}

interface Espera {
  readonly resolver: (token: string) => void
  readonly rejeitar: (erro: Error) => void
}

export function verificacaoTurnstile(chave: string): VerificacaoContraRobo {
  let estado: EstadoDaVerificacao = 'VERIFICANDO'
  let token: string | null = null
  let alvo: HTMLElement | null = null
  let widget: { readonly turnstile: Turnstile; readonly id: string } | null = null
  const ouvintes = new Set<() => void>()
  let esperas: Espera[] = []

  const mudar = (novo: EstadoDaVerificacao) => {
    if (novo === estado) return
    estado = novo
    ouvintes.forEach((avisar) => avisar())
  }

  /* Com o script já carregado, o widget também falha sem rede; o navegador é quem sabe se o aparelho está fora. */
  const falhar = (semConexao: boolean) => {
    token = null
    mudar(semConexao ? 'SEM_CONEXAO' : 'FALHOU')
    const erro = semConexao ? new DesafioSemConexao('a verificação não resolveu sem rede') : new Error('a verificação falhou')
    esperas.forEach((e) => e.rejeitar(erro))
    esperas = []
  }

  const desenhar = (destino: HTMLElement) => {
    mudar('VERIFICANDO')
    carregar().then(
      (turnstile) => {
        if (alvo !== destino) return
        const id = turnstile.render(destino, {
          sitekey: chave,
          action: 'reserva',
          appearance: 'always',
          size: 'flexible',
          language: 'pt-br',
          'refresh-expired': 'auto',
          callback: (novo) => {
            token = novo
            mudar('VERIFICADA')
            const espera = esperas.shift()
            if (espera !== undefined) espera.resolver(consumir())
          },
          'error-callback': () => falhar(!navigator.onLine),
          'timeout-callback': () => falhar(!navigator.onLine),
          'expired-callback': () => {
            token = null
            mudar('VERIFICANDO')
          },
        })
        widget = { turnstile, id }
      },
      (erro: unknown) => {
        if (alvo === destino) falhar(erro instanceof DesafioSemConexao || !navigator.onLine)
      },
    )
  }

  /* O token vai neste envio; o widget busca outro para o "Tentar de novo", se a API recusar. */
  function consumir(): string {
    const usado = token as string
    token = null
    if (widget !== null) {
      mudar('VERIFICANDO')
      widget.turnstile.reset(widget.id)
    }
    return usado
  }

  const tirar = () => {
    if (widget !== null) widget.turnstile.remove(widget.id)
    widget = null
  }

  return {
    montar(destino) {
      tirar()
      alvo = destino
      token = null
      desenhar(destino)
      return () => {
        if (alvo !== destino) return
        tirar()
        alvo = null
        token = null
      }
    },
    ouvir(aoMudar) {
      ouvintes.add(aoMudar)
      return () => ouvintes.delete(aoMudar)
    },
    estado: () => estado,
    tentarDeNovo() {
      if (alvo === null) return
      if (widget !== null) {
        token = null
        mudar('VERIFICANDO')
        widget.turnstile.reset(widget.id)
      } else {
        desenhar(alvo)
      }
    },
    obterDesafio: () => {
      if (token !== null) return Promise.resolve(consumir())
      if (estado === 'SEM_CONEXAO') return Promise.reject(new DesafioSemConexao('a verificação está sem rede'))
      if (estado === 'FALHOU' || alvo === null) return Promise.reject(new Error('a verificação não passou'))
      /* O botão espera a verificação, então isto é raro: um envio no instante em que o token venceu. */
      return new Promise<string>((resolver, rejeitar) => {
        const prazo = setTimeout(() => rejeitar(new Error('a verificação não resolveu a tempo')), PRAZO_MS)
        esperas.push({
          resolver: (t) => {
            clearTimeout(prazo)
            resolver(t)
          },
          rejeitar: (e) => {
            clearTimeout(prazo)
            rejeitar(e)
          },
        })
      })
    },
  }
}
