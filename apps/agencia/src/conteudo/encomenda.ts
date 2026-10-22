/**
 * **A seção "Envie sua encomenda"**, depois da 2.7 (decisão B, PO, 2026-10-15).
 *
 * A reserva da encomenda passou para o caminho da reserva ("O que vai embarcar?" → Encomenda). A seção fica, curta:
 * como funciona, em quatro passos, e o botão que abre a reserva já em "Encomenda". Quem procura "Encomendas" no menu,
 * ou toca em "Enviar encomenda" na capa, acha o assunto explicado, e não um formulário.
 *
 * Desde a 1.4 (PO, 2026-10-22: "melhor do que uma lista de frases, uma esquematização básica do passo a passo"), cada
 * passo é um ícone, um título curto e uma frase. As frases são as de antes, divididas: nada novo foi prometido. O
 * quarto passo é o texto da decisão G da 2.7, que o PO confirmou: a retirada no destino é com documento, no porto.
 */
import type { SlugIcone } from '@navegsistemas/design-system'

import { ANCORA_DA_RESERVA_DE_ENCOMENDA } from './secoes'

export interface PassoDaEncomenda {
  readonly icone: SlugIcone
  readonly titulo: string
  readonly texto: string
}

export const ENVIE_SUA_ENCOMENDA = {
  passos: [
    { icone: 'reserva', titulo: 'Reserve aqui', texto: 'O que vai, quanto pesa e o dia.' },
    { icone: 'whatsapp', titulo: 'Confirme pelo WhatsApp', texto: 'O atendimento confirma com você.' },
    {
      icone: 'barco',
      titulo: 'Entregue no porto',
      texto: 'Antes da saída. Lá a encomenda é pesada e o frete é pago.',
    },
    { icone: 'local', titulo: 'Retire no destino', texto: 'No porto, com documento.' },
  ] satisfies readonly PassoDaEncomenda[],
  acao: { rotulo: 'Mandar uma encomenda', href: `#${ANCORA_DA_RESERVA_DE_ENCOMENDA}` },
} as const
