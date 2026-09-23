/**
 * **As duas portas do totem** — o que ele precisa do mundo, e nada mais.
 *
 * O totem depende **destas interfaces**, não do Firestore. É o que deixa o passo 8 fechar o fluxo inteiro em
 * memória, os cenários rodarem sem emulador, e o passo 10 trocar só o adaptador de escrita — sem que a ilha
 * saiba que alguma coisa mudou.
 */
import type { CatalogoDoFluviapp, Reserva } from '@navegsistemas/domain'

/**
 * O resultado de tentar gravar. `CODIGO_EM_USO` é caso próprio, e não uma falha genérica, porque é o único que
 * se resolve **tentando de novo com outro código** — é o `create` negado pela regra quando o documento já
 * existe (ADR-0002, camada 4).
 */
export type ResultadoDaGravacao =
  | { readonly caso: 'GRAVADA' }
  | { readonly caso: 'CODIGO_EM_USO' }
  | { readonly caso: 'FALHA'; readonly motivo: string }

/** Onde a reserva é gravada. Só criar: o público não lê, não altera, não apaga. */
export interface ReservaRepositorio {
  criar(reserva: Reserva): Promise<ResultadoDaGravacao>
}

/**
 * De onde vem o catálogo do fluviapp. No passo 9 é o JSON gerado no build; aqui, qualquer coisa que devolva um
 * `CatalogoDoFluviapp` — inclusive o catálogo de demonstração, que se anuncia como tal.
 */
export interface FonteDoCatalogo {
  carregar(): Promise<CatalogoDoFluviapp>
}
