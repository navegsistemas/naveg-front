/**
 * **O desafio do Turnstile** — o token que diz à API "tem gente do outro lado".
 *
 * Sem App Check (que é só para clientes Firebase), é o Turnstile que separa uma pessoa de um script mandando
 * reservas. O widget é **só-quando-preciso** (`appearance: 'interaction-only'`): quase sempre resolve sozinho,
 * sem ninguém ver; quando a Cloudflare desconfia, aparece uma caixa para marcar — e por isso ele mora num
 * contêiner **visível**, fixo no rodapé da tela, e não escondido.
 *
 * - o script da Cloudflare só é carregado **no primeiro envio**, não com a página: quem só olha as saídas não
 *   baixa nada da Cloudflare;
 * - **um token por envio**. Tokens não se reaproveitam (a API os confere uma vez), então cada envio desenha um
 *   widget novo e remove o anterior;
 * - se o desafio não resolver em dois minutos, o envio falha — e o totem diz "não foi possível enviar agora",
 *   em vez de girar para sempre.
 */
import type { ObterDesafio } from '@navegsistemas/dados'

interface OpcoesDoWidget {
  readonly sitekey: string
  readonly action: string
  readonly appearance: 'always' | 'execute' | 'interaction-only'
  readonly callback: (token: string) => void
  readonly 'error-callback': () => void
  readonly 'timeout-callback': () => void
  readonly 'expired-callback': () => void
}

interface Turnstile {
  render(contêiner: HTMLElement, opcoes: OpcoesDoWidget): string
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
    script.onerror = () => {
      carregamento = null
      reject(new Error('o script do Turnstile não carregou'))
    }
    document.head.appendChild(script)
  })
  return carregamento
}

export function desafioTurnstile(chave: string): ObterDesafio {
  let conteiner: HTMLElement | null = null
  let widget: string | null = null

  return async () => {
    const turnstile = await carregar()
    if (conteiner === null) {
      conteiner = document.createElement('div')
      conteiner.className = 'totem-desafio'
      document.body.appendChild(conteiner)
    }
    if (widget !== null) turnstile.remove(widget)
    const alvo = conteiner

    return new Promise<string>((resolve, reject) => {
      const prazo = setTimeout(() => reject(new Error('o desafio não resolveu a tempo')), PRAZO_MS)
      const falhar = (motivo: string) => () => {
        clearTimeout(prazo)
        reject(new Error(motivo))
      }
      widget = turnstile.render(alvo, {
        sitekey: chave,
        action: 'reserva',
        appearance: 'interaction-only',
        callback: (token) => {
          clearTimeout(prazo)
          resolve(token)
        },
        'error-callback': falhar('o desafio falhou'),
        'timeout-callback': falhar('o desafio expirou'),
        'expired-callback': falhar('o token expirou'),
      })
    })
  }
}
