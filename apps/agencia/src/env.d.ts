/**
 * As variáveis de ambiente que o app lê. Todas `PUBLIC_`, porque vão para o bundle — e por isso nenhuma é
 * segredo. Credencial nenhuma mora aqui: quem fala com o Firestore é a `naveg-api-vercel`.
 */
interface ImportMetaEnv {
  /**
   * A raiz da API da agência (`/api`, ou `https://…`; sem `/catalogo`). Ausente: `/api`, a API atrás do site.
   * `demonstracao`: o catálogo de demonstração. Ver `conteudo/api.ts`.
   */
  readonly PUBLIC_URL_DA_API?: string
  /** A chave **pública** do widget do Turnstile. Ausente: a reserva fica em memória. Ver `conteudo/api.ts`. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
