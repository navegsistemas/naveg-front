/**
 * **`@naveg/domain`** — o domínio da reserva.
 *
 * Três partes, e as fronteiras entre elas são o que importa:
 *
 * - **o porte** (`primitivos/`, `passagem/`, `documento/`, `localidade/`, `rota/`, `viagem/`) — o subconjunto
 *   do domínio do **aplicativo fluviapp** (a gestão comercial), com os mesmos valores canônicos e as mesmas
 *   regras. `test/contrato-fluviapp.spec.ts` confere contra o Kotlin;
 * - **o catálogo** (`catalogo/`) — os documentos do fluviapp lidos como o aplicativo os lê, e as travessias
 *   que a concessão da agência permite oferecer. A agência não tem catálogo próprio: é alimentada por ele;
 * - **a reserva** (`reserva/`) — a `Reserva` como tipo próprio (ADR-0001), a FSM dela, o roteiro do totem,
 *   o código `NVG-XXXXXX`, a validade (até a partida) e o codec.
 *
 * Sem React, sem Astro, sem Firebase — e `test/estrutura.spec.ts` é quem garante que continue assim.
 */

// --- primitivos ---
export { casoImpossivel, deValor, normalizarChave, rotuloDoNome } from './primitivos/fronteira.js'
export { DataCalendario, InstanteLocal, MINUTOS_POR_DIA } from './primitivos/calendario.js'
export type { PartesDaData } from './primitivos/calendario.js'
export { DiaSemana, DIAS_DA_SEMANA } from './primitivos/dia-semana.js'

// --- porte: passagem ---
export { CategoriaPassagem, CATEGORIAS_DE_PASSAGEM } from './passagem/categoria-passagem.js'
export { Acomodacao, ACOMODACOES } from './passagem/acomodacao.js'
export type { PropriedadesDaAcomodacao } from './passagem/acomodacao.js'
export { TipoPassagem, TIPOS_DE_PASSAGEM } from './passagem/tipo-passagem.js'
export { TipoGratuidade, TIPOS_DE_GRATUIDADE } from './passagem/tipo-gratuidade.js'
export { NaturezaVeiculo, NATUREZAS_DE_VEICULO } from './passagem/natureza-veiculo.js'
export { ClasseVeiculo, CLASSES_DE_VEICULO } from './passagem/classe-veiculo.js'
export type { PropriedadesDaClasse } from './passagem/classe-veiculo.js'

// --- porte: documento ---
export { TipoDocumento, TIPOS_DE_DOCUMENTO } from './documento/tipo-documento.js'
export type { PropriedadesDoDocumento } from './documento/tipo-documento.js'

// --- porte: o catálogo (localidade, porto, rota, embarcação, viagem, concessão) ---
export { Uf, UFS, rotuloDaLocalidade } from './localidade/localidade.js'
export type { Localidade } from './localidade/localidade.js'
export { rotaTemSentido } from './rota/rota.js'
export type { Porto, Rota } from './rota/rota.js'
export { TipoEmbarcacao, TIPOS_DE_EMBARCACAO } from './viagem/tipo-embarcacao.js'
export type { CargaAdmitida, PropriedadesDoTipo } from './viagem/tipo-embarcacao.js'
export type { Embarcacao } from './viagem/embarcacao.js'
export { OcorrenciaViagem } from './viagem/ocorrencia-viagem.js'
export { formatarHora, horaValida, minutosDaHora } from './viagem/hora-do-dia.js'
export {
  chegadaEstimada,
  DIAS_DA_JANELA,
  disponiveisAPartirDe,
  viagemTemSentido,
  ViagemSemana,
} from './viagem/viagem.js'
export type { Chegada, Viagem } from './viagem/viagem.js'
export { AtuacaoDaEmpresa } from './viagem/atuacao-da-empresa.js'

// --- a agência: o catálogo do fluviapp, lido e oferecido ---
export {
  ATUACAO_DA_AGENCIA,
  atuacaoDoDocumento,
  COLECOES_DO_FLUVIAPP,
  embarcacaoDoDocumento,
  localidadeDoDocumento,
  portoDoDocumento,
  rotaDoDocumento,
  viagemDoDocumento,
} from './catalogo/documentos.js'
export { travessiasOfertadas } from './catalogo/travessias.js'
export type { CatalogoDoFluviapp, TravessiaOfertada } from './catalogo/travessias.js'

// --- novo: a reserva ---
export { StatusReserva, STATUS_DE_RESERVA, STATUS_DA_WEB } from './reserva/status-reserva.js'
export {
  ALFABETO_DO_CODIGO,
  aleatoriedadeSegura,
  codigoValido,
  COMPRIMENTO_DO_SUFIXO,
  gerarCodigoDaReserva,
  normalizarCodigo,
  PREFIXO_DO_CODIGO,
} from './reserva/codigo-da-reserva.js'
export type { FonteDeAleatoriedade } from './reserva/codigo-da-reserva.js'
export { formatarWhatsapp, normalizarWhatsapp, whatsappValido } from './reserva/contato.js'
export { validadeDaReserva } from './reserva/validade-da-reserva.js'
export {
  chaveNatural,
  ORIGENS_DA_RESERVA,
  PENDENCIAS_DA_RESERVA,
  pendenciasDaReserva,
  pessoasDaReserva,
  placaCanonica,
  reservaCoerente,
  reservaExpirada,
} from './reserva/reserva.js'
export type {
  ContatoDaReserva,
  OrigemDaReserva,
  PassageiroDaReserva,
  PassageirosDaReserva,
  PendenciaDaReserva,
  PessoaDaReserva,
  Reserva,
  ReservaDePassageiro,
  ReservaDeVeiculo,
  VeiculoDaReserva,
} from './reserva/reserva.js'
export {
  CAMPOS_DO_VEICULO,
  camposDoVeiculo,
  camposExigidos,
  categoriasOfertadas,
  chaveDoNo,
  classeEmVigor,
  classesOfertadas,
  DOCUMENTOS_DE_PESSOA,
  pessoasDoBilhete,
  respondido,
  roteiroDaReserva,
  SEM_RESPONSAVEL,
  semResposta,
  tipoEmVigor,
  voltar,
} from './reserva/roteiro-da-reserva.js'
export type {
  CampoDoVeiculo,
  ContextoDaReserva,
  NoDoRoteiro,
  PassoDaReserva,
  RascunhoDePassageiro,
  RascunhoDePessoa,
  RascunhoDoContato,
  RascunhoDoVeiculo,
  RespostasDaReserva,
  Roteiro,
} from './reserva/roteiro-da-reserva.js'
export { montarReserva } from './reserva/montagem-da-reserva.js'
export type {
  IdentidadeDaReserva,
  MontagemIncoerente,
  MontagemIncompleta,
  MontagemOk,
  ResultadoDaMontagem,
} from './reserva/montagem-da-reserva.js'
export { CAMPOS_DO_DOCUMENTO, paraDocumento, paraDominio } from './reserva/documento.js'
export type { ContatoDocumento, PessoaDocumento, ReservaDocumento, VeiculoDocumento } from './reserva/documento.js'
