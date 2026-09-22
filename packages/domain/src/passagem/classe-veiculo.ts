/**
 * **Classe do veículo** — porte de `domain/passagem/ClasseVeiculo.kt` do fluviapp (ADR-0031).
 *
 * > **Revisado contra o original em 2026-09-22.** A primeira versão deste arquivo veio do `@fluviapp/domain`
 * > web, que tinha **seis** classes e um `exigeModelo`. O aplicativo tem **dezessete**, agrupadas por
 * > natureza, e não tem `exigeModelo` — o modelo é sempre opcional (`Veiculo.pendencias()` só cobra placa e
 * > cilindrada). Pior: lá `CARRETA` é o **rebocado**, e o caminhão-trator é `CARRETA_CAVALINHO`. Uma
 * > reserva de "carreta" gravada com o significado antigo chegaria ao atendente como outra coisa. O cenário
 * > de contrato agora confere nome, natureza e cilindrada contra o Kotlin.
 *
 * A classe **não é catálogo editável**: o produto do modo veículo é a série contagem × classe × preço, e
 * nome editável parte a série sem deixar rastro (ADR-0031, decisão de 2026-08-01).
 *
 * `exigeCilindrada` é **declarada**, com um único `true` em dezessete linhas: só a moto. O quadriciclo é
 * motociclo e não exige — é a forma honesta de uma exceção, visível e só ela.
 */
import { deValor } from '../primitivos/fronteira.js'
import type { NaturezaVeiculo } from './natureza-veiculo.js'

export const CLASSES_DE_VEICULO = [
  'CARRO',
  'VAN',
  'SUV',
  'CAMINHAO',
  'MOTORHOME',
  'ONIBUS',
  'CARRETA_CAVALINHO',
  'MOTO',
  'QUADRICICLO',
  'TRATOR',
  'EMPILHADEIRA',
  'RETROESCAVADEIRA',
  'CARRETA',
  'TRAILER',
  'CARRETILHA',
  'JET_SKI',
  'LANCHA',
] as const

export type ClasseVeiculo = (typeof CLASSES_DE_VEICULO)[number]

export interface PropriedadesDaClasse {
  readonly rotulo: string
  readonly natureza: NaturezaVeiculo
  /** A tarifa desta classe depende da cilindrada informada. Só a moto. */
  readonly exigeCilindrada: boolean
}

function classe(rotulo: string, natureza: NaturezaVeiculo, exigeCilindrada = false): PropriedadesDaClasse {
  return { rotulo, natureza, exigeCilindrada }
}

const PROPRIEDADES: Readonly<Record<ClasseVeiculo, PropriedadesDaClasse>> = {
  // --- Automotor: roda em estrada e entra andando ---
  CARRO: classe('Carro', 'AUTOMOTOR'),
  VAN: classe('Van', 'AUTOMOTOR'),
  SUV: classe('SUV', 'AUTOMOTOR'),
  CAMINHAO: classe('Caminhão', 'AUTOMOTOR'),
  MOTORHOME: classe('Motorhome', 'AUTOMOTOR'),
  ONIBUS: classe('Ônibus', 'AUTOMOTOR'),
  /* O cavalo mecânico: a unidade **tratora**, motorizada — não o semirreboque que o nome evoca. */
  CARRETA_CAVALINHO: classe('Carreta Cavalinho', 'AUTOMOTOR'),
  // --- Motociclo ---
  MOTO: classe('Moto', 'MOTOCICLO', true),
  QUADRICICLO: classe('Quadriciclo', 'MOTOCICLO'),
  // --- Máquina: trabalha, não transporta ---
  TRATOR: classe('Trator', 'MAQUINA'),
  EMPILHADEIRA: classe('Empilhadeira', 'MAQUINA'),
  RETROESCAVADEIRA: classe('Retroescavadeira', 'MAQUINA'),
  // --- Rebocado: não entra andando ---
  CARRETA: classe('Carreta', 'REBOCADO'),
  TRAILER: classe('Trailer', 'REBOCADO'),
  CARRETILHA: classe('Carretilha', 'REBOCADO'),
  JET_SKI: classe('Jet-Ski', 'REBOCADO'),
  /* `Lancha` **como carga** — a embarcação transportada sobre carretilha, não o casco que transporta. O
     nome colide com `TipoEmbarcacao.LANCHA`, e o analista recusou renomear (ADR-0031 D5). */
  LANCHA: classe('Lancha', 'REBOCADO'),
}

export const ClasseVeiculo = {
  valores: CLASSES_DE_VEICULO,
  propriedades: PROPRIEDADES,

  rotulo(classe: ClasseVeiculo): string {
    return PROPRIEDADES[classe].rotulo
  },

  natureza(classe: ClasseVeiculo): NaturezaVeiculo {
    return PROPRIEDADES[classe].natureza
  },

  exigeCilindrada(classe: ClasseVeiculo): boolean {
    return PROPRIEDADES[classe].exigeCilindrada
  },

  /** As classes de uma natureza, na ordem canônica. É o `NaturezaVeiculo.classes` do Kotlin. */
  daNatureza(natureza: NaturezaVeiculo): readonly ClasseVeiculo[] {
    return CLASSES_DE_VEICULO.filter((c) => PROPRIEDADES[c].natureza === natureza)
  },

  de(valor: string | null | undefined): ClasseVeiculo | null {
    return deValor(CLASSES_DE_VEICULO, valor)
  },
} as const
