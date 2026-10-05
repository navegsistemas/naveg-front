/**
 * **Os passos em que se digita** — o cliente (e, na encomenda, o destinatário), a cilindrada e o volume.
 *
 * O rascunho do que se digita fica **aqui dentro**, e só vai às respostas no "Continuar". Não é estado de
 * aplicação: é o texto do campo. Se cada tecla fosse resposta, a primeira letra do nome já responderia o passo
 * e o roteiro saltaria para a conferência no meio da digitação.
 *
 * A validação que dá para fazer na hora é feita na hora, **com as regras do domínio** — o mesmo
 * `normalizarWhatsapp` que a montagem usa. É o que evita a pessoa só descobrir o telefone errado na
 * conferência, depois de ter voltado e redigitado tudo.
 */
import { useId, useState, type FormEvent } from 'react'

import {
  LIMITE_DE_VOLUMES,
  LIMITE_DO_COMPLEMENTO,
  LIMITE_DO_NOME,
  LIMITE_DO_TELEFONE,
  normalizarWhatsapp,
  TipoVolume,
  type RascunhoDoCliente,
} from '@navegsistemas/domain'

import { EscolhaEmCartoes } from './EscolhaEmCartoes.js'

export interface PropsDoFormularioDoCliente {
  readonly inicial: RascunhoDoCliente | undefined
  readonly aoConfirmar: (cliente: RascunhoDoCliente) => void
  /**
   * O celular passa a ser obrigatório: o destinatário da encomenda, e quem manda quando é quem retira (C5 e C12).
   * O padrão é o do totem de passagem — opcional.
   */
  readonly telefoneObrigatorio?: boolean
  /** O que dizer quando falta o nome — de quem reserva, por padrão. */
  readonly erroDoNome?: string
}

export function FormularioDoCliente({
  inicial,
  aoConfirmar,
  telefoneObrigatorio = false,
  erroDoNome = 'Informe o nome de quem faz a reserva.',
}: PropsDoFormularioDoCliente) {
  const id = useId()
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [telefone, setTelefone] = useState(inicial?.telefone ?? '')
  const [tentou, setTentou] = useState(false)

  const nomeVazio = nome.trim().length === 0
  const telefoneVazio = telefone.trim().length === 0
  const telefoneInvalido = telefoneVazio ? telefoneObrigatorio : normalizarWhatsapp(telefone) === null
  const erroDoTelefone = telefoneObrigatorio
    ? 'Informe um celular com DDD, como (91) 98888-7777.'
    : 'Precisa ser um celular com DDD — ou deixe em branco.'

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (nomeVazio || telefoneInvalido) return
    aoConfirmar({ nome: nome.trim(), ...(telefone.trim().length > 0 ? { telefone: telefone.trim() } : {}) })
  }

  return (
    <form className="totem-formulario" onSubmit={enviar} noValidate>
      <div className="totem-campo">
        <label htmlFor={`${id}-nome`}>Nome</label>
        <input
          id={`${id}-nome`}
          name="nome"
          autoComplete="name"
          maxLength={LIMITE_DO_NOME}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-invalid={tentou && nomeVazio}
          aria-describedby={tentou && nomeVazio ? `${id}-nome-erro` : undefined}
        />
        {tentou && nomeVazio && (
          <p id={`${id}-nome-erro`} className="totem-erro">
            {erroDoNome}
          </p>
        )}
      </div>

      <div className="totem-campo">
        <label htmlFor={`${id}-telefone`}>
          Celular com DDD{!telefoneObrigatorio && <> <span className="totem-opcional">(opcional)</span></>}
        </label>
        <input
          id={`${id}-telefone`}
          name="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(91) 98888-7777"
          maxLength={LIMITE_DO_TELEFONE}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          aria-invalid={tentou && telefoneInvalido}
          aria-describedby={tentou && telefoneInvalido ? `${id}-telefone-erro` : undefined}
        />
        {tentou && telefoneInvalido && (
          <p id={`${id}-telefone-erro`} className="totem-erro">
            {erroDoTelefone}
          </p>
        )}
      </div>

      <button type="submit" className="acao totem-continuar">
        Continuar
      </button>
    </form>
  )
}

export interface PropsDaCilindrada {
  readonly inicial: number | undefined
  readonly aoConfirmar: (cilindrada: number) => void
}

