/**
 * **Uma escolha, um toque** — o componente que responde a maior parte do roteiro.
 *
 * *"Um passo é uma pergunta, e quase todas se respondem com um toque, porque o domínio já enumera as
 * respostas"* (ADR-0029 do fluviapp). As opções chegam prontas do nó; este componente não tem como oferecer
 * uma que não veio.
 *
 * Cada opção é um `<button>` com `aria-pressed`: escolher é responder, e responder avança o roteiro. Não há
 * "confirmar" depois — num terminal público, cada toque a mais é uma chance de a pessoa desistir.
 */
export interface OpcaoEmCartao<T> {
  readonly valor: T
  readonly rotulo: string
  readonly descricao?: string
}

export interface PropsDaEscolha<T> {
  readonly opcoes: readonly OpcaoEmCartao<T>[]
  readonly escolhida: T | undefined
  readonly aoEscolher: (valor: T) => void
}

export function EscolhaEmCartoes<T extends string | number>({ opcoes, escolhida, aoEscolher }: PropsDaEscolha<T>) {
  return (
    <ul className="totem-cartoes" role="list">
      {opcoes.map((opcao) => (
        <li key={String(opcao.valor)}>
          <button
            type="button"
            className="totem-cartao"
            aria-pressed={opcao.valor === escolhida}
            onClick={() => aoEscolher(opcao.valor)}
          >
            <span className="totem-cartao__rotulo">{opcao.rotulo}</span>
            {opcao.descricao !== undefined && <span className="totem-cartao__descricao">{opcao.descricao}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}
