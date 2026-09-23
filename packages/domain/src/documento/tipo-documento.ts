/**
 * **Tipo de documento** — porte de `documento/tipo-documento.ts` do `@fluviapp/domain`, que porta
 * `domain/documento/TipoDocumento.kt`.
 *
 * A razão de fundo deste tipo existir não é organização de código: **máscara é tratamento de dado pessoal
 * (LGPD)**. Formatar e ocultar parcialmente é política de exibição de identificador, e política não mora
 * numa linha do Firestore que alguém edita.
 *
 * **Este tipo é puro.** Ele não conhece React, e [apenasDigitos] é o que a camada de tela traduz para
 * `inputMode`/`pattern` — no totem, num teclado que se abre numérico é a diferença entre digitar um CPF em
 * três segundos e desistir.
 *
 * Todas as funções são **totais** — nunca lançam. O código Android anterior a este tipo fatiava por índice
 * fixo e estourava `StringIndexOutOfBounds` em documento incompleto; aqui a garantia é da assinatura, e
 * num terminal público documento incompleto é o estado normal, não a exceção.
 *
 * ### Sobre a duplicação com `apps/agencia/src/conteudo/cnpj.ts`
 *
 * Aquele arquivo confere **o CNPJ da NAVEG** no rodapé, em tempo de build, e nasceu no passo 6, antes
 * deste pacote existir. Este confere **o documento de quem reserva**, em tempo de execução. A conta é a
 * mesma e a consolidação é real — mas ela pertence ao passo 8, que é quando `apps/agencia` passa a
 * depender de `@navegsistemas/domain`. Fazê-la agora mexeria numa seção já fechada e verificada por outro motivo.
 *
 * > **Atenção ao contrato:** `TipoDocumento` **ainda não existe no `fluviapp-kmp`**. Ver a nota em
 * > `passagem/classe-veiculo.ts` e o cenário `test/contrato-kmp.spec.ts`.
 */
import { deValor } from '../primitivos/fronteira.js'

export const TIPOS_DE_DOCUMENTO = ['CPF', 'CNPJ', 'RG', 'CNH', 'PASSAPORTE'] as const

export type TipoDocumento = (typeof TIPOS_DE_DOCUMENTO)[number]

export interface PropriedadesDoDocumento {
  readonly rotulo: string
  /** `true` = só dígitos (teclado numérico); `false` admite letras (passaporte). */
  readonly apenasDigitos: boolean
  /** Faixa de caracteres significativos que o documento tem quando completo. */
  readonly comprimentoMinimo: number
  readonly comprimentoMaximo: number
}

const PROPRIEDADES: Readonly<Record<TipoDocumento, PropriedadesDoDocumento>> = {
  CPF: { rotulo: 'CPF', apenasDigitos: true, comprimentoMinimo: 11, comprimentoMaximo: 11 },
  CNPJ: { rotulo: 'CNPJ', apenasDigitos: true, comprimentoMinimo: 14, comprimentoMaximo: 14 },
  RG: { rotulo: 'RG', apenasDigitos: true, comprimentoMinimo: 5, comprimentoMaximo: 14 },
  CNH: { rotulo: 'CNH', apenasDigitos: true, comprimentoMinimo: 11, comprimentoMaximo: 11 },
  PASSAPORTE: {
    rotulo: 'Passaporte',
    apenasDigitos: false,
    comprimentoMinimo: 8,
    comprimentoMaximo: 8,
  },
}

function agrupar(
  digitos: string,
  tamanhos: readonly number[],
  separadores: readonly string[],
): string {
  let saida = ''
  let posicao = 0
  for (const [indice, tamanho] of tamanhos.entries()) {
    if (posicao >= digitos.length) break
    if (indice > 0) saida += separadores[indice - 1] ?? ''
    saida += digitos.slice(posicao, Math.min(posicao + tamanho, digitos.length))
    posicao += tamanho
  }
  return saida
}

function substituirFaixa(texto: string, inicio: number, fim: number, porTexto: string): string {
  if (inicio >= texto.length) return texto
  return texto.slice(0, inicio) + porTexto + texto.slice(Math.min(fim, texto.length))
}

/** DV do CPF: soma ponderada com pesos decrescentes a partir de `pesoInicial`. */
function digitoVerificador(base: string, pesoInicial: number): string {
  const soma = [...base].reduce(
    (acumulado, caractere, indice) => acumulado + Number(caractere) * (pesoInicial - indice),
    0,
  )
  const resto = soma % 11
  return resto < 2 ? '0' : String(11 - resto)
}

function digitoPorPesos(base: string, pesos: readonly number[]): string {
  const soma = [...base].reduce(
    (acumulado, caractere, indice) => acumulado + Number(caractere) * (pesos[indice] ?? 0),
    0,
  )
  const resto = soma % 11
  return resto < 2 ? '0' : String(11 - resto)
}

function validarCpf(digitos: string): boolean {
  if ([...digitos].every((caractere) => caractere === digitos[0])) return false
  return (
    digitos[9] === digitoVerificador(digitos.slice(0, 9), 10) &&
    digitos[10] === digitoVerificador(digitos.slice(0, 10), 11)
  )
}

function validarCnpj(digitos: string): boolean {
  if ([...digitos].every((caractere) => caractere === digitos[0])) return false
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, ...pesos1]
  return (
    digitos[12] === digitoPorPesos(digitos.slice(0, 12), pesos1) &&
    digitos[13] === digitoPorPesos(digitos.slice(0, 13), pesos2)
  )
}

