/**
 * **A página da conta, `/conta`** — entrar e sair, a 3.3 (decidida pelo PO em 2026-10-16, A a F; a sessão de 14 dias,
 * 2026-10-21), no lugar que a 3.5 A decidiu: quem não entrou vê o entrar; quem entrou, a conta.
 *
 * - **Quem está dentro** vem da API (`GET /conta/sessao`): o cookie é `HttpOnly`, e a página não o lê.
 * - **Entrar**: e-mail e senha, com "Mostrar"; a verificação contra robô acima do botão, como no cadastro (ação
 *   `entrar`). As respostas:
 *   - **"E-mail ou senha não conferem"** (B), a mesma frase para o e-mail sem conta e a senha errada;
 *   - **5 erros seguidos → 15 minutos** (C), com a frase que não diz se o e-mail tem conta;
 *   - **a conta desativada** (F), só depois da senha certa: a tela própria, com o WhatsApp e a reserva sem conta.
 * - **Dentro**: até a 4.1 (Minha conta), o miolo diz que a pessoa está na conta e, sem o e-mail confirmado, o aviso
 *   "Confirme seu e-mail para comprar" (3.2, D). **O "Sair" fica no fim** (D).
 * - **Sair**: "Você saiu da sua conta neste aparelho", e a tela de entrar — num aparelho emprestado, é aqui que a pessoa
 *   confere.
 *
 * Ficam para as seções delas: o "Esqueci a senha" (3.4) e a volta à compra (U3, com a 7.6).
 */
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'

import type { ContaDoSite } from '@navegsistemas/dados/conta'
import { LIMITE_DO_EMAIL_DA_CONTA, normalizarEmail } from '@navegsistemas/domain'
import '@navegsistemas/ui/totem.css'

import { contaConfigurada, ENVIO_DA_CONTA, WHATSAPP_DA_CONTA } from './conta-do-site'
import { verificacaoTurnstile } from './turnstile'
import { PassoDaVerificacao, useEstadoDaVerificacao } from './VerificacaoContraRobo'

/** O que dizer quando não entra (3.3, B, C e as falhas da 2.6). */
export const ERRO_DO_ENTRAR = {
  CREDENCIAIS_INVALIDAS: 'E-mail ou senha não conferem. Confira e tente de novo.',
  TENTATIVAS_DEMAIS: 'Muitas tentativas com este e-mail. Espere 15 minutos para tentar de novo.',
  CONEXAO:
    'Não deu para entrar agora. A internet pode ter caído, ou o sistema está fora do ar por um instante. Tente de novo.',
  LIMITE: 'Muitas tentativas deste aparelho em pouco tempo. Tente de novo daqui a alguns minutos.',
  DESAFIO: 'A verificação contra robô não passou. Tente de novo.',
} as const

type Estado =
  | { readonly caso: 'CONFERINDO' }
  | { readonly caso: 'FORA'; readonly saiu: boolean }
  | { readonly caso: 'DENTRO'; readonly confirmada: boolean }
  | { readonly caso: 'DESATIVADA' }

export default function PortaDaConta({ conta: contaDada }: { readonly conta?: ContaDoSite }) {
  const verificacao = useMemo(
    () => (contaDada === undefined && ENVIO_DA_CONTA.tipo === 'API' ? verificacaoTurnstile(ENVIO_DA_CONTA.chaveDoDesafio, 'entrar') : null),
    [contaDada],
  )
  const conta = useMemo(() => contaDada ?? contaConfigurada(verificacao?.obterDesafio ?? null), [contaDada, verificacao])
  const [estado, setEstado] = useState<Estado>({ caso: 'CONFERINDO' })

  useEffect(() => {
    let vivo = true
    void conta.sessao().then((sessao) => {
      if (!vivo) return
      /* Sem saber (a rede), o entrar: quem já está dentro entra de novo, e o cookie se refaz. */
      setEstado(sessao.caso === 'DENTRO' ? { caso: 'DENTRO', confirmada: sessao.confirmada } : { caso: 'FORA', saiu: false })
    })
    return () => {
      vivo = false
    }
  }, [conta])

  switch (estado.caso) {
    case 'CONFERINDO':
      return (
        <section className="conta-cartao conta-ilha" aria-busy="true">
          <h1>Minha conta</h1>
          <p>Conferindo se você já entrou neste aparelho…</p>
        </section>
      )
    case 'FORA':
      return (
        <Entrar
          conta={conta}
          verificacao={verificacao}
          saiu={estado.saiu}
          aoEntrar={(confirmada) => setEstado({ caso: 'DENTRO', confirmada })}
          aoAcharDesativada={() => setEstado({ caso: 'DESATIVADA' })}
        />
      )
    case 'DESATIVADA':
      return (
        <section className="conta-cartao">
          <h1 tabIndex={-1} ref={(h) => h?.focus()}>
            Esta conta está desativada
          </h1>
          {WHATSAPP_DA_CONTA !== null && (
            <p>
              Para saber por quê, ou reativar, fale com o atendimento pelo <a href={WHATSAPP_DA_CONTA.link}>WhatsApp</a>:{' '}
              {WHATSAPP_DA_CONTA.numero}.
            </p>
          )}
          <p>
            Você continua podendo <a href="/#totem">reservar pela página</a>, sem conta.
          </p>
        </section>
      )
    case 'DENTRO':
      return <Dentro conta={conta} confirmada={estado.confirmada} aoSair={() => setEstado({ caso: 'FORA', saiu: true })} />
  }
}

