/**
 * **A conta de quem compra pelo site** — `empresas/{agência}/contasDeCliente/{id}` (venda online, 7.4).
 *
 * A fonte deste contrato é o `ContaDoClienteDocumento.kt` do `fluviapp-kmp` e a regra `formaDaConta` de lá
 * (fluviapp-kmp#70, #71, #76 e #79; ADR-0022). **Quem grava é o servidor da agência** (`naveg-api-vercel`); o painel
 * lê, desativa, reativa e corrige o cadastro. Uma chave com outro nome não dá erro aqui: dá `PERMISSION_DENIED`
 * no lote, ou uma conta que some do painel.
 *
 * ### O documento vem na primeira compra
 *
 * A conta nasce **sem documento** (PO, 2026-10-19: "melhor passar a sensação de emitir um documento usando seu
 * documento oficial em ambiente seguro ao emitir a passagem"), e quem nunca compra não deixa documento guardado.
 * O tipo e o número andam juntos, ou nenhum dos dois. O servidor grava o documento **uma vez**, com o índice
 * `documentosDeConta` no mesmo lote ([loteDoDocumentoDaConta]); corrigir depois é do painel.
 *
 * ### Ausente é omitido, e não `null`
 *
 * A regra aceita as duas formas, mas o decodificador do KMP declara `tipoDocumento: String = ""`, não anulável:
 * uma chave `null` ali é risco de leitura quebrada no painel, e uma chave ausente não é. Por isso
 * [contaParaDocumento] **omite** o que não há. O fechamento do atendimento é a exceção, porque lá o Kotlin é
 * anulável (`atendimento-da-conta.ts`).
 *
 * ### Sem relógio
 *
 * O domínio não lê o relógio: `criadaEm` e o `hoje` da idade entram por parâmetro.
 */
import { TipoDocumento } from '../documento/tipo-documento.js'
import { DataCalendario } from '../primitivos/calendario.js'
import { normalizarWhatsapp } from '../reserva/contato.js'

/** As chaves, na ordem do `ContaDoClienteDocumento.kt` — as mesmas do `hasOnly` da regra. */
export const CAMPOS_DA_CONTA = [
  'nome',
  'email',
  'telefone',
  'tipoDocumento',
  'numeroDocumento',
  'dataNascimento',
  'criadaEm',
  'confirmadaEm',
  'ativa',
  'ultimoEnvioTipo',
  'ultimoEnvioEm',
  'bloqueadaAte',
  'envioPorEmail',
  'envioPorEmailEm',
  'envioPorWhatsapp',
  'envioPorWhatsappEm',
] as const

/** O último link mandado (#71), espelhado pelo servidor para o painel ver. */
export const TIPOS_DE_LINK = ['CONFIRMACAO', 'TROCA_DE_SENHA'] as const
export type TipoDeLink = (typeof TIPOS_DE_LINK)[number]

/**
 * **Os documentos que a conta aceita** (3.1, E; PO, 2026-10-16): CPF, RG, CNH e Passaporte. **Sem CNPJ**: a conta é
 * de pessoa. A regra do Firestore aceita os cinco do `TipoDocumento`; quem restringe é o domínio.
 */
export const TIPOS_DE_DOCUMENTO_DA_CONTA = ['CPF', 'RG', 'CNH', 'PASSAPORTE'] as const satisfies readonly TipoDocumento[]

/** **18 anos** (3.1, D): menores viajam com a passagem comprada por um adulto, como no balcão. */
export const IDADE_MINIMA_DA_CONTA = 18

/** **Pelo menos 8 caracteres**, sem regra de símbolo (3.1, C). A senha comum ou vazada, quem recusa é a API. */
export const TAMANHO_MINIMO_DA_SENHA = 8

/** Os limites da regra. */
export const LIMITE_DO_NOME_DA_CONTA = 120
export const LIMITE_DO_EMAIL_DA_CONTA = 254

/** A forma gravada. Plana, sem mapa; datas de registro em epoch millis; as opcionais, ausentes quando não há. */
export interface ContaDoClienteDocumento {
  readonly nome: string
  readonly email: string
  /** O celular com WhatsApp, canônico (`5591988887777`), como o da reserva. */
  readonly telefone: string
  readonly tipoDocumento?: TipoDocumento
  /** Canônico ([TipoDocumento.normalizar]): sem pontuação. */
  readonly numeroDocumento?: string
  /** ISO `yyyy-MM-dd`, como em `passageiros/`. */
  readonly dataNascimento: string
  readonly criadaEm: number
  readonly confirmadaEm?: number
  readonly ativa: boolean
  readonly ultimoEnvioTipo?: TipoDeLink
  readonly ultimoEnvioEm?: number
  readonly bloqueadaAte?: number
  readonly envioPorEmail?: boolean
  readonly envioPorEmailEm?: number
  readonly envioPorWhatsapp?: boolean
  readonly envioPorWhatsappEm?: number
}

