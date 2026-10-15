/**
 * **Quantos viajam** — 1, 2, 3, 4 ou "5 ou mais", que abre um contador (UI 2.2, decisão I; naveg-front#65).
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

export interface PropsDaQuantidade {
  readonly opcoes: readonly number[]
  readonly escolhida: number | undefined
  readonly aoEscolher: (quantidade: number) => void
}

/** Até tantas opções, cada uma é um cartão. Acima, as primeiras e o contador. */
const CARTOES = 5

const MAIS = 'MAIS'

function pessoas(quantidade: number): string {
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`
}

export function QuantidadeDePessoas({ opcoes, escolhida, aoEscolher }: PropsDaQuantidade) {
  if (opcoes.length <= CARTOES) {
    return (
      <EscolhaEmCartoes
        opcoes={opcoes.map((valor) => ({ valor, rotulo: pessoas(valor) }))}
        escolhida={escolhida}
        aoEscolher={aoEscolher}
      />
    )
  }
  return <CartoesEContador opcoes={opcoes} escolhida={escolhida} aoEscolher={aoEscolher} />
}

function CartoesEContador({ opcoes, escolhida, aoEscolher }: PropsDaQuantidade) {
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
          ...primeiras.map((valor) => ({ valor, rotulo: pessoas(valor) })),
          { valor: MAIS, rotulo: `${minimo} ou mais` },
        ]}
        escolhida={aberto ? MAIS : escolhida}
        aoEscolher={(valor) => (valor === MAIS ? setAberto(true) : aoEscolher(valor))}
      />

      {aberto && (
        <form className="totem-formulario" onSubmit={enviar} noValidate>
          <div className="totem-campo">
            <label htmlFor={`${id}-pessoas`}>Quantas pessoas</label>
            <div className="totem-contador">
              <button
                type="button"
                className="acao acao--secundaria"
                aria-label="Uma pessoa a menos"
                aria-controls={`${id}-pessoas`}
                disabled={numero !== null && numero <= minimo}
                onClick={() => somar(-1)}
              >
                −
              </button>
              <input
                id={`${id}-pessoas`}
                name="quantidadePessoas"
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
                aria-label="Uma pessoa a mais"
                aria-controls={`${id}-pessoas`}
                disabled={numero !== null && numero >= maximo}
                onClick={() => somar(1)}
              >
                +
              </button>
            </div>
            {tentou && invalido && (
              <p id={`${id}-pessoas-erro`} className="totem-erro">
                De {minimo} a {maximo} pessoas. Mais do que isso, fale com o atendimento.
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