function Entrar({
  conta,
  verificacao,
  saiu,
  aoEntrar,
  aoAcharDesativada,
}: {
  readonly conta: ContaDoSite
  readonly verificacao: ReturnType<typeof verificacaoTurnstile> | null
  readonly saiu: boolean
  readonly aoEntrar: (confirmada: boolean) => void
  /** A senha certa de uma conta desativada pelo atendimento (F). */
  readonly aoAcharDesativada: () => void
}) {
  const id = useId()
  const estadoDaVerificacao = useEstadoDaVerificacao(verificacao)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<keyof typeof ERRO_DO_ENTRAR | null>(null)

  const emailInvalido = normalizarEmail(email) === null
  const senhaVazia = senha.length === 0
  const verificada = verificacao === null || estadoDaVerificacao === 'VERIFICADA'

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (emailInvalido || senhaVazia) return
    setEnviando(true)
    const resultado = await conta.entrar(email.trim(), senha)
    setEnviando(false)
    if (resultado.caso === 'DENTRO') aoEntrar(resultado.confirmada)
    else if (resultado.caso === 'CONTA_DESATIVADA') aoAcharDesativada()
    else setErro(resultado.caso === 'FALHA' ? resultado.porque : resultado.caso)
  }

  return (
    <form className="conta-formulario conta-ilha" method="post" onSubmit={(e) => void enviar(e)} noValidate>
      {saiu && (
        <p className="conta-ok" role="status">
          Você saiu da sua conta neste aparelho.
        </p>
      )}
      <h1>Entrar na sua conta</h1>

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
          aria-invalid={tentou && emailInvalido}
          aria-describedby={tentou && emailInvalido ? `${id}-email-erro` : undefined}
        />
        {tentou && emailInvalido && (
          <p id={`${id}-email-erro`} className="totem-erro">
            Informe o e-mail da conta, como voce@exemplo.com.
          </p>
        )}
      </div>

      <div className="totem-campo">
        <label htmlFor={`${id}-senha`}>Senha</label>
        <div className="conta-com-botao">
          <input
            id={`${id}-senha`}
            name="senha"
            type={mostrar ? 'text' : 'password'}
            autoComplete="current-password"
            maxLength={128}
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={tentou && senhaVazia}
            aria-describedby={tentou && senhaVazia ? `${id}-senha-erro` : undefined}
          />
          <button
            type="button"
            className="acao acao--secundaria conta-mostrar"
            aria-pressed={mostrar}
            onClick={() => setMostrar((antes) => !antes)}
          >
            {mostrar ? 'Esconder' : 'Mostrar'}
          </button>
        </div>
        {tentou && senhaVazia && (
          <p id={`${id}-senha-erro`} className="totem-erro">
            Informe a senha.
          </p>
        )}
      </div>

      {verificacao !== null && estadoDaVerificacao !== null && (
        <PassoDaVerificacao verificacao={verificacao} estado={estadoDaVerificacao} />
      )}

      {erro !== null && (
        <div className="totem-aviso" role="alert">
          <p>{ERRO_DO_ENTRAR[erro]}</p>
        </div>
      )}

      <button type="submit" className="acao conta-enviar" disabled={enviando || !verificada}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="conta-separa">ainda não tem conta?</p>
      <a className="acao acao--secundaria conta-enviar" href="/conta/criar/">
        Criar conta
      </a>
      <p className="conta-ajuda">
        Para reservar, não precisa de conta: <a href="/#totem">reserve pela página</a>.
      </p>
    </form>
  )
}

function Dentro({
  conta,
  confirmada,
  aoSair,
}: {
  readonly conta: ContaDoSite
  readonly confirmada: boolean
  readonly aoSair: () => void
}) {
  const [saindo, setSaindo] = useState(false)
  const [falhou, setFalhou] = useState(false)

  async function sair() {
    setSaindo(true)
    const saiu = await conta.sair()
    setSaindo(false)
    if (saiu) aoSair()
    else setFalhou(true)
  }

  return (
    <section className="conta-cartao">
      <h1>Minha conta</h1>
      <p>Você está na sua conta neste aparelho.</p>
      {!confirmada && <p className="totem-aviso">Confirme seu e-mail para comprar passagens: o link está no seu e-mail.</p>}
      <a className="acao conta-enviar" href="/#totem">
        Reservar agora
      </a>
      {falhou && (
        <div className="totem-aviso" role="alert">
          <p>Não deu para sair agora. A internet pode ter caído. Tente de novo.</p>
        </div>
      )}
      <button type="button" className="acao acao--secundaria conta-enviar" disabled={saindo} onClick={() => void sair()}>
        {saindo ? 'Saindo…' : 'Sair'}
      </button>
    </section>
  )
}
