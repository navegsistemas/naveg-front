/**
 * **A senha nova, pelo link do e-mail** — a 3.4, estados 3 e 4 (decidida pelo PO em 2026-10-16, A a F), em
 * `/conta/nova-senha`.
 *
 * O link é `/conta/nova-senha#<contaId>.<codigo>`, como o da confirmação (ADR-0003, seção 3): a ilha o lê, **tira do
 * endereço**, e só o manda à API com a senha nova.
 *
 * - **A senha** segue a 3.1 (C): 8 caracteres, com "Mostrar"; a comum ou vazada, a API recusa, com o motivo.
 * - **Trocada** (C e D): a pessoa já fica dentro neste aparelho, e sai dos outros; o e-mail "Sua senha foi trocada" é da
 *   API. A conta sem o e-mail confirmado fica confirmada (E).
 * - **O link que não vale mais**: um texto só para vencido, usado e trocado — a pessoa faz a mesma coisa nos três.
 * - **A conta desativada** depois do pedido: a tela da 3.3, F.
 *
 * Nada puxa o foco ao abrir a página (o primeiro Tab é o "Pular para o conteúdo"); só a senha trocada, que vem de um
 * gesto, leva o foco ao aviso.
 */
import { useEffect, useId, useState, type FormEvent } from 'react'

import type { ContaDoSite } from '@navegsistemas/dados/conta'
import { TAMANHO_MINIMO_DA_SENHA } from '@navegsistemas/domain'
import '@navegsistemas/ui/totem.css'

import { contaConfigurada, linkDoEndereco, WHATSAPP_DA_CONTA } from './conta-do-site'

export const ERRO_DA_SENHA_NOVA = {
  SENHA_CURTA: `Use pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`,
  SENHA_COMUM: 'Esta senha é muito comum. Escolha outra.',
  SENHA_VAZADA: 'Esta senha já apareceu em vazamentos na internet. Escolha outra.',
  CONEXAO: 'A senha não foi trocada. A internet pode ter caído. O link continua valendo: tente de novo.',
  LIMITE: 'Muitas tentativas deste aparelho em pouco tempo. Tente de novo daqui a alguns minutos.',
} as const

type Estado = { readonly caso: 'DIGITANDO' } | { readonly caso: 'TROCADA' | 'LINK_NAO_VALE' | 'DESATIVADA' }

export default function NovaSenha({ conta: contaDada }: { readonly conta?: ContaDoSite }) {
  const id = useId()
  const [conta] = useState(() => contaDada ?? contaConfigurada(null))
  const [link] = useState(() => (typeof window === 'undefined' ? null : linkDoEndereco(window.location.hash)))
  const [estado, setEstado] = useState<Estado>({ caso: 'DIGITANDO' })
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<keyof typeof ERRO_DA_SENHA_NOVA | null>(null)

  useEffect(() => {
    if (window.location.hash !== '') history.replaceState(null, '', window.location.pathname)
    /* Sem o link no endereço (aberto à mão, ou cortado no e-mail), não há o que digitar. */
    if (link === null) setEstado({ caso: 'LINK_NAO_VALE' })
  }, [link])

  const curta = senha.length < TAMANHO_MINIMO_DA_SENHA
  const erroDoCampo = tentou && curta ? 'SENHA_CURTA' : erro !== null && erro.startsWith('SENHA_') ? erro : null
  const erroDoEnvio = erro === 'CONEXAO' || erro === 'LIMITE' ? erro : null

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (curta || link === null) return
    setEnviando(true)
    const resultado = await conta.novaSenha(link.contaId, link.codigo, senha)
    setEnviando(false)
    switch (resultado.caso) {
      case 'DENTRO':
        setEstado({ caso: 'TROCADA' })
        return
      case 'LINK_INVALIDO':
      case 'LINK_VENCIDO':
        setEstado({ caso: 'LINK_NAO_VALE' })
        return
      case 'CONTA_DESATIVADA':
        setEstado({ caso: 'DESATIVADA' })
        return
      case 'SENHA_FRACA':
        setErro(resultado.motivo)
        return
      case 'FALHA':
        setErro(resultado.porque)
    }
  }

  switch (estado.caso) {
    case 'TROCADA':
      return (
        <section className="conta-cartao">
          <h1>Senha trocada</h1>
          <p className="conta-ok" role="status" tabIndex={-1} ref={(p) => p?.focus()}>
            Você já está dentro da sua conta neste aparelho, e saiu dela nos outros.
          </p>
          <a className="acao conta-enviar" href="/conta/">
            Ir para Minha conta
          </a>
        </section>
      )
    case 'LINK_NAO_VALE':
      return (
        <section className="conta-cartao conta-ilha">
          <h1>Este link não vale mais</h1>
          <p>Ele vale por 1 hora e funciona uma vez. Peça um novo.</p>
          <a className="acao conta-enviar" href="/conta/esqueci/">
            Pedir um link novo
          </a>
          <p className="conta-ajuda">
            <a href="/conta/">Voltar para Entrar</a>
          </p>
        </section>
      )
    case 'DESATIVADA':
      return (
        <section className="conta-cartao">
          <h1>Esta conta está desativada</h1>
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
    case 'DIGITANDO':
      return (
        <form className="conta-formulario conta-ilha" method="post" onSubmit={(e) => void salvar(e)} noValidate>
          <h1>Crie uma senha nova</h1>
          <div className="totem-campo">
            <label htmlFor={`${id}-senha`}>Senha nova</label>
            <div className="conta-com-botao">
              <input
                id={`${id}-senha`}
                name="senha"
                type={mostrar ? 'text' : 'password'}
                autoComplete="new-password"
                maxLength={128}
                placeholder={`Pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres`}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value)
                  setErro(null)
                }}
                aria-invalid={erroDoCampo !== null}
                aria-describedby={erroDoCampo === null ? undefined : `${id}-senha-erro`}
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
            {erroDoCampo !== null && (
              <p id={`${id}-senha-erro`} className="totem-erro">
                {ERRO_DA_SENHA_NOVA[erroDoCampo]}
              </p>
            )}
          </div>
          {erroDoEnvio !== null && (
            <div className="totem-aviso" role="alert">
              <p>{ERRO_DA_SENHA_NOVA[erroDoEnvio]}</p>
            </div>
          )}
          <button type="submit" className="acao conta-enviar" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar a senha nova'}
          </button>
        </form>
      )
  }
}
