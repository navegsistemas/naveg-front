/**
 * **Os dois passos em que se digita** — o cliente e a cilindrada.
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

import { normalizarWhatsapp, type RascunhoDoCliente } from '@naveg/domain'

export interface PropsDoFormularioDoCliente {
  readonly inicial: RascunhoDoCliente | undefined
  readonly aoConfirmar: (cliente: RascunhoDoCliente) => void
}

export function FormularioDoCliente({ inicial, aoConfirmar }: PropsDoFormularioDoCliente) {
  const id = useId()
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [telefone, setTelefone] = useState(inicial?.telefone ?? '')
  const [tentou, setTentou] = useState(false)

  const nomeVazio = nome.trim().length === 0
  const telefoneInvalido = telefone.trim().length > 0 && normalizarWhatsapp(telefone) === null

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
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-invalid={tentou && nomeVazio}
          aria-describedby={tentou && nomeVazio ? `${id}-nome-erro` : undefined}
        />
        {tentou && nomeVazio && (
          <p id={`${id}-nome-erro`} className="totem-erro">
            Informe o nome de quem faz a reserva.
          </p>
        )}
      </div>

      <div className="totem-campo">
        <label htmlFor={`${id}-telefone`}>
          Celular com DDD <span className="totem-opcional">(opcional)</span>
        </label>
        <input
          id={`${id}-telefone`}
          name="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(91) 98888-7777"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          aria-invalid={tentou && telefoneInvalido}
          aria-describedby={tentou && telefoneInvalido ? `${id}-telefone-erro` : undefined}
        />
        {tentou && telefoneInvalido && (
          <p id={`${id}-telefone-erro`} className="totem-erro">
            Precisa ser um celular com DDD — ou deixe em branco.
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
