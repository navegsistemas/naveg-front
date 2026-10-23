/**
 * **O link de confirmação aberto** — a 3.2, estados 3 e 4 (decidida pelo PO em 2026-10-16), em `/conta/confirmar`.
 *
 * O link é `/conta/confirmar#<contaId>.<codigo>`: o que vem depois do `#` não chega ao servidor no pedido da página, nem
 * aos logs, nem ao `Referer` (ADR-0003, seção 3). A ilha o lê, **tira do endereço** (para não ficar no histórico nem
 * num print), e o manda à API num `POST`.
 *
 * - **Confirmado** (C): a pessoa já fica dentro da conta neste aparelho (o cookie vem na resposta). O destino é Minha
 *   conta, que é a 4.1; até ela existir, a tela confirma e leva à reserva.
 * - **Já confirmado** (o link aberto de novo): "Este e-mail já está confirmado".
 * - **Venceu** (24 horas) ou **não vale mais** (trocado por um mais novo, ou cortado): pedir um link novo pelo e-mail
 *   da conta. A resposta é sempre a mesma, tenha ou não conta com aquele e-mail.
 * - **Sem conexão**: o "Tentar de novo", e o WhatsApp.
 *
 * O resultado não puxa o foco: ele chega ao abrir a página, e o primeiro Tab continua sendo o "Pular para o conteúdo".
 * Só o "Confira seu e-mail", que vem depois de a pessoa pedir o link, leva o foco ao título.
 */
import { useEffect, useId, useState, type FormEvent } from 'react'

import type { ContaDoSite, ResultadoDaConfirmacao } from '@navegsistemas/dados/conta'
import { LIMITE_DO_EMAIL_DA_CONTA, normalizarEmail } from '@navegsistemas/domain'
import '@navegsistemas/ui/totem.css'

import { ConfiraSeuEmail, FALHA_DO_REENVIO } from './ConfiraSeuEmail'
import { contaConfigurada, WHATSAPP_DA_CONTA } from './conta-do-site'

/** O que o link leva depois do `#`: o id da conta e o código, como a API os confere. */
const LINK = /^#?([A-Za-z0-9_-]{1,40})\.([A-Za-z0-9_-]{43})$/

export function linkDoEndereco(hash: string): { readonly contaId: string; readonly codigo: string } | null {
  const [, contaId, codigo] = LINK.exec(hash) ?? []
  return contaId === undefined || codigo === undefined ? null : { contaId, codigo }
}

type Estado =
  | { readonly caso: 'CONFERINDO' }
  | ResultadoDaConfirmacao
  | { readonly caso: 'LINK_PEDIDO'; readonly email: string }

export const TEXTO_DO_LINK = {
  JA_CONFIRMADO: { titulo: 'Este e-mail já está confirmado', texto: 'O link já foi usado. Sua conta está pronta.' },
  LINK_VENCIDO: {
    titulo: 'Este link venceu',
    texto: 'Os links valem por 24 horas. Peça um novo: ele chega no e-mail da conta.',
  },
  LINK_INVALIDO: {
    titulo: 'Este link não vale mais',
    texto: 'Ele foi trocado por um mais novo, ou chegou incompleto. Peça um novo: ele chega no e-mail da conta.',
  },
} as const

