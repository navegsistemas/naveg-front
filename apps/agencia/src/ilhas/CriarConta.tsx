/**
 * **Criar a conta** — a 3.1 (decidida pelo PO em 2026-10-16, A a F; o texto da versão 3 do wireframe).
 *
 * Uma página, dois grupos: "Seus dados" (nome e nascimento) e "Contato e acesso" (e-mail, celular e senha). **O
 * documento não está aqui**: desde 2026-10-19 ele entra na primeira compra (fluviapp-kmp, ADR-0022 D6), e a API não o
 * pede no cadastro.
 *
 * - **Os erros ficam embaixo do campo**, quando a pessoa sai dele ou toca em "Criar conta", com o foco no primeiro
 *   errado (3.1, achado 4). A conferência é a do domínio (`pendenciasDoCadastro`), a mesma que a API refaz.
 * - **A senha** (C): pelo menos 8 caracteres, com "Mostrar" e sem "repita a senha". A comum ou vazada, quem recusa é
 *   a API, e a frase diz por quê.
 * - **Os termos** (F): uma frase acima do botão, com os dois links, sem caixa de marcar.
 * - **A verificação contra robô** é um passo visível acima do botão, como na conferência da reserva (2.8), com a ação
 *   `cadastro`.
 * - **A resposta é sempre "Confira seu e-mail"**, com conta nova ou com o e-mail que já tem conta (PO, 2026-10-21:
 *   "Não revelar"). O que vem depois é a 3.2.
 * - **A falha** (sem rede, a API fora, o limite, o robô) fica num quadro acima do botão, como na 2.6, e o que foi
 *   preenchido continua.
 */
