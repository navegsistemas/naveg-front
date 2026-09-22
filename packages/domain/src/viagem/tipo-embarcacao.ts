/**
 * **Tipo da embarcação** — porte de `domain/viagem/TipoEmbarcacao.kt` do fluviapp (ADR-0020 D4, ADR-0031 D4).
 *
 * *Não se vende veículo para uma lancha se a cadastrarmos* — palavra do analista. O tipo diz **o que** cabe;
 * a capacidade da embarcação diz **quanto**.
 *
 * ### A carga é declarada por exclusão
 *
 * `CargaAdmitida` tem três formas: **todas** (o ferry), **nenhuma** (a lancha) ou **apenas** uma lista (o
 * navio). A exceção é a única coisa enumerada — acrescentar uma classe nova ao ferry não exige lembrar dele.
 *
 * > **Revisado contra o original em 2026-09-22.** A versão anterior dava ao navio carro, moto, van e SUV —
 * > o que o ADR-0031 D4 encolheu para **carro e moto**. O totem ofereceria van num navio, e o atendente teria
 * > de recusar por telefone uma reserva que o próprio sistema aceitou.
 *
 * ### Onde isso age no totem
 *
 * Numa lancha, "Veículo" não é escolha desabilitada: **não é escolha**. Num navio, cada natureza admitida
 * tem uma classe só a bordo — e o roteiro, como o do balcão, **não pergunta a classe** quando só há uma.
 */
import { deValor } from '../primitivos/fronteira.js'
import { CLASSES_DE_VEICULO, ClasseVeiculo } from '../passagem/classe-veiculo.js'
import { NATUREZAS_DE_VEICULO, type NaturezaVeiculo } from '../passagem/natureza-veiculo.js'

export const TIPOS_DE_EMBARCACAO = ['FERRY_BOAT', 'NAVIO', 'LANCHA'] as const

export type TipoEmbarcacao = (typeof TIPOS_DE_EMBARCACAO)[number]

/** O `sealed interface CargaAdmitida` do Kotlin, como união discriminada. */
export type CargaAdmitida =
  | { readonly forma: 'TODAS' }
  | { readonly forma: 'NENHUMA' }
  | { readonly forma: 'APENAS'; readonly classes: ReadonlySet<ClasseVeiculo> }

export interface PropriedadesDoTipo {
  readonly rotulo: string
  readonly cargaAdmitida: CargaAdmitida
}

const PROPRIEDADES: Readonly<Record<TipoEmbarcacao, PropriedadesDoTipo>> = {
  FERRY_BOAT: { rotulo: 'Ferry Boat', cargaAdmitida: { forma: 'TODAS' } },
  NAVIO: {
    rotulo: 'Navio',
    cargaAdmitida: { forma: 'APENAS', classes: new Set<ClasseVeiculo>(['CARRO', 'MOTO']) },
  },
  LANCHA: { rotulo: 'Lancha', cargaAdmitida: { forma: 'NENHUMA' } },
}

function cargaAdmite(carga: CargaAdmitida, classe: ClasseVeiculo): boolean {
  switch (carga.forma) {
    case 'TODAS':
      return true
    case 'NENHUMA':
      return false
    case 'APENAS':
      return carga.classes.has(classe)
  }
}

export const TipoEmbarcacao = {
  valores: TIPOS_DE_EMBARCACAO,
  propriedades: PROPRIEDADES,

  rotulo(tipo: TipoEmbarcacao): string {
    return PROPRIEDADES[tipo].rotulo
  },

  cargaAdmitida(tipo: TipoEmbarcacao): CargaAdmitida {
    return PROPRIEDADES[tipo].cargaAdmitida
  },

  /** Regra pura: esta embarcação leva esta classe? */
  admite(tipo: TipoEmbarcacao, classe: ClasseVeiculo | null | undefined): boolean {
    return classe !== null && classe !== undefined && cargaAdmite(PROPRIEDADES[tipo].cargaAdmitida, classe)
  },

  /** `false` = embarcação só de passageiro; o modo veículo nem se oferece. */
  levaVeiculo(tipo: TipoEmbarcacao): boolean {
    return PROPRIEDADES[tipo].cargaAdmitida.forma !== 'NENHUMA'
  },

  /** As classes a bordo, na ordem canônica de `ClasseVeiculo`. */
  classesAdmitidas(tipo: TipoEmbarcacao): readonly ClasseVeiculo[] {
    return CLASSES_DE_VEICULO.filter((c) => TipoEmbarcacao.admite(tipo, c))
  },

  /** As classes de uma natureza que este casco leva. */
  classesDa(tipo: TipoEmbarcacao, natureza: NaturezaVeiculo): readonly ClasseVeiculo[] {
    return TipoEmbarcacao.classesAdmitidas(tipo).filter((c) => ClasseVeiculo.natureza(c) === natureza)
  },

  /** As naturezas com pelo menos uma classe a bordo — as vazias não viram botão. */
  naturezasAdmitidas(tipo: TipoEmbarcacao): readonly NaturezaVeiculo[] {
    return NATUREZAS_DE_VEICULO.filter((n) => TipoEmbarcacao.classesDa(tipo, n).length > 0)
  },

  de(valor: string | null | undefined): TipoEmbarcacao | null {
    return deValor(TIPOS_DE_EMBARCACAO, valor)
  },
} as const