/** O documento da conta: o tipo e o número canônico, sempre juntos. */
export interface DocumentoDaConta {
  readonly tipo: TipoDocumento
  readonly numero: string
}

/** A permissão de mandar a passagem por um canal (O17, fluviapp-kmp#79): o sim ou o não, e desde quando. */
export interface PermissaoDeEnvio {
  readonly permitida: boolean
  readonly em: number
}

/** O último link mandado: qual, e quando. */
export interface EnvioDeLink {
  readonly tipo: TipoDeLink
  readonly em: number
}

/** A conta, no domínio. As ausências são `null`, e nunca texto vazio. */
export interface ContaDoCliente {
  readonly id: string
  readonly nome: string
  readonly email: string
  readonly telefone: string
  readonly dataNascimento: DataCalendario
  /** `null` até a primeira compra para si. */
  readonly documento: DocumentoDaConta | null
  readonly criadaEm: number
  /** `null` enquanto o e-mail não foi confirmado. */
  readonly confirmadaEm: number | null
  readonly ativa: boolean
  readonly ultimoEnvio: EnvioDeLink | null
  readonly bloqueadaAte: number | null
  /** `null` quando a pessoa ainda não respondeu. */
  readonly envioPorEmail: PermissaoDeEnvio | null
  readonly envioPorWhatsapp: PermissaoDeEnvio | null
}

// ---------------------------------------------------------------------------------------------------------
// O cadastro (3.1)
// ---------------------------------------------------------------------------------------------------------

/** O que a pessoa informa ao criar a conta. O documento não está aqui: ele vem na primeira compra. */
export interface CadastroDaConta {
  readonly nome: string
  readonly dataNascimento: string
  readonly email: string
  readonly telefone: string
  readonly senha: string
}

/** O que pode estar errado no cadastro, campo por campo: a tela erra embaixo do campo (3.1, achado 4). */
export const PENDENCIAS_DO_CADASTRO = [
  'NOME',
  'NASCIMENTO',
  'MENOR_DE_IDADE',
  'EMAIL',
  'TELEFONE',
  'SENHA_CURTA',
] as const
export type PendenciaDoCadastro = (typeof PENDENCIAS_DO_CADASTRO)[number]

/** O nome sem os espaços das pontas e sem espaço repetido no meio. */
export function normalizarNome(bruto: string): string {
  return bruto.trim().replace(/\s+/g, ' ')
}

/**
 * O e-mail sem espaços nas pontas e em minúsculas, ou `null` quando não parece um e-mail. A forma é a mesma que a
 * regra confere no e-mail novo do atendimento (`^[^@ ]+@[^@ ]+$`), com um ponto no domínio. Quem confirma que ele
 * existe é o link de confirmação (3.2).
 */
export function normalizarEmail(bruto: string): string | null {
  const email = bruto.trim().toLowerCase()
  if (email.length === 0 || email.length > LIMITE_DO_EMAIL_DA_CONTA) return null
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null
}

/** A idade completa em `hoje`. O aniversário de 29 de fevereiro conta em 1º de março nos anos comuns. */
export function idadeEm(nascimento: DataCalendario, hoje: DataCalendario): number {
  const n = DataCalendario.partes(nascimento)
  const h = DataCalendario.partes(hoje)
  const jaFezAniversario = h.mes > n.mes || (h.mes === n.mes && h.dia >= n.dia)
  return h.ano - n.ano - (jaFezAniversario ? 0 : 1)
}

/**
 * **O que falta ou está errado no cadastro** — a mesma conferência no site, para errar embaixo do campo, e na API,
 * que não confia no site. Vazio: o cadastro pode virar conta. A senha só é medida; a comum ou vazada, a API recusa.
 */