import { useId, useMemo, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'

import { ContaEmMemoria, contaHttp, type ContaDoSite, type ResultadoDoCadastroNoSite } from '@navegsistemas/dados/conta'
import {
  DataCalendario,
  InstanteLocal,
  LIMITE_DO_EMAIL_DA_CONTA,
  LIMITE_DO_NOME_DA_CONTA,
  linkDeWhatsApp,
  pendenciasDoCadastro,
  TAMANHO_MINIMO_DA_SENHA,
  type PendenciaDoCadastro,
} from '@navegsistemas/domain'
import { mascaraDoCelular } from '@navegsistemas/ui'
import '@navegsistemas/ui/totem.css'

import { envioConfigurado, fonteConfigurada } from '../conteudo/api'
import { ATENDIMENTO, WHATSAPP_DAS_RESERVAS } from '../conteudo/atendimento'
import { FUSO_DA_OPERACAO } from '../conteudo/operacao'
import { verificacaoTurnstile } from './turnstile'
import { PassoDaVerificacao, useEstadoDaVerificacao } from './VerificacaoContraRobo'

/* Lidas no build, como no totem: a conta vai à API quando o catálogo vem dela e a chave do Turnstile existe. */
const ENVIO = envioConfigurado(fonteConfigurada(import.meta.env.PUBLIC_URL_DA_API), import.meta.env.PUBLIC_TURNSTILE_SITE_KEY)

/** O WhatsApp do atendimento, a saída quando a conta não se cria (2.6). */
const WHATSAPP =
  WHATSAPP_DAS_RESERVAS === null
    ? null
    : { numero: WHATSAPP_DAS_RESERVAS, link: linkDeWhatsApp(WHATSAPP_DAS_RESERVAS, ATENDIMENTO.mensagemInicial) }

/** O dia de hoje em Belém: a idade mínima conta por ele, como na API. */
const hojeEmBelem = () => InstanteLocal.data(InstanteLocal.emFuso(new Date(), FUSO_DA_OPERACAO))

/** O que dizer embaixo de cada campo. */
export const ERRO_DO_CAMPO: Readonly<Record<PendenciaDoCadastro | 'SENHA_COMUM' | 'SENHA_VAZADA', string>> = {
  NOME: 'Informe o seu nome completo.',
  NASCIMENTO: 'Informe a data de nascimento, como 20/05/1990.',
  MENOR_DE_IDADE: 'A conta é para maiores de 18 anos. Menores viajam com a passagem comprada por um responsável.',
  EMAIL: 'Informe um e-mail, como voce@exemplo.com.',
  TELEFONE: 'Informe um celular com DDD, como (91) 98888-7777.',
  SENHA_CURTA: `Use pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`,
  SENHA_COMUM: 'Esta senha é muito comum. Escolha outra.',
  SENHA_VAZADA: 'Esta senha já apareceu em vazamentos na internet. Escolha outra.',
}

/** A falha do envio, num quadro acima do botão (2.6). */
export const FALHA_DO_CADASTRO = {
  CONEXAO:
    'A conta não foi criada. A internet pode ter caído, ou o sistema está fora do ar por um instante. O que você preencheu continua aqui.',
  LIMITE: 'Muitas tentativas deste aparelho em pouco tempo. Tente de novo daqui a alguns minutos.',
  DESAFIO: 'A verificação contra robô não passou. Tente de novo.',
} as const

/** "20051990" ou "20/05/1990" → "20/05/1990" enquanto se digita. */
export function mascaraDaData(digitado: string): string {
  const d = digitado.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** "20/05/1990" → "1990-05-20", a forma que o domínio lê; qualquer outra coisa vira texto que ele recusa. */
export function dataIso(mascarada: string): string {
  const [dia, mes, ano] = mascarada.split('/')
  return dia?.length === 2 && mes?.length === 2 && ano?.length === 4 ? `${ano}-${mes}-${dia}` : mascarada
}

type Campo = 'nome' | 'nascimento' | 'email' | 'telefone' | 'senha'

/** A pendência → o campo onde ela aparece. */
const CAMPO_DA_PENDENCIA: Readonly<Record<PendenciaDoCadastro, Campo>> = {
  NOME: 'nome',
  NASCIMENTO: 'nascimento',
  MENOR_DE_IDADE: 'nascimento',
  EMAIL: 'email',
  TELEFONE: 'telefone',
  SENHA_CURTA: 'senha',
}
const ORDEM: readonly Campo[] = ['nome', 'nascimento', 'email', 'telefone', 'senha']

type Estado =
  | { readonly caso: 'PREENCHENDO' }
  | { readonly caso: 'ENVIANDO' }
  | { readonly caso: 'FALHA'; readonly porque: keyof typeof FALHA_DO_CADASTRO }
  | { readonly caso: 'CONFIRA_O_EMAIL'; readonly email: string }

export interface PropsDoCriarConta {
  /** Os cenários passam a conta; a página não passa nada, e a ilha monta a da configuração. */
  readonly conta?: ContaDoSite
  readonly hoje?: () => DataCalendario
}

export default function CriarConta({ conta: contaDada, hoje = hojeEmBelem }: PropsDoCriarConta) {
  const id = useId()
  const verificacao = useMemo(
    () => (contaDada === undefined && ENVIO.tipo === 'API' ? verificacaoTurnstile(ENVIO.chaveDoDesafio, 'cadastro') : null),
    [contaDada],
  )
  const conta = useMemo<ContaDoSite>(
    () => contaDada ?? (ENVIO.tipo === 'API' && verificacao !== null ? contaHttp(ENVIO.url, verificacao.obterDesafio) : new ContaEmMemoria(hoje)),
    [contaDada, verificacao, hoje],
  )
  const estadoDaVerificacao = useEstadoDaVerificacao(verificacao)

  const [valores, setValores] = useState<Record<Campo, string>>({ nome: '', nascimento: '', email: '', telefone: '', senha: '' })
  const [tocados, setTocados] = useState<ReadonlySet<Campo>>(new Set())
  const [doServidor, setDoServidor] = useState<Partial<Record<Campo, string>>>({})
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [estado, setEstado] = useState<Estado>({ caso: 'PREENCHENDO' })
  const campos = useRef<Partial<Record<Campo, HTMLInputElement | null>>>({})

  const cadastro = {
    nome: valores.nome,
    dataNascimento: dataIso(valores.nascimento),
    email: valores.email,
    telefone: valores.telefone,
    senha: valores.senha,
  }
  /* Os erros do domínio, campo por campo; o do servidor vale até a pessoa mexer no campo. */
  const erros: Partial<Record<Campo, string>> = { ...doServidor }
  for (const pendencia of pendenciasDoCadastro(cadastro, hoje())) {
    erros[CAMPO_DA_PENDENCIA[pendencia]] ??= ERRO_DO_CAMPO[pendencia]
  }
  const erroVisivel = (campo: Campo) => (tocados.has(campo) ? erros[campo] : undefined)

  const mudar = (campo: Campo, valor: string) => {
    setValores((antes) => ({ ...antes, [campo]: valor }))
    setDoServidor(({ [campo]: _, ...resto }) => resto)
  }
  const tocar = (campo: Campo) => setTocados((antes) => new Set(antes).add(campo))

  function focarOPrimeiro(com: Partial<Record<Campo, string>>) {
    const primeiro = ORDEM.find((campo) => com[campo] !== undefined)
    if (primeiro !== undefined) campos.current[primeiro]?.focus()
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTocados(new Set(ORDEM))
    if (Object.keys(erros).length > 0) {
      focarOPrimeiro(erros)
      return
    }
    setEstado({ caso: 'ENVIANDO' })
    const resultado: ResultadoDoCadastroNoSite = await conta.criar(cadastro)
    switch (resultado.caso) {
      case 'CONFIRA_O_EMAIL':
        setEstado({ caso: 'CONFIRA_O_EMAIL', email: valores.email.trim().toLowerCase() })
        return
      case 'INVALIDO': {
        const doCampo: Partial<Record<Campo, string>> = {}
        for (const p of resultado.pendencias) doCampo[CAMPO_DA_PENDENCIA[p]] ??= ERRO_DO_CAMPO[p]
        setDoServidor(doCampo)
        setEstado({ caso: 'PREENCHENDO' })
        focarOPrimeiro(doCampo)
        return
      }
      case 'SENHA_FRACA':
        setDoServidor({ senha: ERRO_DO_CAMPO[resultado.motivo] })
        setEstado({ caso: 'PREENCHENDO' })
        campos.current.senha?.focus()
        return
      case 'FALHA':
        setEstado({ caso: 'FALHA', porque: resultado.porque })
    }
  }

  if (estado.caso === 'CONFIRA_O_EMAIL') {
    return (
      <section className="conta-cartao" aria-labelledby={`${id}-confira`}>
        <h1 id={`${id}-confira`} tabIndex={-1} ref={(h) => h?.focus()}>
          Confira seu e-mail
        </h1>
        <p>
          Mandamos um link para <strong>{estado.email}</strong>. Toque nele para confirmar a conta. O link vale por 24
          horas; se não chegar em alguns minutos, procure no spam.
        </p>
      </section>
    )
  }

  const verificada = verificacao === null || estadoDaVerificacao === 'VERIFICADA'
  const enviando = estado.caso === 'ENVIANDO'

  const campo = (
    nome: Campo,
    rotulo: string,
    entrada: Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'value' | 'onChange' | 'onBlur'>,
    mascara: (texto: string) => string = (texto) => texto,
    depois?: ReactNode,
  ) => {
    const erro = erroVisivel(nome)
    return (
      <div className="totem-campo">
        <label htmlFor={`${id}-${nome}`}>{rotulo}</label>
        <div className={depois === undefined ? undefined : 'conta-com-botao'}>
          <input
            {...entrada}
            ref={(el) => {
              campos.current[nome] = el
            }}
            id={`${id}-${nome}`}
            name={nome}
            value={valores[nome]}
            onChange={(e) => mudar(nome, mascara(e.target.value))}
            onBlur={() => tocar(nome)}
            aria-invalid={erro !== undefined}
            aria-describedby={erro === undefined ? undefined : `${id}-${nome}-erro`}
          />
          {depois}
        </div>
        {erro !== undefined && (
          <p id={`${id}-${nome}-erro`} className="totem-erro">
            {erro}
          </p>
        )}
      </div>
    )
  }

  return (
    <form className="conta-formulario" method="post" onSubmit={enviar} noValidate>
      <h1>Criar sua conta</h1>
      <p className="conta-ajuda">
        Com a conta, você compra passagens para você ou para outra pessoa, e reserva veículos e encomendas com o
        atendimento.
      </p>

      <fieldset className="conta-grupo">
        <legend>Seus dados</legend>
        <p className="conta-ajuda">Para comprar para outra pessoa, basta ter o documento e a data de nascimento dela.</p>
        {campo('nome', 'Nome completo', {
          autoComplete: 'name',
          maxLength: LIMITE_DO_NOME_DA_CONTA,
          placeholder: 'Como está no documento',
        })}
        {campo(
          'nascimento',
          'Data de nascimento',
          { autoComplete: 'bday', inputMode: 'numeric', placeholder: 'dd/mm/aaaa', maxLength: 10 },
          mascaraDaData,
        )}
      </fieldset>

      <fieldset className="conta-grupo">
        <legend>Contato e acesso</legend>
        <p className="conta-ajuda">O e-mail confirma a conta. Por ele e pelo celular, falamos com você sobre seus pedidos.</p>
        <div className="conta-par">
          {campo('email', 'E-mail', {
            type: 'email',
            inputMode: 'email',
            autoComplete: 'email',
            maxLength: LIMITE_DO_EMAIL_DA_CONTA,
            placeholder: 'voce@exemplo.com',
          })}
          {campo(
            'telefone',
            'Celular com WhatsApp',
            { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '(91) 98888-7777' },
            mascaraDoCelular,
          )}
        </div>
        {campo(
          'senha',
          'Senha',
          {
            type: mostrarSenha ? 'text' : 'password',
            autoComplete: 'new-password',
            maxLength: 128,
            placeholder: `Pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres`,
          },
          undefined,
          <button
            type="button"
            className="acao acao--secundaria conta-mostrar"
            aria-pressed={mostrarSenha}
            onClick={() => setMostrarSenha((antes) => !antes)}
          >
            {mostrarSenha ? 'Esconder' : 'Mostrar'}
          </button>,
        )}
      </fieldset>

      <p className="conta-termos">
        Ao criar a conta, você concorda com os <a href="/termos/">Termos de Uso</a> e a{' '}
        <a href="/privacidade/">Política de Privacidade</a>.
      </p>

      {verificacao !== null && estadoDaVerificacao !== null && (
        <PassoDaVerificacao verificacao={verificacao} estado={estadoDaVerificacao} />
      )}

      {estado.caso === 'FALHA' && (
        <div className="totem-aviso" role="alert">
          <p>{FALHA_DO_CADASTRO[estado.porque]}</p>
          {estado.porque === 'CONEXAO' && WHATSAPP !== null && (
            <p>
              Se não der certo, fale com o atendimento pelo <a href={WHATSAPP.link}>WhatsApp</a>: {WHATSAPP.numero}.
            </p>
          )}
        </div>
      )}

      <button type="submit" className="acao conta-enviar" disabled={enviando || !verificada}>
        {enviando ? 'Criando…' : estado.caso === 'FALHA' ? 'Tentar de novo' : 'Criar conta'}
      </button>

      {ENVIO.tipo === 'MEMORIA' && contaDada === undefined && (
        <p className="totem-demonstracao">Demonstração: a conta não é criada de verdade, e nenhum e-mail sai.</p>
      )}
    </form>
  )
}
