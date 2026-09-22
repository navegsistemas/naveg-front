/**
 * **A fronteira String→tipo, num lugar só** — porte de `primitivos/fronteira.ts` do `@fluviapp/domain`,
 * que por sua vez é o equivalente TypeScript dos `companion object.de()` de todo enum do domínio Kotlin.
 *
 * As três propriedades que aqueles métodos garantem, e que este arquivo preserva:
 *
 * 1. **fail-closed** — valor desconhecido devolve `null`, nunca um padrão inventado. Quem chama decide o
 *    que fazer com a ausência; ninguém herda um `else` silencioso;
 * 2. **tolerância à grafia legada** — `trim`, caixa alta e espaço→underscore, porque o dado nasceu num
 *    catálogo onde "A EMITIR" e "A_EMITIR" conviviam;
 * 3. **o valor canônico é o que atravessa** — é o mesmo texto que o Kotlin grava e lê, e é por isso que o
 *    documento escrito por este totem é legível pelo aplicativo. Ver `test/contrato-kmp.spec.ts`.
 *
 * ### O que **não** veio no porte, e por quê
 *
 * O `porRotulo` do fluviapp — a fronteira de **tela**, que lê o texto que a pessoa escolheu num dropdown.
 * Aqui o totem é controlado: as opções de cada passo chegam **dentro do nó** do roteiro, já tipadas, e a
 * tela devolve o valor, não o rótulo. Sem chamador, ele seria código morto na única camada do projeto que
 * se quer pequena por contrato.
 */

/** `trim` + caixa alta + espaço→underscore. É a normalização que os `de()` do Kotlin aplicam. */
export function normalizarChave(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null
  const normalizado = valor.trim().toUpperCase().replaceAll(' ', '_')
  return normalizado.length === 0 ? null : normalizado
}

/**
 * O valor canônico persistido → o literal do domínio. `null` se desconhecido.
 *
 * `valores` é a tupla `as const` que define o tipo, então o retorno já é o literal — é o que substitui
 * `entries.firstOrNull { it.name == normalizado }` sem perder a estreiteza do tipo.
 */
export function deValor<const T extends string>(
  valores: readonly T[],
  valor: string | null | undefined,
): T | null {
  const normalizado = normalizarChave(valor)
  if (normalizado === null) return null
  return valores.find((candidato) => candidato === normalizado) ?? null
}

/**
 * **O compilador como lista de tarefas** — o que o `when` exaustivo do Kotlin dá de graça e o TypeScript
 * só dá se pedirmos.
 *
 * Num `switch` sobre a união discriminada, chamar isto no `default` faz um caso novo virar **erro de
 * compilação**. É o que sustenta a promessa do roteiro: acrescentar um passo deve acusar cada lugar que
 * precisa decidir algo sobre ele, em vez de virar um `undefined` em produção.
 *
 * Lança em tempo de execução porque o argumento é `never`: se a chamada acontecer de verdade, o dado
 * violou o tipo na fronteira — e aí falhar alto é melhor do que seguir com um valor que ninguém previu.
 */
export function casoImpossivel(valor: never, contexto: string): never {
  throw new Error(`${contexto}: caso não previsto — ${JSON.stringify(valor)}`)
}

/** Formata `A_EMITIR` como "A EMITIR". O `rotulo()` que vários enums do Kotlin repetem. */
export function rotuloDoNome(nome: string): string {
  return nome.replaceAll('_', ' ')
}
