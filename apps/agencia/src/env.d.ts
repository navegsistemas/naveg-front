/**
 * As variáveis de ambiente que o app lê. Todas `PUBLIC_`, porque vão para o bundle — e por isso nenhuma é
 * segredo. Credencial nenhuma mora aqui: quem fala com o Firestore é a `naveg-api-vercel`.
 */
interface ImportMetaEnv {
  /**
   * A raiz da API da agência (`https://…`, sem `/catalogo`). Ausente: a API de produção. `demonstracao`: o
   * catálogo de demonstração. Ver `conteudo/api.ts`.
   */
  readonly PUBLIC_URL_DA_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
