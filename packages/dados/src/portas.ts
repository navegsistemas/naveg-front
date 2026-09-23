/**
 * **A porta do catálogo** — a que só o totem usa.
 *
 * A outra porta, a de gravar a reserva (`ReservaRepositorio`), mudou-se para o `@navegsistemas/domain` junto com
 * o `enviarReserva`, porque o servidor também a usa. Esta fica: do lado da API, quem lê o catálogo é o
 * `LeitorDoCatalogo` dela, que devolve o pool inteiro; esta devolve o que já chegou recortado.
 */
import type { CatalogoDoFluviapp } from '@navegsistemas/domain'

/**
 * De onde vem o catálogo do fluviapp: a API da agência (`catalogoHttp`), ou qualquer coisa que devolva um
 * `CatalogoDoFluviapp` — inclusive o catálogo de demonstração, que se anuncia como tal.
 */
export interface FonteDoCatalogo {
  carregar(): Promise<CatalogoDoFluviapp>
}