export const TipoDocumento = {
  valores: TIPOS_DE_DOCUMENTO,
  propriedades: PROPRIEDADES,

  rotulo(tipo: TipoDocumento): string {
    return PROPRIEDADES[tipo].rotulo
  },

  apenasDigitos(tipo: TipoDocumento): boolean {
    return PROPRIEDADES[tipo].apenasDigitos
  },

  de(valor: string | null | undefined): TipoDocumento | null {
    return deValor(TIPOS_DE_DOCUMENTO, valor)
  },

  /**
   * Reduz o valor ao que é significativo: descarta separadores e, no passaporte, normaliza a caixa. É a
   * forma **canônica** — é ela que se persiste e sobre a qual todas as outras funções operam.
   */
  normalizar(tipo: TipoDocumento, bruto: string | null | undefined): string {
    const texto = bruto ?? ''
    const somenteDigitos = PROPRIEDADES[tipo].apenasDigitos
    const limpo = [...texto]
      .filter((c) => (somenteDigitos ? /\d/.test(c) : /[\p{L}\p{Nd}]/u.test(c)))
      .join('')
    return somenteDigitos ? limpo : limpo.toUpperCase()
  },

  /** `true` quando o valor normalizado tem o comprimento que este tipo exige. */
  estaCompleto(tipo: TipoDocumento, valor: string | null | undefined): boolean {
    const comprimento = TipoDocumento.normalizar(tipo, valor).length
    const { comprimentoMinimo, comprimentoMaximo } = PROPRIEDADES[tipo]
    return comprimento >= comprimentoMinimo && comprimento <= comprimentoMaximo
  },

  /**
   * Formatação **progressiva**, para o campo enquanto se digita: formata o que já existe sem exigir o
   * documento completo. É o que a máscara de exibição consome.
   */
  formatarProgressivo(tipo: TipoDocumento, valor: string | null | undefined): string {
    const d = TipoDocumento.normalizar(tipo, valor)
    switch (tipo) {
      case 'CPF':
        return agrupar(d, [3, 3, 3, 2], ['.', '.', '-'])
      case 'CNPJ':
        return agrupar(d, [2, 3, 3, 4, 2], ['.', '.', '/', '-'])
      case 'PASSAPORTE':
        return agrupar(d, [2, 6], ['-'])
      case 'RG':
      case 'CNH':
        return d
    }
  },

  /**
   * Formatação de exibição. Documento incompleto sai **como está** (normalizado) em vez de sumir — o
   * `else -> ""` do código anterior apagava o documento do bilhete sem avisar ninguém.
   */
  formatar(tipo: TipoDocumento, valor: string | null | undefined): string {
    const d = TipoDocumento.normalizar(tipo, valor)
    return TipoDocumento.estaCompleto(tipo, d) ? TipoDocumento.formatarProgressivo(tipo, d) : d
  },

  /**
   * Exibição com **ocultação parcial** (LGPD): mantém o documento reconhecível para conferência de balcão
   * e esconde o suficiente para que a tela não seja uma cópia do identificador.
   *
   * **O CPF esconde os 6 primeiros dígitos e mostra os 5 últimos** (`###.###.247-25`) — é o que o balcão
   * precisa para conferir contra o documento físico.
   *
   * O **CNPJ não é ocultado**: identifica pessoa jurídica, é público por natureza e não é dado pessoal.
   *
   * No totem esta é a função que a tela de conferência usa: o terminal fica num saguão, e o passo de
   * revisar antes de enviar não pode ser o passo em que o CPF de quem reserva fica legível de longe.
   */
  mascarar(tipo: TipoDocumento, valor: string | null | undefined): string {
    const d = TipoDocumento.normalizar(tipo, valor)
    if (!TipoDocumento.estaCompleto(tipo, d)) return d

    switch (tipo) {
      case 'CPF':
        return `###.###.${d.slice(6, 9)}-${d.slice(9, 11)}`
      case 'CNPJ':
        return TipoDocumento.formatar(tipo, d)
      case 'RG':
        return substituirFaixa(d, 1, 4, '###')
      case 'CNH':
        return substituirFaixa(d, 2, 8, '######')
      case 'PASSAPORTE':
        return substituirFaixa(TipoDocumento.formatar(tipo, d), 4, 7, '###')
    }
  },

  /** Atalho de exibição: [mascarar] quando `ocultar`, senão [formatar]. */
  exibir(tipo: TipoDocumento, valor: string | null | undefined, ocultar = false): string {
    return ocultar ? TipoDocumento.mascarar(tipo, valor) : TipoDocumento.formatar(tipo, valor)
  },

  /**
   * Validação do documento. `CPF` e `CNPJ` têm **dígito verificador** e são checados de verdade; `RG`,
   * `CNH` e `PASSAPORTE` não têm regra nacional única, então valem pelo comprimento.
   *
   * Num totem sem atendente por perto, este é o único momento em que um documento errado pode ser
   * apanhado antes de virar uma reserva que o atendimento não consegue emitir.
   */
  validar(tipo: TipoDocumento, valor: string | null | undefined): boolean {
    const d = TipoDocumento.normalizar(tipo, valor)
    if (!TipoDocumento.estaCompleto(tipo, d)) return false
    switch (tipo) {
      case 'CPF':
        return validarCpf(d)
      case 'CNPJ':
        return validarCnpj(d)
      case 'RG':
      case 'CNH':
      case 'PASSAPORTE':
        return true
    }
  },
} as const
