/**
 * **O código humano da reserva** — `NVG-XXXXXX`, e ele é o **id do documento**.
 *
 * É o objeto que o cliente leva embora. Ele vai na primeira linha da mensagem do WhatsApp, é ditado no
 * telefone quando o link não abre, e é digitado pelo atendente quando nada mais funciona. Cada uma dessas
 * três coisas é um requisito, e é delas que saem as decisões abaixo.
 *
 * ### Base32 de Crockford, e o que ela remove
 *
 * O alfabeto exclui **I, L, O e U**. Os três primeiros porque se confundem com `1`, `1` e `0` ao ditar e ao
 * ler de um papel; o `U` porque, sem ele, nenhuma combinação de seis caracteres forma acidentalmente um
 * palavrão — o que num código impresso e lido em voz alta num guichê não é detalhe estético.
 *
 * E [normalizarCodigo] faz a **substituição canônica** que a especificação de Crockford define ao ler:
 * `I` e `L` viram `1`, `O` vira `0`. Quem digitar `NVG-O1IZQ4` acerta. Isso é o que transforma a escolha do
 * alfabeto em benefício real — sem a leitura tolerante, ele só reduziria o espaço de códigos.
 *
 * ### Por que não é sequencial
 *
 * Um contador sequencial (`NVG-000001`) exige transação com **leitura** — e leitura é justamente o que as
 * Rules vão negar ao público (passo 9). Um código aleatório não lê nada: grava-se com `create`, e a
 * colisão vira **`create` negado pela regra**, porque o documento já existe. Daí a nova tentativa.
 *
 * **Fail-closed por construção:** o modo de falha do gerador é "a reserva não foi criada", nunca "duas
 * reservas compartilham um código". Com 32⁶ ≈ 1,07 bilhão de códigos, a colisão é rara; o ponto é que,
 * quando acontecer, ela é *visível e recuperável* em vez de silenciosa.
 *
 * ### A aleatoriedade entra por parâmetro
 *
 * [gerarCodigoDaReserva] recebe a fonte de bytes. O padrão é `crypto.getRandomValues` — global no Node 22
 * e em todo navegador que o totem alcança, e portanto **sem dependência nova** neste pacote. Recebê-la por
 * parâmetro é o que torna o gerador testável: o cenário passa uma fonte determinística e assere o código
 * exato, em vez de asserir só o formato.
 *
 * `Math.random` não serve, e não por paranoia criptográfica: o código é o id do documento e é o que o
 * atendente usa para achar o pedido. Previsível, ele deixa de identificar e passa a ser adivinhável.
 */

/** Base32 de Crockford: 10 dígitos + 22 letras, sem `I`, `L`, `O` e `U`. */
export const ALFABETO_DO_CODIGO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export const PREFIXO_DO_CODIGO = 'NVG-'

export const COMPRIMENTO_DO_SUFIXO = 6

const PADRAO_DO_CODIGO = new RegExp(`^${PREFIXO_DO_CODIGO}[${ALFABETO_DO_CODIGO}]{${COMPRIMENTO_DO_SUFIXO}}$`)

/**
 * As confusões que Crockford manda desfazer na leitura. `U` **não** está aqui: ele foi excluído do
 * alfabeto de propósito e não é a grafia errada de coisa nenhuma, então um código com `U` é um código
 * errado — e errado é o que se recusa.
 */
const SUBSTITUICOES: Readonly<Record<string, string>> = { I: '1', L: '1', O: '0' }

/** De onde vêm os bytes. Recebe quantos quer e devolve pelo menos isso. */
export type FonteDeAleatoriedade = (quantidade: number) => Uint8Array

/**
 * O padrão: `crypto.getRandomValues`, que é global no Node 22 e nos navegadores.
 *
 * `256 % 32 === 0`, então `byte % 32` é **uniforme** — não há o viés de módulo que aparece quando o
 * alfabeto não divide 256. É a razão de o alfabeto ter exatamente 32 símbolos, e não 31 ou 33.
 */
export const aleatoriedadeSegura: FonteDeAleatoriedade = (quantidade) =>
  globalThis.crypto.getRandomValues(new Uint8Array(quantidade))

/**
 * Um código novo. Puro em relação à fonte: mesma fonte, mesmo código.
 *
 * @throws se a fonte devolver menos bytes do que foram pedidos — é uma fonte quebrada, e gerar um código
 *   curto a partir dela seria produzir um id que a Rule aceita e que ninguém consegue ditar.
 */
export function gerarCodigoDaReserva(
  aleatorio: FonteDeAleatoriedade = aleatoriedadeSegura,
): string {
  const bytes = aleatorio(COMPRIMENTO_DO_SUFIXO)
  if (bytes.length < COMPRIMENTO_DO_SUFIXO) {
    throw new Error(
      `gerarCodigoDaReserva: a fonte devolveu ${bytes.length} bytes, e são precisos ${COMPRIMENTO_DO_SUFIXO}`,
    )
  }

  let sufixo = ''
  for (let posicao = 0; posicao < COMPRIMENTO_DO_SUFIXO; posicao += 1) {
    const byte = bytes[posicao] as number
    sufixo += ALFABETO_DO_CODIGO[byte % ALFABETO_DO_CODIGO.length]
  }
  return `${PREFIXO_DO_CODIGO}${sufixo}`
}

/**
 * O que alguém digitou → o código canônico, ou `null`.
 *
 * Tolera o que a **grafia** erra e recusa o que o **conteúdo** erra: caixa baixa, espaços em volta, o
 * hífen ausente, o prefixo ausente (quem dita costuma dizer só os seis caracteres) e as trocas de
 * Crockford. Não tolera comprimento errado nem símbolo fora do alfabeto — aí não é grafia, é outro código.
 */
export function normalizarCodigo(bruto: string | null | undefined): string | null {
  if (bruto === null || bruto === undefined) return null

  const compacto = bruto.replace(/[\s.-]/g, '').toUpperCase()
  /* O prefixo sai **pelo comprimento**, não só pelo começo: `N`, `V` e `G` estão no alfabeto, então
     `NVGABC` é um sufixo legítimo, e cortá-lo por começar com "NVG" deixaria três caracteres. É o mesmo
     erro que o `55` de DDD causa na leitura do WhatsApp — ver `contato.ts`. */
  const prefixoCompacto = PREFIXO_DO_CODIGO.replace('-', '')
  const semPrefixo =
    compacto.length === prefixoCompacto.length + COMPRIMENTO_DO_SUFIXO &&
    compacto.startsWith(prefixoCompacto)
      ? compacto.slice(prefixoCompacto.length)
      : compacto
  if (semPrefixo.length !== COMPRIMENTO_DO_SUFIXO) return null

  let sufixo = ''
  for (const caractere of semPrefixo) {
    const corrigido = SUBSTITUICOES[caractere] ?? caractere
    if (!ALFABETO_DO_CODIGO.includes(corrigido)) return null
    sufixo += corrigido
  }
  return `${PREFIXO_DO_CODIGO}${sufixo}`
}

/** O texto **já é** um código canônico? Estrito: é o que o codec pergunta, e o codec não normaliza. */
export function codigoValido(texto: string | null | undefined): boolean {
  return texto !== null && texto !== undefined && PADRAO_DO_CODIGO.test(texto)
}
