/**
 * **O que vai embarcar** — a primeira pergunta da reserva na página (UI 2.2, decisão G; naveg-front#66).
 *
 * O **veículo** é a opção grande, com "leve" e "pesado" à vista: é o que faz sentir que a carga pesada cabe. Passageiros
 * e veículo, Passageiros e Encomenda vêm menores, mas inteiros. A encomenda entrou com a 2.7 (decisões A e C).
 *
 * A foto de um veículo pesado embarcando (decisão M) entra pela propriedade `foto`: hoje, a do F/B Regional com
 * caminhões no convés (PO, 2026-10-15). Sem ela, o cartão se destaca pelo tamanho e pela posição, e não mostra molde:
 * o cliente não vê "foto pendente".
 */
import { OQueEmbarca, PorteDoVeiculo } from '@navegsistemas/domain'

/** Uma foto já gerada no build — o Astro dá o endereço e os tamanhos; a ilha só os escreve. */
export interface FotoDoCartao {
  readonly src: string
  readonly srcset: string
}

export interface PropsDoQueVaiEmbarcar {
  readonly opcoes: readonly OQueEmbarca[]
  readonly escolhida: OQueEmbarca | undefined
  readonly aoEscolher: (embarque: OQueEmbarca) => void
  /** A foto do cartão do veículo, quando houver (decisão M). */
  readonly foto?: FotoDoCartao | null
}

const DESCRICAO: Readonly<Record<Exclude<OQueEmbarca, 'VEICULO'>, string>> = {
  PASSAGEIROS_E_VEICULO: 'Quem viaja junto com o veículo.',
  PASSAGEIROS: 'Uma ou mais pessoas, de rede, suíte ou camarote.',
  /* A encomenda (2.7, decisão C): o mesmo peso de Passageiros, com o que costuma ir. */
  ENCOMENDA: 'Caixas, sacos, eletrodomésticos, móveis.',
}

/** "Carro, SUV, van" vira "carro, SUV, van": depois de "Leve:", só a primeira letra muda — a sigla fica. */
function minusculaNoComeco(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1)
}

export function OQueVaiEmbarcar({ opcoes, escolhida, aoEscolher, foto }: PropsDoQueVaiEmbarcar) {
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
              {/* Decoração: o nome do botão é "Veículo", e a foto não precisa ser lida a cada passagem. */}
              {opcao === 'VEICULO' && foto !== undefined && foto !== null && (
                <img
                  className="totem-cartao__foto"
                  src={foto.src}
                  srcSet={foto.srcset}
                  sizes="(min-width: 64rem) 40rem, 100vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              )}
              <span className="totem-cartao__rotulo">{OQueEmbarca.rotulo(opcao)}</span>
              {opcao === 'VEICULO' ? (
                <span className="totem-cartao__pesos">
                  {PorteDoVeiculo.valores.map((porte) => (
                    <span key={porte} className="totem-cartao__peso">
                      {PorteDoVeiculo.rotulo(porte)}: {minusculaNoComeco(PorteDoVeiculo.exemplos(porte))}
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
    </div>
  )
}
