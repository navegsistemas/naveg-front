/**
 * **O CNPJ como regra, e não como campo de texto.** Porte de `domain/viagem/Cnpj.kt` do `fluviapp-kmp`.
 *
 * Ele tem uma propriedade que quase nenhum outro dado do rodapé tem: **dá para saber se está errado sem
 * perguntar a ninguém**. Os dois últimos dígitos são verificadores, calculados dos doze primeiros — e é isso que
 * transforma um engano de digitação em erro detectável no build, em vez de num número errado publicado no
 * rodapé institucional por meses, onde ninguém confere.
 *
 * ### O que ele **não** garante
 *
 * Que a empresa existe, que está ativa, ou que o CNPJ é dela. Isso é consulta à Receita, não conta aritmética.
 * O que esta validação entrega é o que dá para entregar offline: **descartar o que certamente está errado**.
 */

export const TAMANHO_DO_CNPJ = 14

/** O valor canônico — só os dígitos. */
export function digitosDoCnpj(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Se os dígitos verificadores batem.
 *
 * A recusa das sequências repetidas (`00000000000000`, `11111111111111`) é parte do algoritmo, e não zelo
 * extra: elas **passam** na conta dos verificadores, e são justamente o que alguém digita para preencher o
 * campo e seguir adiante.
 */
export function cnpjValido(valor: string): boolean {
  const numeros = digitosDoCnpj(valor)
  if (numeros.length !== TAMANHO_DO_CNPJ) return false
  if ([...numeros].every((algarismo) => algarismo === numeros[0])) return false

  const algarismos = [...numeros].map(Number)

  return (
    algarismos[12] === digitoVerificador(algarismos.slice(0, 12)) &&
    algarismos[13] === digitoVerificador(algarismos.slice(0, 13))
  )
}

/**
 * `00.000.000/0000-00` — e **também o parcial**, o que faz esta função servir a um valor ainda incompleto em
 * vez de só ao que já está salvo.
 *
 * Aceita entrada já pontuada: normaliza antes de formatar.
 */
export function formatarCnpj(valor: string): string {
  let formatado = ''

  ;[...digitosDoCnpj(valor)].forEach((algarismo, posicao) => {
    if (posicao === 2 || posicao === 5) formatado += '.'
    else if (posicao === 8) formatado += '/'
    else if (posicao === 12) formatado += '-'
    formatado += algarismo
  })

  return formatado
}

/**
 * O dígito verificador de uma base — **pesos de 2 a 9, da direita para a esquerda**, em ciclo.
 *
 * A forma cíclica substitui as duas tabelas de pesos que a documentação da Receita publica (`[5,4,3,2,9,…]` e
 * `[6,5,4,3,2,9,…]`): elas são a mesma sequência lida de trás para frente, e uma tabela literal por dígito é
 * uma tabela a mais para copiar errado.
 */
function digitoVerificador(base: readonly number[]): number {
  let peso = 2
  let soma = 0

  for (let posicao = base.length - 1; posicao >= 0; posicao -= 1) {
    soma += (base[posicao] ?? 0) * peso
    peso = peso === 9 ? 2 : peso + 1
  }

  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}
