/**
 * **O que vai embarcar** — a primeira pergunta da reserva na página (UI 2.2, decisão G; naveg-front#66).
 *
 * O **veículo** é a opção grande, com "leve" e "pesado" à vista: é o que faz sentir que a carga pesada cabe. Passageiros
 * e veículo, e Passageiros, vêm menores, mas inteiros. A encomenda é um link para a seção dela, até a 2.7.
 *
 * A foto de um veículo pesado embarcando (decisão M) entra pela propriedade `foto` quando chegar. Sem ela, o cartão se
 * destaca pelo tamanho e pela posição, e não mostra molde: o cliente não vê "foto pendente".
 */
import type { ReactNode } from 'react'

import { OQueEmbarca, PorteDoVeiculo } from '@navegsistemas/domain'

export interface PropsDoQueVaiEmbarcar {
  readonly opcoes: readonly OQueEmbarca[]
  readonly escolhida: OQueEmbarca | undefined
  readonly aoEscolher: (embarque: OQueEmbarca) => void
  /** Para onde aponta "Envie sua encomenda" — a seção dela na página. */
  readonly hrefDaEncomenda?: string
  /** A foto do cartão do veículo, quando houver (decisão M). */
  readonly foto?: ReactNode
}

const DESCRICAO: Readonly<Record<Exclude<OQueEmbarca, 'VEICULO'>, string>> = {
  PASSAGEIROS_E_VEICULO: 'Quem viaja junto com o veículo.',
  PASSAGEIROS: 'Uma ou mais pessoas, de rede, suíte ou camarote.',
}

export function OQueVaiEmbarcar({ opcoes, escolhida, aoEscolher, hrefDaEncomenda = '#encomendas', foto }: PropsDoQueVaiEmbarcar) {
  return (
    <div className="totem-embarques">
      <ul className="totem-embarques__opcoes" role="list">
        {opcoes.map((opcao) => (
          <li key={opcao} className={opcao === 'VEICULO' ? 'totem-embarques__principal' : undefined}>
            <button
              type="button"
              className={opcao === 'VEICULO' ? 'totem-cartao totem-cartao--principal' : 'totem-cartao'}
              aria-pressed={opcao === escolhida}
              onClick={() => aoEscolher(opcao)}
            >
              {opcao === 'VEICULO' && foto}
              <span className="totem-cartao__rotulo">{OQueEmbarca.rotulo(opcao)}</span>
              {opcao === 'VEICULO' ? (
                <span className="totem-cartao__pesos">
                  {PorteDoVeiculo.valores.map((porte) => (
                    <span key={porte} className="totem-cartao__peso">
                      {PorteDoVeiculo.rotulo(porte)}: {PorteDoVeiculo.exemplos(porte).toLowerCase()}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="totem-cartao__descricao">{DESCRICAO[opcao]}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="totem-embarques__encomenda">
        Vai mandar uma caixa, um volume? <a href={hrefDaEncomenda}>Envie sua encomenda</a>
      </p>
    </div>
  )
}