export function pendenciasDoCadastro(cadastro: CadastroDaConta, hoje: DataCalendario): ReadonlySet<PendenciaDoCadastro> {
  const pendencias = new Set<PendenciaDoCadastro>()
  const nome = normalizarNome(cadastro.nome)
  if (nome.length === 0 || nome.length > LIMITE_DO_NOME_DA_CONTA) pendencias.add('NOME')

  const nascimento = DataCalendario.de(cadastro.dataNascimento)
  if (nascimento === null || DataCalendario.comparar(nascimento, hoje) > 0) pendencias.add('NASCIMENTO')
  else if (idadeEm(nascimento, hoje) < IDADE_MINIMA_DA_CONTA) pendencias.add('MENOR_DE_IDADE')

  if (normalizarEmail(cadastro.email) === null) pendencias.add('EMAIL')
  if (normalizarWhatsapp(cadastro.telefone) === null) pendencias.add('TELEFONE')
  if (cadastro.senha.length < TAMANHO_MINIMO_DA_SENHA) pendencias.add('SENHA_CURTA')
  return pendencias
}

export type ResultadoDoCadastro =
  | { readonly caso: 'CONTA'; readonly conta: ContaDoCliente }
  | { readonly caso: 'PENDENTE'; readonly pendencias: ReadonlySet<PendenciaDoCadastro> }

/**
 * **Do cadastro à conta nova**: por confirmar, ativa, sem documento, sem permissão de envio respondida. A senha não
 * entra na conta — ela mora nos segredos, que só o servidor lê.
 */
export function contaNova(
  id: string,
  cadastro: CadastroDaConta,
  criadaEm: number,
  hoje: DataCalendario,
): ResultadoDoCadastro {
  const pendencias = pendenciasDoCadastro(cadastro, hoje)
  const email = normalizarEmail(cadastro.email)
  const telefone = normalizarWhatsapp(cadastro.telefone)
  const dataNascimento = DataCalendario.de(cadastro.dataNascimento)
  if (pendencias.size > 0 || email === null || telefone === null || dataNascimento === null) {
    return { caso: 'PENDENTE', pendencias }
  }
  return {
    caso: 'CONTA',
    conta: {
      id,
      nome: normalizarNome(cadastro.nome),
      email,
      telefone,
      dataNascimento,
      documento: null,
      criadaEm,
      confirmadaEm: null,
      ativa: true,
      ultimoEnvio: null,
      bloqueadaAte: null,
      envioPorEmail: null,
      envioPorWhatsapp: null,
    },
  }
}

// ---------------------------------------------------------------------------------------------------------
// O documento (a primeira compra)
// ---------------------------------------------------------------------------------------------------------

/**
 * O documento informado → o da conta, canônico, ou `null` quando o tipo não é aceito na conta ou o número não
 * confere (o dígito verificador do CPF, o comprimento dos outros).
 */
export function documentoDaConta(tipo: string, numero: string): DocumentoDaConta | null {
  const conhecido = TipoDocumento.de(tipo)
  if (conhecido === null || !(TIPOS_DE_DOCUMENTO_DA_CONTA as readonly TipoDocumento[]).includes(conhecido)) return null
  if (!TipoDocumento.validar(conhecido, numero)) return null
  return { tipo: conhecido, numero: TipoDocumento.normalizar(conhecido, numero) }
}

/** **A conta já tem documento?** É o que o "para mim" da compra pergunta para vir preenchido (7.6). */
export function contaTemDocumento(conta: ContaDoCliente): conta is ContaDoCliente & { readonly documento: DocumentoDaConta } {
  return conta.documento !== null
}

/** O documento como a tela mostra: **sempre mascarado**, inclusive para o dono (4.2, D; O12). */
export function documentoMascarado(documento: DocumentoDaConta): string {
  return `${TipoDocumento.rotulo(documento.tipo)} ${TipoDocumento.mascarar(documento.tipo, documento.numero)}`
}

// ---------------------------------------------------------------------------------------------------------
// O índice: uma conta por documento na agência
// ---------------------------------------------------------------------------------------------------------

/** As chaves do `IndiceDaContaDocumento.kt`. */
export const CAMPOS_DO_INDICE_DA_CONTA = ['contaId'] as const

export interface IndiceDaContaDocumento {
  readonly contaId: string
}

/** A chave do índice: `CPF:52998224725`, o tipo e o número canônico — a mesma do passageiro. */
export function chaveDoIndiceDaConta(documento: DocumentoDaConta): string {
  return `${documento.tipo}:${TipoDocumento.normalizar(documento.tipo, documento.numero)}`
}

// ---------------------------------------------------------------------------------------------------------
// O resumo, para a plataforma (O12)
// ---------------------------------------------------------------------------------------------------------

