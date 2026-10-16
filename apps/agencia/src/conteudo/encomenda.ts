/**
 * **A seção "Envie sua encomenda"**, depois da 2.7 (decisão B, PO, 2026-10-15).
 *
 * A reserva da encomenda passou para o caminho da reserva ("O que vai embarcar?" → Encomenda). A seção fica, curta:
 * como funciona, em quatro passos, e o botão que abre a reserva já em "Encomenda". Quem procura "Encomendas" no menu,
 * ou toca em "Enviar encomenda" na capa, acha o assunto explicado, e não um formulário.
 *
 * O quarto passo é o texto da decisão G, que o PO confirmou: a retirada no destino é com documento, no porto.
 */
import { ANCORA_DA_RESERVA_DE_ENCOMENDA } from './secoes'

export const ENVIE_SUA_ENCOMENDA = {
  passos: [
    'Reserve aqui: o que vai, quanto pesa e o dia.',
    'O atendimento confirma com você pelo WhatsApp.',
    'Entregue no porto antes da saída: lá a encomenda é pesada e o frete é pago.',
    'No destino, ela é retirada no porto com documento.',
  ],
  acao: { rotulo: 'Mandar uma encomenda', href: `#${ANCORA_DA_RESERVA_DE_ENCOMENDA}` },
} as const
