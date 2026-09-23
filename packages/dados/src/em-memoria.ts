/**
 * **Os adaptadores em memória** — para os cenários, e para o totem do passo 8, que ainda não grava em lugar
 * nenhum.
 *
 * O repositório guarda **o documento**, não a reserva: passa por `paraDocumento` exatamente como o adaptador
 * do Firestore passará. Assim um defeito no codec aparece aqui, e não só no dia em que a escrita for real.
 */
import { paraDocumento, type CatalogoDoFluviapp, type Reserva, type ReservaDocumento } from '@navegsistemas/domain'

import type { FonteDoCatalogo, ReservaRepositorio, ResultadoDaGravacao } from './portas.js'

export class ReservaEmMemoria implements ReservaRepositorio {
  private readonly documentos = new Map<string, ReservaDocumento>()

  /** Códigos que "já existem" antes de qualquer gravação — é como o cenário provoca a colisão. */
  constructor(ocupados: readonly string[] = []) {
    for (const codigo of ocupados) this.documentos.set(codigo, {} as ReservaDocumento)
  }

  async criar(reserva: Reserva): Promise<ResultadoDaGravacao> {
    /* A mesma semântica da Rule: `create` sobre documento existente é negado, nunca sobrescreve. */
    if (this.documentos.has(reserva.codigo)) return { caso: 'CODIGO_EM_USO' }
    this.documentos.set(reserva.codigo, paraDocumento(reserva))
    return { caso: 'GRAVADA' }
  }

  /** O que foi gravado, na forma em que foi gravado. Só para leitura em cenário. */
  documento(codigo: string): ReservaDocumento | undefined {
    return this.documentos.get(codigo)
  }
}

/** Uma fonte que devolve sempre o mesmo catálogo. */
export function catalogoFixo(catalogo: CatalogoDoFluviapp): FonteDoCatalogo {
  return { carregar: async () => catalogo }
}
