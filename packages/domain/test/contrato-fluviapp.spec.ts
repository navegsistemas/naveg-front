/**
 * **O contrato com o fluviapp** — o aplicativo Android, que é a gestão comercial e alimenta a agência.
 *
 * O porte é manual, e porte manual diverge. A primeira versão deste pacote provou isso: ela conferia só os
 * **nomes** dos enums, contra o `fluviapp-kmp` — que está atrás do aplicativo —, e passou verde com seis
 * classes de veículo onde o aplicativo tem dezessete, com o navio levando van, e com `CARRETA` significando o
 * caminhão quando lá significa o rebocado. Nome igual, significado diferente: a pior divergência, porque
 * nenhum `de()` devolve `null` e nada acusa.
 *
 * Então o contrato agora confere **o que o valor significa**, não só como se escreve:
 *
 * - os valores de cada enum, na ordem;
 * - a **natureza** e a **cilindrada** de cada classe de veículo;
 * - a **carga admitida** de cada casco;
 * - a **ocupação** e os **tipos permitidos** de cada acomodação;
 * - o **comprimento** de cada documento;
 * - os **nomes das chaves** que a agência lê dos documentos do fluviapp (viagens, rotas, portos...) e que ela
 *   escreve para o aplicativo ler (o cliente com as chaves do `ClienteDocumento`).
 *
 * ### Duas camadas
 *
 * 1. **A tabela** — o que o Kotlin declara, escrito aqui. Roda sempre, em qualquer máquina e no CI.
 * 2. **A leitura do Kotlin** — quando o checkout do aplicativo está presente, os `.kt` são lidos e a tabela é
 *    conferida contra eles. Sem o checkout, os cenários aparecem **pulados**, com o motivo — nunca verdes.
 *
 * O caminho vem de `FLUVIAPP_ORIGINAL`, ou do padrão desta máquina
 * (`~/Documents/AndroidStudioProjects/fluviapp`).
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { TIPOS_DE_DOCUMENTO, TipoDocumento } from '../src/documento/tipo-documento.js'
import { UFS } from '../src/localidade/localidade.js'
import { ACOMODACOES, Acomodacao } from '../src/passagem/acomodacao.js'
import { CATEGORIAS_DE_PASSAGEM } from '../src/passagem/categoria-passagem.js'
import { CLASSES_DE_VEICULO, ClasseVeiculo } from '../src/passagem/classe-veiculo.js'
import { NATUREZAS_DE_VEICULO } from '../src/passagem/natureza-veiculo.js'
import { TIPOS_DE_GRATUIDADE } from '../src/passagem/tipo-gratuidade.js'
import { TIPOS_DE_PASSAGEM } from '../src/passagem/tipo-passagem.js'
import { DIAS_DA_SEMANA } from '../src/primitivos/dia-semana.js'
import { TIPOS_DE_EMBARCACAO, TipoEmbarcacao } from '../src/viagem/tipo-embarcacao.js'

const RAIZ = resolve(
  process.env['FLUVIAPP_ORIGINAL'] ?? join(homedir(), 'Documents', 'AndroidStudioProjects', 'fluviapp'),
)
const PACOTE = 'app/src/main/java/dev/matheus/fluviapp'
const DOMINIO = `${PACOTE}/domain`
const DOCUMENTOS = `${PACOTE}/services/repository/firebase/documents`
const PRESENTE = existsSync(join(RAIZ, DOMINIO))

function kotlin(caminho: string): string {
  return readFileSync(join(RAIZ, caminho), 'utf8')
}

// ---------------------------------------------------------------------------------------------------------
// O leitor de Kotlin
// ---------------------------------------------------------------------------------------------------------

function semRuido(fonte: string): string {
  return fonte
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
}

interface Entrada {
  readonly nome: string
  /** O texto entre os parênteses da entrada — `NaturezaVeiculo.AUTOMOTOR, exigeCilindrada = true`. */
  readonly argumentos: string
}

/**
 * As entradas de um `enum class`, com os argumentos. Pula o construtor, entra no corpo, e colhe no nível
 * zero de parênteses — até o `;` ou o `}` que encerra a lista.
 */
