/**
 * **Quantos viajam** — 1, 2, 3, 4 ou "5 ou mais", que abre um contador (UI 2.2, decisão I; naveg-front#65). E, desde a
 * 2.7, quantos volumes vão na encomenda: o mesmo componente, com a unidade trocada.
 *
 * As opções vêm do nó, como em todo passo: este componente não sabe que o site vai até 50 nem que o quiosque vai até
 * a ocupação da acomodação. Ele só sabe que **mais de cinco opções não cabem em cartões** — e então mostra as quatro
 * primeiras, e o resto num contador que vai até a última.
 *
 * As quatro primeiras respondem com um toque, como os outros cartões. "5 ou mais" não responde: ele abre o contador,
 * e quem responde é o "Continuar".
 */
import { useId, useState, type FormEvent } from 'react'

import { EscolhaEmCartoes } from './EscolhaEmCartoes.js'

/** O que se conta: pessoas, ou os volumes da encomenda (2.7, decisão D). */
export interface UnidadeDaQuantidade {
  readonly singular: string
  readonly plural: string
  /** O rótulo do contador: "Quantas pessoas". */
  readonly pergunta: string
  readonly menos: string
  readonly mais: string
}

export const PESSOAS: UnidadeDaQuantidade = {
  singular: 'pessoa',
  plural: 'pessoas',
  pergunta: 'Quantas pessoas',
  menos: 'Uma pessoa a menos',
  mais: 'Uma pessoa a mais',
}

export const VOLUMES: UnidadeDaQuantidade = {
  singular: 'volume',
  plural: 'volumes',
  pergunta: 'Quantos volumes',
  menos: 'Um volume a menos',
  mais: 'Um volume a mais',
}

export interface PropsDaQuantidade {
  readonly opcoes: readonly number[]
  readonly escolhida: number | undefined
  readonly aoEscolher: (quantidade: number) => void
  /** Pessoas, por padrão. */
  readonly unidade?: UnidadeDaQuantidade
}

/** Até tantas opções, cada uma é um cartão. Acima, as primeiras e o contador. */
const CARTOES = 5

const MAIS = 'MAIS'

function contar(quantidade: number, unidade: UnidadeDaQuantidade): string {
  return `${quantidade} ${quantidade === 1 ? unidade.singular : unidade.plural}`
}

export function QuantidadeDePessoas({ opcoes, escolhida, aoEscolher, unidade = PESSOAS }: PropsDaQuantidade) {
  if (opcoes.length <= CARTOES) {
    return (
      <EscolhaEmCartoes
        opcoes={opcoes.map((valor) => ({ valor, rotulo: contar(valor, unidade) }))}
        escolhida={escolhida}
        aoEscolher={aoEscolher}
      />
    )
  }
  return <CartoesEContador opcoes={opcoes} escolhida={escolhida} aoEscolher={aoEscolher} unidade={unidade} />
}

function CartoesEContador({ opcoes, escolhida, aoEscolher, unidade = PESSOAS }: PropsDaQuantidade) {
  const id = useId()
  const primeiras = opcoes.slice(0, CARTOES - 1)
  const minimo = opcoes[CARTOES - 1] as number
  const maximo = opcoes[opcoes.length - 1] as number
  const noContador = escolhida !== undefined && escolhida >= minimo

  const [aberto, setAberto] = useState(noContador)
  const [texto, setTexto] = useState(String(noContador ? escolhida : minimo))
  const [tentou, setTentou] = useState(false)

  const numero = /^\d{1,3}$/.test(texto.trim()) ? Number(texto.trim()) : null
  const invalido = numero === null || !opcoes.includes(numero) || numero < minimo

  function somar(passo: number) {
    const atual = numero ?? minimo
    setTexto(String(Math.min(maximo, Math.max(minimo, atual + passo))))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (numero === null || invalido) return
    aoEscolher(numero)
  }

  return (
    <>
      <EscolhaEmCartoes<number | typeof MAIS>
        opcoes={[
          ...primeiras.map((valor) => ({ valor, rotulo: contar(valor, unidade) })),
          { valor: MAIS, rotulo: `${minimo} ou mais` },
        ]}
        escolhida={aberto ? MAIS : escolhida}
        aoEscolher={(valor) => (valor === MAIS ? setAberto(true) : aoEscolher(valor))}
      />

      {aberto && (
        <form className="totem-formulario" onSubmit={enviar} noValidate>
          <div className="totem-campo">
            <label htmlFor={`${id}-pessoas`}>{unidade.pergunta}</label>
            <div className="totem-contador">
              <button
                type="button"
                className="acao acao--secundaria"
                aria-label={unidade.menos}
                aria-controls={`${id}-pessoas`}
                disabled={numero !== null && numero <= minimo}
                onClick={() => somar(-1)}
              >
                −
              </button>
              <input
                id={`${id}-pessoas`}
                name="quantidade"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-invalid={tentou && invalido}
                aria-describedby={tentou && invalido ? `${id}-pessoas-erro` : undefined}
              />
              <button
                type="button"
                className="acao acao--secundaria"
                aria-label={unidade.mais}
                aria-controls={`${id}-pessoas`}
                disabled={numero !== null && numero >= maximo}
                onClick={() => somar(1)}
              >
                +
              </button>
            </div>
            {tentou && invalido && (
              <p id={`${id}-pessoas-erro`} className="totem-erro">
                De {minimo} a {maximo} {unidade.plural}. Mais do que isso, fale com o atendimento.
              </p>
            )}
          </div>
          <button type="submit" className="acao totem-continuar">
            Continuar
          </button>
        </form>
      )}
    </>
  )
}
