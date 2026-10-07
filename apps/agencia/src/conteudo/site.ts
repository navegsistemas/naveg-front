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
   * **O endereço do site em produção** (D4; confirmado pelo PO em 2026-10-07): o domínio sem `www`, com o `www`
   * redirecionando para ele na Vercel. Daqui saem o canônico, o `og:url`, a imagem de compartilhamento, o
   * JSON-LD, o `sitemap.xml` e o `robots.txt` — tudo o que um buscador ou um cartão de link guarda.
   *
   * É também o host que os App Links vão verificar contra o `assetlinks.json`, e o que vai no link
   * `/r/{codigo}` da mensagem do WhatsApp: trocá-lo depois do app publicado quebra o deeplink de todas as
   * reservas já enviadas.
   */
  origem: 'https://gruponaveg.com.br',
  idioma: 'pt-BR',
  /**
   * **O cartão do link** — o que aparece ao mandar o endereço no WhatsApp. Gerado a partir do logo por
   * `npm run gerar:compartilhamento` (`scripts/gerar-compartilhamento.mjs`); troca quando chegar a foto de uma
   * embarcação. 1200×630, a proporção que o WhatsApp, o Facebook e o X mostram inteira.
   */
  imagemDeCompartilhamento: {
    caminho: '/compartilhamento.png',
    largura: 1200,
    altura: 630,
    descricao: 'O logo da NAVEG, com a frase "Reserve sua passagem de barco".',
  },
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