/** `empresas/{agência}/resumos/contasDeCliente`: o que a plataforma vê da agência, sem dado pessoal. */
export const CAMPOS_DO_RESUMO_DAS_CONTAS = ['total', 'confirmadas', 'ultimaCriadaEm'] as const

export interface ResumoDasContasDocumento {
  readonly total: number
  readonly confirmadas: number
  readonly ultimaCriadaEm?: number
}

// ---------------------------------------------------------------------------------------------------------
// O codec
// ---------------------------------------------------------------------------------------------------------

/** A conta → o documento gravado. As ausências são **omitidas** (ver o topo do arquivo). */
export function contaParaDocumento(conta: ContaDoCliente): ContaDoClienteDocumento {
  return {
    nome: conta.nome,
    email: conta.email,
    telefone: conta.telefone,
    ...(conta.documento !== null && {
      tipoDocumento: conta.documento.tipo,
      numeroDocumento: TipoDocumento.normalizar(conta.documento.tipo, conta.documento.numero),
    }),
    dataNascimento: conta.dataNascimento,
    criadaEm: conta.criadaEm,
    ...(conta.confirmadaEm !== null && { confirmadaEm: conta.confirmadaEm }),
    ativa: conta.ativa,
    ...(conta.ultimoEnvio !== null && { ultimoEnvioTipo: conta.ultimoEnvio.tipo, ultimoEnvioEm: conta.ultimoEnvio.em }),
    ...(conta.bloqueadaAte !== null && { bloqueadaAte: conta.bloqueadaAte }),
    ...(conta.envioPorEmail !== null && {
      envioPorEmail: conta.envioPorEmail.permitida,
      envioPorEmailEm: conta.envioPorEmail.em,
    }),
    ...(conta.envioPorWhatsapp !== null && {
      envioPorWhatsapp: conta.envioPorWhatsapp.permitida,
      envioPorWhatsappEm: conta.envioPorWhatsapp.em,
    }),
  }
}

const texto = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const inteiro = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) ? v : null)
const positivo = (v: unknown): number | null => {
  const n = inteiro(v)
  return n !== null && n > 0 ? n : null
}

function permissao(permitida: unknown, em: unknown): PermissaoDeEnvio | null {
  const quando = positivo(em)
  return typeof permitida === 'boolean' && quando !== null ? { permitida, em: quando } : null
}

/**
 * O documento gravado → a conta, ou `null` quando ele não tem a forma da regra (o nome, o e-mail, o celular, o
 * nascimento, a criação e o `ativa`). Fail-closed: a API não abre "Minha conta" com metade dos dados.
 *
 * **O documento ilegível também recusa a conta**, ao contrário do painel, que a mostra sem ele para alguém
 * corrigir (#71). Aqui, devolver a conta sem documento faria a primeira compra pedir de novo, e o lote seria
 * recusado pela regra — melhor parar antes.
 */
export function contaDoDocumento(id: string, dado: unknown): ContaDoCliente | null {
  if (typeof dado !== 'object' || dado === null || id.length === 0) return null
  const d = dado as Record<string, unknown>

  const nome = texto(d['nome'])
  const email = texto(d['email'])
  const telefone = texto(d['telefone'])
  const dataNascimento = DataCalendario.de(texto(d['dataNascimento']))
  const criadaEm = inteiro(d['criadaEm'])
  const ativa = d['ativa']
  if (
    nome === null || nome.length === 0 ||
    email === null || email.length === 0 ||
    telefone === null || telefone.length === 0 ||
    dataNascimento === null || criadaEm === null || typeof ativa !== 'boolean'
  ) {
    return null
  }

  let documento: DocumentoDaConta | null = null
  if (d['tipoDocumento'] !== undefined && d['tipoDocumento'] !== null) {
    const tipo = TipoDocumento.de(texto(d['tipoDocumento']))
    const numero = texto(d['numeroDocumento'])
    if (tipo === null || numero === null || !/^[0-9A-Z]{5,14}$/.test(numero)) return null
    documento = { tipo, numero }
  } else if (d['numeroDocumento'] !== undefined && d['numeroDocumento'] !== null) {
    return null
  }

  const tipoDoLink = TIPOS_DE_LINK.find((t) => t === d['ultimoEnvioTipo'])
  const ultimoEnvioEm = positivo(d['ultimoEnvioEm'])

  return {
    id,
    nome,
    email,
    telefone,
    dataNascimento,
    documento,
    criadaEm,
    confirmadaEm: positivo(d['confirmadaEm']),
    ativa,
    ultimoEnvio: tipoDoLink !== undefined && ultimoEnvioEm !== null ? { tipo: tipoDoLink, em: ultimoEnvioEm } : null,
    bloqueadaAte: positivo(d['bloqueadaAte']),
    envioPorEmail: permissao(d['envioPorEmail'], d['envioPorEmailEm']),
    envioPorWhatsapp: permissao(d['envioPorWhatsapp'], d['envioPorWhatsappEm']),
  }
}

