/**
 * **Esqueci a senha: pedir o link** — a 3.4, estado 1 (decidida pelo PO em 2026-10-16, A a F), em `/conta/esqueci`.
 *
 * - O e-mail **vem preenchido** quando a pessoa já o digitou no entrar (guardado na aba, `sessionStorage`, e nunca no
 *   endereço, que vai aos logs).
 * - **A resposta é sempre a mesma** (B): "Se houver uma conta com este e-mail, o link chega em instantes". O link vale 1
 *   hora e uma vez só (A); a conta desativada recebe, no lugar dele, o aviso com o WhatsApp (F). Tudo isso é da API.
 * - **Sem a verificação contra robô**: a API não a pede aqui (naveg-api-vercel#51). O freio é o limite por endereço de
 *   rede e, por e-mail, um pedido por minuto e 5 por hora; e a resposta igual não revela nada a quem tenta.
 */
import { useEffect, useId, useState, type FormEvent } from 'react'

import type { ContaDoSite } from '@navegsistemas/dados/conta'
import { LIMITE_DO_EMAIL_DA_CONTA, normalizarEmail } from '@navegsistemas/domain'
import '@navegsistemas/ui/totem.css'

import { ConfiraSeuEmail, FALHA_DO_REENVIO } from './ConfiraSeuEmail'
import { contaConfigurada, emailLembrado } from './conta-do-site'

export default function EsqueciASenha({ conta: contaDada }: { readonly conta?: ContaDoSite }) {
  const id = useId()
  const [conta] = useState(() => contaDada ?? contaConfigurada(null))
  const [email, setEmail] = useState('')
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)
  const [pedido, setPedido] = useState<string | null>(null)

  useEffect(() => setEmail((atual) => (atual === '' ? emailLembrado() : atual)), [])

  const normalizado = normalizarEmail(email)
  const erro = tentou && normalizado === null

  async function pedir(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (normalizado === null) return
    setEnviando(true)
    const resultado = await conta.esqueci(normalizado)
    setEnviando(false)
    if (resultado.caso === 'CONFIRA_O_EMAIL') setPedido(normalizado)
    else setFalha(FALHA_DO_REENVIO[resultado.porque])
  }

  if (pedido !== null) return <ConfiraSeuEmail conta={conta} email={pedido} caminho="SENHA" />

  return (
    <form className="conta-formulario conta-ilha" method="post" onSubmit={(e) => void pedir(e)} noValidate>
      <h1>Esqueci a senha</h1>
      <p className="conta-ajuda">Informe o e-mail da conta. Mandamos um link para você criar uma senha nova.</p>
      <div className="totem-campo">
        <label htmlFor={`${id}-email`}>E-mail</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          maxLength={LIMITE_DO_EMAIL_DA_CONTA}
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={erro}
          aria-describedby={erro ? `${id}-email-erro` : undefined}
        />
        {erro && (
          <p id={`${id}-email-erro`} className="totem-erro">
            Informe o e-mail da conta, como voce@exemplo.com.
          </p>
        )}
      </div>
      {falha !== null && (
        <div className="totem-aviso" role="alert">
          <p>{falha}</p>
        </div>
      )}
      <button type="submit" className="acao conta-enviar" disabled={enviando}>
        {enviando ? 'Mandando…' : 'Mandar o link'}
      </button>
      <p className="conta-ajuda">
        <a href="/conta/">Voltar para Entrar</a>
      </p>
    </form>
  )
}