function entradasDoEnum(fonteKotlin: string, nome: string): Entrada[] | null {
  const fonte = semRuido(fonteKotlin)
  const declaracao = new RegExp(`enum\\s+class\\s+${nome}\\b`).exec(fonte)
  if (declaracao === null) return null

  let i = declaracao.index + declaracao[0].length
  let profundidade = 0
  for (; i < fonte.length; i += 1) {
    const c = fonte[i]
    if (c === '(') profundidade += 1
    else if (c === ')') profundidade -= 1
    else if (c === '{' && profundidade === 0) break
  }
  i += 1

  const entradas: Entrada[] = []
  let atual = ''
  let argumentos = ''
  profundidade = 0
  for (; i < fonte.length; i += 1) {
    const c = fonte[i] as string
    if (profundidade === 0 && (c === ';' || c === '}')) break
    if (profundidade === 0 && c === ',') {
      const nomeDaEntrada = /^\s*([A-Z][A-Z0-9_]*)/.exec(atual)?.[1]
      if (nomeDaEntrada !== undefined) entradas.push({ nome: nomeDaEntrada, argumentos })
      atual = ''
      argumentos = ''
      continue
    }
    if (c === '(' || c === '{') profundidade += 1
    else if (c === ')' || c === '}') profundidade -= 1
    if (profundidade === 0 && c !== ')') atual += c
    else if (!(profundidade === 1 && c === '(')) argumentos += c
  }
  const ultimo = /^\s*([A-Z][A-Z0-9_]*)/.exec(atual)?.[1]
  if (ultimo !== undefined) entradas.push({ nome: ultimo, argumentos })
  return entradas
}

function nomes(entradas: Entrada[] | null): string[] | null {
  return entradas?.map((e) => e.nome) ?? null
}

/** As chaves que um `paraMapa()` escreve: todo `"chave" to`. */
function chavesEscritas(fonteKotlin: string): Set<string> {
  return new Set([...fonteKotlin.matchAll(/"([a-zA-Z][a-zA-Z0-9]*)"\s+to\b/g)].map((m) => m[1] as string))
}

// ---------------------------------------------------------------------------------------------------------
// A tabela (camada 1)
// ---------------------------------------------------------------------------------------------------------

interface ClausulaDeEnum {
  readonly enum: string
  readonly arquivo: string
  readonly aqui: readonly string[]
  readonly kotlin: readonly string[]
}

