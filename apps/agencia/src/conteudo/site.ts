/**
 * **O que a página diz sobre si mesma.** Título, descrição, origem — e a frase que atravessa o produto.
 *
 * Fica em dado, e não espalhado pelo `<head>`, porque três consumidores precisam dela: a tag `<title>`, o
 * cartão do OpenGraph e o JSON-LD. Três cópias manuais divergem; uma constante, não.
 */

export const SITE = {
  /** Como a marca assina. É o que está impresso no logo. */
  nome: 'NAVEG',
  nomeCompleto: 'NAVEG — Turismo e Logística',
  titulo: 'NAVEG — Turismo e Logística · Reserve sua passagem',
  descricao:
    'Reserve sua passagem de transporte fluvial pela agência virtual da NAVEG. ' +
    'Escolha a travessia, informe quem viaja e receba o código da reserva no WhatsApp.',
  /**
   * **Pendente de confirmação.** Este é o host que os App Links do passo 11 vão verificar contra o
   * `assetlinks.json`, e é o mesmo que entra no link `/r/{codigo}` da mensagem do WhatsApp. Trocá-lo depois do
   * app publicado quebra o deeplink de todas as reservas já enviadas.
   */
  origem: 'https://agencia.naveg.com.br',
  idioma: 'pt-BR',
} as const

/**
 * **A frase que evita a reclamação.**
 *
 * Ela aparece em três lugares — no topo do totem, no rodapé e na mensagem do WhatsApp — e é a mesma nos três
 * porque é a **expectativa** que ela ajusta: quem sai daqui com um código na mão não comprou passagem nenhuma.
 * Repetir a frase com outras palavras em cada lugar seria dar três versões do mesmo compromisso.
 */
export const AVISO_DE_RESERVA =
  'Este canal gera reserva, não venda. A emissão da passagem é feita pelo atendimento.'