export function CampoDeCilindrada({ inicial, aoConfirmar }: PropsDaCilindrada) {
  const id = useId()
  const [texto, setTexto] = useState(inicial === undefined ? '' : String(inicial))
  const [tentou, setTentou] = useState(false)

  const valor = /^\d{1,4}$/.test(texto.trim()) ? Number(texto.trim()) : null
  const invalido = valor === null || valor <= 0

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (valor === null || valor <= 0) return
    aoConfirmar(valor)
  }

  return (
    <form className="totem-formulario" onSubmit={enviar} noValidate>
      <div className="totem-campo">
        <label htmlFor={`${id}-cc`}>Cilindrada (cc)</label>
        <input
          id={`${id}-cc`}
          name="cilindrada"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="160"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={tentou && invalido}
          aria-describedby={tentou && invalido ? `${id}-cc-erro` : undefined}
        />
        {tentou && invalido && (
          <p id={`${id}-cc-erro`} className="totem-erro">
            Informe a cilindrada em números, como 160.
          </p>
        )}
      </div>
      <button type="submit" className="acao totem-continuar">
        Continuar
      </button>
    </form>
  )
}

/** O que o passo do volume escreve nas respostas: o tipo, quantos, e o complemento, se houver. */
export interface RespostaDoVolume {
  readonly tipoVolume: TipoVolume
  readonly quantidadeVolumes: number
  readonly complemento?: string
}

export interface PropsDoFormularioDoVolume {
  readonly tipos: readonly TipoVolume[]
  readonly inicial: Partial<RespostaDoVolume>
  readonly aoConfirmar: (volume: RespostaDoVolume) => void
}

/**
 * **O que vai** — o tipo, a quantidade e o complemento, numa tela só (C3). O tipo é escolhido em cartão, como
 * os outros passos; aqui o toque só marca, porque a quantidade ainda falta.
 */
export function FormularioDoVolume({ tipos, inicial, aoConfirmar }: PropsDoFormularioDoVolume) {
  const id = useId()
  const [tipo, setTipo] = useState<TipoVolume | undefined>(inicial.tipoVolume)
  const [quantidade, setQuantidade] = useState(String(inicial.quantidadeVolumes ?? 1))
  const [complemento, setComplemento] = useState(inicial.complemento ?? '')
  const [tentou, setTentou] = useState(false)

  const numero = /^\d{1,2}$/.test(quantidade.trim()) ? Number(quantidade.trim()) : null
  const quantidadeInvalida = numero === null || numero < 1 || numero > LIMITE_DE_VOLUMES
  const semTipo = tipo === undefined

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (tipo === undefined || numero === null || quantidadeInvalida) return
    const texto = complemento.trim()
    aoConfirmar({ tipoVolume: tipo, quantidadeVolumes: numero, ...(texto.length > 0 ? { complemento: texto } : {}) })
  }

  return (
    <form className="totem-formulario" onSubmit={enviar} noValidate>
      <fieldset className="totem-campo totem-grupo" aria-describedby={tentou && semTipo ? `${id}-tipo-erro` : undefined}>
        <legend>Tipo do volume</legend>
        <EscolhaEmCartoes
          opcoes={tipos.map((valor) => ({ valor, rotulo: TipoVolume.rotulo(valor) }))}
          escolhida={tipo}
          aoEscolher={setTipo}
        />
        {tentou && semTipo && (
          <p id={`${id}-tipo-erro`} className="totem-erro">
            Escolha o tipo do volume.
          </p>
        )}
      </fieldset>

      <div className="totem-campo">
        <label htmlFor={`${id}-quantidade`}>Quantos volumes</label>
        <input
          id={`${id}-quantidade`}
          name="quantidadeVolumes"
          inputMode="numeric"
          pattern="[0-9]*"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          aria-invalid={tentou && quantidadeInvalida}
          aria-describedby={tentou && quantidadeInvalida ? `${id}-quantidade-erro` : undefined}
        />
        {tentou && quantidadeInvalida && (
          <p id={`${id}-quantidade-erro`} className="totem-erro">
            De 1 a {LIMITE_DE_VOLUMES} volumes.
          </p>
        )}
      </div>

      <div className="totem-campo">
        <label htmlFor={`${id}-complemento`}>
          O que é <span className="totem-opcional">(opcional)</span>
        </label>
        <input
          id={`${id}-complemento`}
          name="complemento"
          placeholder="mantimentos, peças, roupas…"
          maxLength={LIMITE_DO_COMPLEMENTO}
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
        />
      </div>

      <button type="submit" className="acao totem-continuar">
        Continuar
      </button>
    </form>
  )
}