const ENUMS: readonly ClausulaDeEnum[] = [
  { enum: 'Acomodacao', arquivo: 'passagem/Acomodacao.kt', aqui: ACOMODACOES, kotlin: ['REDE', 'SUITE', 'CAMAROTE'] },
  { enum: 'CategoriaPassagem', arquivo: 'passagem/CategoriaPassagem.kt', aqui: CATEGORIAS_DE_PASSAGEM, kotlin: ['PASSAGEIRO', 'VEICULO'] },
  { enum: 'TipoPassagem', arquivo: 'passagem/TipoPassagem.kt', aqui: TIPOS_DE_PASSAGEM, kotlin: ['INTEIRA', 'MEIA', 'GRATUIDADE'] },
  {
    enum: 'TipoGratuidade',
    arquivo: 'passagem/TipoGratuidade.kt',
    aqui: TIPOS_DE_GRATUIDADE,
    kotlin: ['IDOSO', 'PCD', 'CRIANCA_ATE_5', 'PASSE_FEDERAL'],
  },
  {
    enum: 'NaturezaVeiculo',
    arquivo: 'passagem/NaturezaVeiculo.kt',
    aqui: NATUREZAS_DE_VEICULO,
    kotlin: ['AUTOMOTOR', 'MOTOCICLO', 'MAQUINA', 'REBOCADO'],
  },
  {
    enum: 'ClasseVeiculo',
    arquivo: 'passagem/ClasseVeiculo.kt',
    aqui: CLASSES_DE_VEICULO,
    kotlin: [
      'CARRO', 'VAN', 'SUV', 'CAMINHAO', 'MOTORHOME', 'ONIBUS', 'CARRETA_CAVALINHO',
      'MOTO', 'QUADRICICLO',
      'TRATOR', 'EMPILHADEIRA', 'RETROESCAVADEIRA',
      'CARRETA', 'TRAILER', 'CARRETILHA', 'JET_SKI', 'LANCHA',
    ],
  },
  {
    enum: 'TipoDocumento',
    arquivo: 'documento/TipoDocumento.kt',
    aqui: TIPOS_DE_DOCUMENTO,
    kotlin: ['CPF', 'CNPJ', 'RG', 'CNH', 'PASSAPORTE'],
  },
  { enum: 'TipoEmbarcacao', arquivo: 'viagem/TipoEmbarcacao.kt', aqui: TIPOS_DE_EMBARCACAO, kotlin: ['FERRY_BOAT', 'NAVIO', 'LANCHA'] },
  {
    enum: 'Uf',
    arquivo: 'localidade/Uf.kt',
    aqui: UFS,
    kotlin: [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
      'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    ],
  },
]

/** O que cada classe declara no Kotlin: natureza e, se houver, `exigeCilindrada = true`. */
const CLASSES_NO_KOTLIN: Readonly<Record<string, { natureza: string; exigeCilindrada: boolean }>> = Object.fromEntries(
  [
    ...['CARRO', 'VAN', 'SUV', 'CAMINHAO', 'MOTORHOME', 'ONIBUS', 'CARRETA_CAVALINHO'].map((c) => [c, 'AUTOMOTOR']),
    ['MOTO', 'MOTOCICLO'],
    ['QUADRICICLO', 'MOTOCICLO'],
    ...['TRATOR', 'EMPILHADEIRA', 'RETROESCAVADEIRA'].map((c) => [c, 'MAQUINA']),
    ...['CARRETA', 'TRAILER', 'CARRETILHA', 'JET_SKI', 'LANCHA'].map((c) => [c, 'REBOCADO']),
  ].map(([classe, natureza]) => [classe, { natureza: natureza as string, exigeCilindrada: classe === 'MOTO' }]),
)

/** A carga de cada casco, no vocabulário do `CargaAdmitida` do Kotlin. */
const CARGA_NO_KOTLIN: Readonly<Record<string, string>> = {
  FERRY_BOAT: 'Todas',
  NAVIO: 'Apenas(CARRO,MOTO)',
  LANCHA: 'Nenhuma',
}

const ACOMODACOES_NO_KOTLIN: Readonly<Record<string, { ocupacaoMaxima: number; tipos: string[] }>> = {
  REDE: { ocupacaoMaxima: 1, tipos: ['INTEIRA', 'MEIA', 'GRATUIDADE'] },
  SUITE: { ocupacaoMaxima: 3, tipos: ['INTEIRA'] },
  CAMAROTE: { ocupacaoMaxima: 3, tipos: ['INTEIRA'] },
}

const DOCUMENTOS_NO_KOTLIN: Readonly<Record<string, { apenasDigitos: boolean; comprimento: string }>> = {
  CPF: { apenasDigitos: true, comprimento: '11..11' },
  CNPJ: { apenasDigitos: true, comprimento: '14..14' },
  RG: { apenasDigitos: true, comprimento: '5..14' },
  CNH: { apenasDigitos: true, comprimento: '11..11' },
  PASSAPORTE: { apenasDigitos: false, comprimento: '8..8' },
}

/**
 * As chaves que a agência lê de cada documento do fluviapp (os decodificadores em `catalogo/documentos.ts`)
 * e as que ela escreve para o aplicativo ler (a pessoa da reserva, com as chaves do `ClienteDocumento`).
 */
const CHAVES_USADAS: Readonly<Record<string, readonly string[]>> = {
  'ViagemDocumento.kt': ['rotaId', 'embarcacaoId', 'diaSemana', 'horaMin', 'ativo'],
  'RotaDocumento.kt': ['portoOrigemId', 'portoDestinoId', 'distanciaMn', 'tempoMedioH', 'ativo'],
  'PortoDocumento.kt': ['nome', 'localidadeId', 'ativo'],
  'LocalidadeDocumento.kt': ['municipio', 'uf', 'codigoIbge', 'ativo'],
  'EmbarcacaoDocumento.kt': [
    'nome',
    'tipo',
    'capacidadeVeiculo',
    'capacidadeSuite2',
    'capacidadeSuite3',
    'capacidadeCamarote',
    'empresaId',
  ],
  /* O cliente da reserva usa as chaves do Cliente, para a emissão pré-preencher o cadastro. */
  'ClienteDocumento.kt': ['nome', 'telefone'],
  'VeiculoDocumento.kt': ['cilindrada'],
}

// ---------------------------------------------------------------------------------------------------------
// Os cenários
// ---------------------------------------------------------------------------------------------------------

describe('camada 1 · este pacote bate com a tabela do aplicativo', () => {
  for (const clausula of ENUMS) {
    it(`${clausula.enum}: mesmos valores, mesma ordem`, () => {
      expect([...clausula.aqui]).toEqual([...clausula.kotlin])
    })
  }

  it('dias da semana: os nomes do java.time.DayOfWeek', () => {
    expect(DIAS_DA_SEMANA).toEqual(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
  })

  it('cada classe de veículo tem a natureza e a exigência de cilindrada do aplicativo', () => {
    for (const classe of CLASSES_DE_VEICULO) {
      expect(
        { natureza: ClasseVeiculo.natureza(classe), exigeCilindrada: ClasseVeiculo.exigeCilindrada(classe) },
        classe,
      ).toEqual(CLASSES_NO_KOTLIN[classe])
    }
  })

  it('cada casco admite a carga do aplicativo', () => {
    for (const tipo of TIPOS_DE_EMBARCACAO) {
      const carga = TipoEmbarcacao.cargaAdmitida(tipo)
      const escrita =
        carga.forma === 'TODAS' ? 'Todas' : carga.forma === 'NENHUMA' ? 'Nenhuma' : `Apenas(${[...carga.classes].join(',')})`
      expect(escrita, tipo).toBe(CARGA_NO_KOTLIN[tipo])
    }
  })

  it('cada acomodação tem a ocupação e os tipos do aplicativo', () => {
    for (const acomodacao of ACOMODACOES) {
      expect(
        { ocupacaoMaxima: Acomodacao.ocupacaoMaxima(acomodacao), tipos: [...Acomodacao.tiposPermitidos(acomodacao)] },
        acomodacao,
      ).toEqual(ACOMODACOES_NO_KOTLIN[acomodacao])
    }
  })

  it('cada documento tem o comprimento do aplicativo', () => {
    for (const tipo of TIPOS_DE_DOCUMENTO) {
      const { apenasDigitos, comprimentoMinimo, comprimentoMaximo } = TipoDocumento.propriedades[tipo]
      expect({ apenasDigitos, comprimento: `${comprimentoMinimo}..${comprimentoMaximo}` }, tipo).toEqual(
        DOCUMENTOS_NO_KOTLIN[tipo],
      )
    }
  })
})

describe('o leitor de enum Kotlin', () => {
  /* O leitor é código de teste, e código de teste também erra. */
  it('lê nomes e argumentos, ignorando KDoc, comentários e vírgulas dentro de strings', () => {
    const fonte = `
      enum class ClasseVeiculo(val rotulo: String, val natureza: NaturezaVeiculo, val exigeCilindrada: Boolean = false) {
          // --- Automotor, com vírgula no comentário ---
          CARRO("Carro, o de sempre", NaturezaVeiculo.AUTOMOTOR),
          /** KDoc. */
          MOTO("Moto", NaturezaVeiculo.MOTOCICLO, exigeCilindrada = true),
          LANCHA("Lancha", NaturezaVeiculo.REBOCADO);
          companion object { fun de(v: String?) = null }
      }`
    const entradas = entradasDoEnum(fonte, 'ClasseVeiculo')
    expect(nomes(entradas)).toEqual(['CARRO', 'MOTO', 'LANCHA'])
    expect(entradas?.[1]?.argumentos).toContain('exigeCilindrada = true')
    expect(entradas?.[2]?.argumentos).toContain('NaturezaVeiculo.REBOCADO')
  })

  it('lê enum sem argumentos, e devolve null quando o enum não está', () => {
    expect(nomes(entradasDoEnum('enum class X { A, B_2, C; }', 'X'))).toEqual(['A', 'B_2', 'C'])
    expect(entradasDoEnum('enum class Outro { A }', 'X')).toBeNull()
  })

  it('colhe as chaves de um paraMapa', () => {
    expect([...chavesEscritas('mapOf("rotaId" to rotaId, "horaMin" to horaMin)')]).toEqual(['rotaId', 'horaMin'])
  })
})

const motivo = PRESENTE ? '' : ` — PULADO: checkout do fluviapp ausente em ${RAIZ}`

describe(`camada 2 · a tabela bate com o Kotlin do aplicativo${motivo}`, () => {
  for (const clausula of ENUMS) {
    it.skipIf(!PRESENTE)(`${clausula.enum} em domain/${clausula.arquivo}`, () => {
      expect(nomes(entradasDoEnum(kotlin(`${DOMINIO}/${clausula.arquivo}`), clausula.enum))).toEqual([...clausula.kotlin])
    })
  }

  it.skipIf(!PRESENTE)('natureza e cilindrada de cada classe, lidas do ClasseVeiculo.kt', () => {
    const entradas = entradasDoEnum(kotlin(`${DOMINIO}/passagem/ClasseVeiculo.kt`), 'ClasseVeiculo') ?? []
    for (const { nome, argumentos } of entradas) {
      const lida = {
        natureza: /NaturezaVeiculo\.([A-Z_]+)/.exec(argumentos)?.[1],
        exigeCilindrada: /exigeCilindrada\s*=\s*true/.test(argumentos),
      }
      expect(lida, nome).toEqual(CLASSES_NO_KOTLIN[nome])
    }
  })

  it.skipIf(!PRESENTE)('carga admitida de cada casco, lida do TipoEmbarcacao.kt', () => {
    const entradas = entradasDoEnum(kotlin(`${DOMINIO}/viagem/TipoEmbarcacao.kt`), 'TipoEmbarcacao') ?? []
    for (const { nome, argumentos } of entradas) {
      const forma = /CargaAdmitida\.(Todas|Nenhuma|Apenas)/.exec(argumentos)?.[1]
      const classes = [...argumentos.matchAll(/ClasseVeiculo\.([A-Z_]+)/g)].map((m) => m[1]).join(',')
      expect(forma === 'Apenas' ? `Apenas(${classes})` : forma, nome).toBe(CARGA_NO_KOTLIN[nome])
    }
  })

  it.skipIf(!PRESENTE)('ocupação e tipos de cada acomodação, lidos do Acomodacao.kt', () => {
    const entradas = entradasDoEnum(kotlin(`${DOMINIO}/passagem/Acomodacao.kt`), 'Acomodacao') ?? []
    for (const { nome, argumentos } of entradas) {
      const lida = {
        ocupacaoMaxima: Number(/ocupacaoMaxima\s*=\s*(\d+)/.exec(argumentos)?.[1]),
        tipos: [...argumentos.matchAll(/TipoPassagem\.([A-Z_]+)/g)].map((m) => m[1]),
      }
      expect(lida, nome).toEqual(ACOMODACOES_NO_KOTLIN[nome])
    }
  })

  it.skipIf(!PRESENTE)('comprimento de cada documento, lido do TipoDocumento.kt', () => {
    const entradas = entradasDoEnum(kotlin(`${DOMINIO}/documento/TipoDocumento.kt`), 'TipoDocumento') ?? []
    for (const { nome, argumentos } of entradas) {
      const lida = {
        apenasDigitos: /apenasDigitos\s*=\s*true/.test(argumentos),
        comprimento: /comprimento\s*=\s*(\d+\.\.\d+)/.exec(argumentos)?.[1],
      }
      expect(lida, nome).toEqual(DOCUMENTOS_NO_KOTLIN[nome])
    }
  })

  for (const [arquivo, chaves] of Object.entries(CHAVES_USADAS)) {
    it.skipIf(!PRESENTE)(`as chaves que a agência usa existem em ${arquivo}`, () => {
      const escritas = chavesEscritas(kotlin(`${DOCUMENTOS}/${arquivo}`))
      for (const chave of chaves) expect(escritas.has(chave), `${arquivo}: "${chave}"`).toBe(true)
    })
  }

  it.skipIf(!PRESENTE)('as coleções que a agência lê existem nas Rules do fluviapp', () => {
    const regras = readFileSync(join(RAIZ, 'firestore.rules'), 'utf8')
    for (const colecao of ['localidades', 'portos', 'rotas', 'embarcacoes', 'viagens', 'empresas', 'atuacoes']) {
      expect(regras, colecao).toMatch(new RegExp(`match /${colecao}/\\{`))
    }
  })
})
