/**
 * **Confira seu e-mail** — a 3.2, estado 1 (decidida pelo PO em 2026-10-16): depois de criar a conta, e depois de pedir
 * um link novo.
 *
 * - **"Reenviar o e-mail"** (B): a cada 60 segundos, com a contagem no próprio botão ("Reenviar em 52 s"). A espera
 *   começa quando a tela abre, porque o primeiro e-mail acabou de sair. O aviso "Enviamos de novo" é lido pelo leitor de
 *   tela (`role="status"`). A API responde sempre igual, com conta ou sem; o limite da hora é dela.
 * - **"Corrigir o e-mail"** (E) não está aqui: desde 2026-10-21 o cadastro não entra na conta, e corrigir pede entrar
 *   com a senha antes (as regras da conta, "errou o e-mail"). Entra com a 3.3.
 */
import { useEffect, useId, useState } from 'react'

import type { ContaDoSite } from '@navegsistemas/dados/conta'

/** O "Reenviar" a cada 60 segundos (3.2, B), como a API. */
export const ESPERA_DO_REENVIO_S = 60

export const FALHA_DO_REENVIO = {
  CONEXAO: 'O e-mail não foi reenviado. A internet pode ter caído. Tente de novo.',
  LIMITE: 'Muitos pedidos em pouco tempo. Tente de novo daqui a alguns minutos.',
} as const

const relogioDoSistema = () => Date.now()

export function ConfiraSeuEmail({
  conta,
  email,
  relogio = relogioDoSistema,
}: {
  readonly conta: ContaDoSite
  readonly email: string
  readonly relogio?: () => number
}) {
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
    const resultado = await conta.reenviar(email)
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
      <p>
        Mandamos um link para <strong>{email}</strong>. Toque nele para confirmar a conta. Ele vale por 24 horas.
      </p>
      <ul className="conta-dicas">
        <li>Não chegou? Olhe a caixa de spam ou de promoções.</li>
        <li>O link funciona em qualquer aparelho, mesmo fora deste.</li>
      </ul>
      <div role="status">
        {aviso?.tipo === 'OK' && <p className="conta-ok">Enviamos de novo para {email}.</p>}
      </div>
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
        {enviando ? 'Reenviando…' : faltam > 0 ? `Reenviar em ${faltam} s` : 'Reenviar o e-mail'}
      </button>
      <p className="conta-ajuda">Sem o e-mail confirmado, você já pode entrar; para comprar, ele precisa estar confirmado.</p>
    </section>
  )
}