// ---------------------------------------------------------------------------------------------------------
// Os lotes
// ---------------------------------------------------------------------------------------------------------

/**
 * **Uma escrita do lote**, com o caminho a partir de `empresas/{agência}/`. O domínio descreve; a API executa,
 * numa transação ou num `batch` do Firestore. A regra confere a conta e o índice um pelo outro (`getAfter`): os
 * dois vão juntos, ou o lote inteiro é recusado.
 */
export type EscritaDaConta =
  | { readonly op: 'criar'; readonly caminho: string; readonly dados: object }
  | { readonly op: 'atualizar'; readonly caminho: string; readonly dados: object }
  | { readonly op: 'apagar'; readonly caminho: string }

export const caminhoDaConta = (contaId: string): string => `contasDeCliente/${contaId}`
export const caminhoDoIndiceDaConta = (documento: DocumentoDaConta): string =>
  `documentosDeConta/${chaveDoIndiceDaConta(documento)}`

/**
 * **Criar a conta.** O índice entra só se ela já nasce com documento — o que, desde 2026-10-19, o cadastro do site
 * não faz. O resumo (`resumos/contasDeCliente`) é contado pela API, com incremento, fora desta lista.
 */
export function loteDaContaNova(conta: ContaDoCliente): readonly EscritaDaConta[] {
  const escritas: EscritaDaConta[] = [
    { op: 'criar', caminho: caminhoDaConta(conta.id), dados: contaParaDocumento(conta) },
  ]
  if (conta.documento !== null) {
    escritas.push({ op: 'criar', caminho: caminhoDoIndiceDaConta(conta.documento), dados: { contaId: conta.id } })
  }
  return escritas
}

export type ResultadoDoDocumentoDaConta =
  | { readonly caso: 'LOTE'; readonly escritas: readonly EscritaDaConta[]; readonly conta: ContaDoCliente }
  /** A conta já tem documento: o servidor grava uma vez; corrigir é do painel (#71, caso 7). */
  | { readonly caso: 'JA_TEM_DOCUMENTO' }
  /** O tipo não é aceito na conta, ou o número não confere. */
  | { readonly caso: 'DOCUMENTO_INVALIDO' }

/**
 * **Gravar o documento na primeira compra para si.** A conta ganha o tipo e o número, e o índice nasce no mesmo
 * lote. **Se o documento já é de outra conta**, o `create` do índice é recusado (o documento já existe): a API
 * confere antes, pela chave, e responde "Este documento já está em outra conta: entre por ela ou fale com o
 * atendimento".
 */
export function loteDoDocumentoDaConta(conta: ContaDoCliente, tipo: string, numero: string): ResultadoDoDocumentoDaConta {
  if (conta.documento !== null) return { caso: 'JA_TEM_DOCUMENTO' }
  const documento = documentoDaConta(tipo, numero)
  if (documento === null) return { caso: 'DOCUMENTO_INVALIDO' }
  return {
    caso: 'LOTE',
    conta: { ...conta, documento },
    escritas: [
      {
        op: 'atualizar',
        caminho: caminhoDaConta(conta.id),
        dados: { tipoDocumento: documento.tipo, numeroDocumento: documento.numero },
      },
      { op: 'criar', caminho: caminhoDoIndiceDaConta(documento), dados: { contaId: conta.id } },
    ],
  }
}

/**
 * **Apagar a conta** (O7, pelo Meus dados; a conta nunca confirmada, naveg-api-vercel#43; o pedido do painel,
 * `APAGAR_CONTA`). O índice sai no mesmo lote, para o documento não ficar preso. Os `segredos` da conta e o resumo
 * a API leva junto: o domínio não conhece os nomes deles.
 */
export function loteDaContaApagada(conta: ContaDoCliente): readonly EscritaDaConta[] {
  const escritas: EscritaDaConta[] = [{ op: 'apagar', caminho: caminhoDaConta(conta.id) }]
  if (conta.documento !== null) escritas.push({ op: 'apagar', caminho: caminhoDoIndiceDaConta(conta.documento) })
  return escritas
}
