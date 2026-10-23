/**
 * **Confira seu e-mail** — a 3.2, estado 1 (decidida pelo PO em 2026-10-16): depois de criar a conta, e depois de pedir
 * um link novo. E a 3.4, estado 1: depois de pedir o link de troca de senha, com os textos dela (`caminho="SENHA"`).
 *
 * - **"Reenviar o e-mail"** (B): a cada 60 segundos, com a contagem no próprio botão ("Reenviar em 52 s"). A espera
 *   começa quando a tela abre, porque o primeiro e-mail acabou de sair. O aviso "Enviamos de novo" é lido pelo leitor de
 *   tela (`role="status"`). A API responde sempre igual, com conta ou sem; o limite da hora é dela.
 * - **"Corrigir o e-mail"** (E) não está aqui: desde 2026-10-21 o cadastro não entra na conta, e corrigir pede entrar
 *   com a senha antes (as regras da conta, "errou o e-mail"). Entra com a 3.3.
 */
import { useEffect, useId, useState, type ReactNode } from 'react'

import type { ContaDoSite } from '@navegsistemas/dados/conta'

import { WHATSAPP_DA_CONTA } from './conta-do-site'

/** O "Reenviar" a cada 60 segundos (3.2, B), como a API. */
export const ESPERA_DO_REENVIO_S = 60

export const FALHA_DO_REENVIO = {
  CONEXAO: 'O e-mail não foi reenviado. A internet pode ter caído. Tente de novo.',
  LIMITE: 'Muitos pedidos em pouco tempo. Tente de novo daqui a alguns minutos.',
} as const

const relogioDoSistema = () => Date.now()

/**
 * Os textos de cada caminho: a confirmação da conta (3.2) e o link de troca de senha (3.4), que não diz se o e-mail tem
 * conta (B) e vale 1 hora (A).
 */
const TEXTOS = {
  CONFIRMACAO: {
    texto: (email: ReactNode) => (
      <>Mandamos um link para {email}. Toque nele para confirmar a conta. Ele vale por 24 horas.</>
    ),
    dicas: ['Não chegou? Olhe a caixa de spam ou de promoções.', 'O link funciona em qualquer aparelho, mesmo fora deste.'],
    deNovo: (email: string) => `Enviamos de novo para ${email}.`,
    botao: 'Reenviar o e-mail',
    esperando: (s: number) => `Reenviar em ${s} s`,
    enviando: 'Reenviando…',
  },
  SENHA: {
    texto: (email: ReactNode) => <>Se houver uma conta com {email}, o link chega em instantes. Ele vale por 1 hora.</>,
    dicas: ['Não chegou? Olhe a caixa de spam ou de promoções.', 'Confira se o e-mail está certo. Se não for o da conta, nada chega.'],
    deNovo: (email: string) => `Pedimos de novo. Se houver uma conta com ${email}, o link chega em instantes.`,
    botao: 'Mandar de novo',
    esperando: (s: number) => `Mandar de novo em ${s} s`,
    enviando: 'Mandando…',
  },
} as const

export function ConfiraSeuEmail({
  conta,
  email,
  caminho = 'CONFIRMACAO',
  relogio = relogioDoSistema,
}: {
  readonly conta: ContaDoSite
  readonly email: string
  /** A confirmação da conta (3.2), ou o link de troca de senha (3.4). */
  readonly caminho?: keyof typeof TEXTOS
  readonly relogio?: () => number
}) {
  const textos = TEXTOS[caminho]
  const id = useId()
  const [liberaEm, setLiberaEm] = useState(() => relogio() + ESPERA_DO_REENVIO_S * 1000)
  const [agora, setAgora] = useState(relogio)
  const [aviso, setAviso] = useState<{ readonly tipo: 'OK' } | { readonly tipo: 'FALHA'; readonly texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(relogio()), 1000)
    return () => clearInterval(intervalo)
  }, [relogio])

  const faltam = Math.max(0, Math.ceil((liberaEm - agora) / 1000))

  async function reenviar() {
    setEnviando(true)
    const resultado = caminho === 'SENHA' ? await conta.esqueci(email) : await conta.reenviar(email)
    setEnviando(false)
    if (resultado.caso === 'CONFIRA_O_EMAIL') {
      setAviso({ tipo: 'OK' })
      setLiberaEm(relogio() + ESPERA_DO_REENVIO_S * 1000)
      setAgora(relogio())
    } else {
      setAviso({ tipo: 'FALHA', texto: FALHA_DO_REENVIO[resultado.porque] })
    }
  }

  return (
    <section className="conta-cartao" aria-labelledby={`${id}-titulo`}>
      <h1 id={`${id}-titulo`} tabIndex={-1} ref={(h) => h?.focus()}>
        Confira seu e-mail
      </h1>
      <p>{textos.texto(<strong>{email}</strong>)}</p>
      <ul className="conta-dicas">
        {textos.dicas.map((dica) => (
          <li key={dica}>{dica}</li>
        ))}
      </ul>
      <div role="status">{aviso?.tipo === 'OK' && <p className="conta-ok">{textos.deNovo(email)}</p>}</div>
      {aviso?.tipo === 'FALHA' && (
        <div className="totem-aviso" role="alert">
          <p>{aviso.texto}</p>
        </div>
      )}
      <button
        type="button"
        className="acao acao--secundaria conta-enviar"
        disabled={faltam > 0 || enviando}
        onClick={() => void reenviar()}
      >
        {enviando ? textos.enviando : faltam > 0 ? textos.esperando(faltam) : textos.botao}
      </button>
      {caminho === 'CONFIRMACAO' ? (
        <p className="conta-ajuda">Sem o e-mail confirmado, você já pode entrar; para comprar, ele precisa estar confirmado.</p>
      ) : (
        WHATSAPP_DA_CONTA !== null && (
          <p className="conta-ajuda">
            Não lembra o e-mail da conta? Fale com o atendimento pelo <a href={WHATSAPP_DA_CONTA.link}>WhatsApp</a>:{' '}
            {WHATSAPP_DA_CONTA.numero}.
          </p>
        )
      )}
    </section>
  )
}
