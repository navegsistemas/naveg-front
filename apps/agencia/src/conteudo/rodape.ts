/**
 * **O que o rodapé declara** — identificação, contato, endereços e o que a lei exige.
 *
 * Todo campo aqui é `string | null`, e **nenhum foi preenchido com valor plausível**. Um CNPJ inventado numa
 * página institucional não é um lugar-tenente inofensivo: ele parece certo, ninguém confere, e a empresa passa
 * a publicar a identificação de outra. O rodapé desenha o lugar do campo e diz que ele falta.
 *
 * ### Os que a lei pede, e por que estão aqui desde já
 *
 * O totem vai **tratar dado pessoal** — nome, documento, data de nascimento, telefone de quem reserva. Isso
 * coloca a NAVEG na LGPD como controladora, e com ela vêm duas obrigações que aparecem no rodapé: a **política
 * de privacidade** e o **canal do encarregado** (art. 41). Declará-los como pendência agora é melhor do que
 * descobri-los no dia do lançamento do totem, quando já serão bloqueantes.
 */

export interface Identificacao {
  /** Como a marca assina. */
  readonly nomeFantasia: string
  /** Como a empresa é registrada. `null` enquanto não informada. */
  readonly razaoSocial: string | null
  /** Só dígitos ou pontuado — [formatarCnpj] normaliza, e o build recusa dígito verificador errado. */
  readonly cnpj: string | null
}

export interface Endereco {
  readonly id: string
  /** O nome curto da praça: "Belém", "Macapá". */
  readonly rotulo: string
  readonly logradouro: string | null
  readonly complemento: string | null
  readonly municipio: string
  readonly uf: string
  readonly cep: string | null
}

export interface Contato {
  /** Como as pessoas escrevem. `normalizarTelefone` cuida da conversão para o `tel:`. */
  readonly telefone: string | null
  readonly email: string | null
  readonly horario: string
}

export interface LinkLegal {
  readonly id: string
  readonly rotulo: string
  /** `null` enquanto a página não existe — e sem endereço não há link. */
  readonly href: string | null
  /** Por que ele existe. Vai para o `title`, e explica a pendência a quem for preenchê-la. */
  readonly motivo: string
}

export const IDENTIFICACAO: Identificacao = {
  nomeFantasia: 'NAVEG — Turismo e Logística',
  razaoSocial: null,
  cnpj: null,
}

export const CONTATO: Contato = {
  telefone: null,
  email: null,
  horario: '24 horas, todos os dias',
}

export const ENDERECOS: readonly Endereco[] = [
  {
    id: 'belem',
    rotulo: 'Belém',
    logradouro: null,
    complemento: null,
    municipio: 'Belém',
    uf: 'PA',
    cep: null,
  },
  {
    id: 'macapa',
    rotulo: 'Macapá',
    logradouro: null,
    complemento: null,
    municipio: 'Macapá',
    uf: 'AP',
    cep: null,
  },
]

export const LINKS_LEGAIS: readonly LinkLegal[] = [
  {
    id: 'privacidade',
    rotulo: 'Política de Privacidade',
    href: null,
    motivo: 'Obrigatória: o totem trata dado pessoal de quem reserva.',
  },
  {
    id: 'termos',
    rotulo: 'Termos de Uso',
    href: null,
    motivo: 'Define o que a reserva é — e o que ela não é.',
  },
]

/** O canal do encarregado de dados (LGPD, art. 41). Um dos dois basta; os dois é melhor. */
export const ENCARREGADO_LGPD: { readonly nome: string | null; readonly email: string | null } = {
  nome: null,
  email: null,
}