export default function ConfirmarEmail({ conta: contaDada }: { readonly conta?: ContaDoSite }) {
  const [conta] = useState(() => contaDada ?? contaConfigurada(null))
  const [estado, setEstado] = useState<Estado>({ caso: 'CONFERINDO' })
  const [tentativa, setTentativa] = useState(0)
  const [link] = useState(() => (typeof window === 'undefined' ? null : linkDoEndereco(window.location.hash)))

  useEffect(() => {
    /* O código sai do endereço já: não fica no histórico, nem no que se copiar da barra. */
    if (window.location.hash !== '') history.replaceState(null, '', window.location.pathname)
  }, [])

  useEffect(() => {
    let vivo = true
    if (link === null) {
      setEstado({ caso: 'LINK_INVALIDO' })
      return undefined
    }
    setEstado({ caso: 'CONFERINDO' })
    void conta.confirmar(link.contaId, link.codigo).then((resultado) => vivo && setEstado(resultado))
    return () => {
      vivo = false
    }
  }, [conta, link, tentativa])

  switch (estado.caso) {
    case 'CONFERINDO':
      return (
        <section className="conta-cartao conta-ilha" aria-busy="true">
          <h1>Confirmar o e-mail</h1>
          <p>Conferindo o link…</p>
        </section>
      )
    case 'EMAIL_CONFIRMADO':
      return (
        <section className="conta-cartao">
          <h1>E-mail confirmado</h1>
          <p className="conta-ok" role="status">
            Sua conta está pronta, e você já está dentro dela neste aparelho.
          </p>
          <a className="acao conta-enviar" href="/#totem">
            Reservar agora
          </a>
        </section>
      )
    case 'JA_CONFIRMADO':
      return (
        <section className="conta-cartao">
          <h1>{TEXTO_DO_LINK.JA_CONFIRMADO.titulo}</h1>
          <p>{TEXTO_DO_LINK.JA_CONFIRMADO.texto}</p>
        </section>
      )
    case 'LINK_VENCIDO':
    case 'LINK_INVALIDO':
      return (
        <PedirLinkNovo
          conta={conta}
          titulo={TEXTO_DO_LINK[estado.caso].titulo}
          texto={TEXTO_DO_LINK[estado.caso].texto}
          aoPedir={(email) => setEstado({ caso: 'LINK_PEDIDO', email })}
        />
      )
    case 'LINK_PEDIDO':
      return <ConfiraSeuEmail conta={conta} email={estado.email} />
    case 'FALHA':
      return (
        <section className="conta-cartao">
          <h1>Não deu para confirmar agora</h1>
          <div className="totem-aviso" role="alert">
            <p>
              {estado.porque === 'LIMITE'
                ? 'Muitos pedidos deste aparelho em pouco tempo. Tente de novo daqui a alguns minutos.'
                : 'A internet pode ter caído, ou o sistema está fora do ar por um instante. O link continua valendo.'}
            </p>
            <AtendimentoPeloWhatsApp />
          </div>
          <button type="button" className="acao conta-enviar" onClick={() => setTentativa((n) => n + 1)}>
            Tentar de novo
          </button>
        </section>
      )
  }
}

function AtendimentoPeloWhatsApp() {
  return WHATSAPP_DA_CONTA === null ? null : (
    <p>
      Se não der certo, fale com o atendimento pelo <a href={WHATSAPP_DA_CONTA.link}>WhatsApp</a>: {WHATSAPP_DA_CONTA.numero}.
    </p>
  )
}

/** Pedir um link novo pelo e-mail da conta (3.2, estado 4). */
function PedirLinkNovo({
  conta,
  titulo,
  texto,
  aoPedir,
}: {
  readonly conta: ContaDoSite
  readonly titulo: string
  readonly texto: string
  readonly aoPedir: (email: string) => void
}) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)
  const normalizado = normalizarEmail(email)

  async function pedir(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (normalizado === null) return
    setEnviando(true)
    const resultado = await conta.reenviar(normalizado)
    setEnviando(false)
    if (resultado.caso === 'CONFIRA_O_EMAIL') aoPedir(normalizado)
    else setFalha(FALHA_DO_REENVIO[resultado.porque])
  }

  const erro = tentou && normalizado === null
  return (
    <form className="conta-formulario" method="post" onSubmit={(e) => void pedir(e)} noValidate>
      <h1>{titulo}</h1>
      <p className="conta-ajuda">{texto}</p>
      <div className="totem-campo">
        <label htmlFor={`${id}-email`}>E-mail da conta</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LIMITE_DO_EMAIL_DA_CONTA}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={erro}
          aria-describedby={erro ? `${id}-email-erro` : undefined}
        />
        {erro && (
          <p id={`${id}-email-erro`} className="totem-erro">
            Informe um e-mail, como voce@exemplo.com.
          </p>
        )}
      </div>
      {falha !== null && (
        <div className="totem-aviso" role="alert">
          <p>{falha}</p>
        </div>
      )}
      <button type="submit" className="acao conta-enviar" disabled={enviando}>
        {enviando ? 'Mandando…' : 'Mandar um link novo'}
      </button>
      <AtendimentoPeloWhatsApp />
    </form>
  )
}
