/**
 * **A hora como minutos desde a meia-noite** — porte de `viagem/hora-do-dia.ts` do `@fluviapp/domain`, que
 * porta `domain/viagem/HoraDoDia.kt` (decisão do analista, 2026-08-10). A exibição continua sendo `HH:mm`.
 *
 * A escolha não é de gosto: a hora da `Viagem` é o **único horário do sistema sobre o qual se faz conta**.
 * O `criadoEm` é texto porque ninguém soma datas de criação; aqui alguém soma — a chegada estimada é
 * `hora + tempoMedioH` —, e um `"18:30"` obrigaria cada leitor a ter o próprio parser.
 *
 * ### O que **não** veio no porte
 *
 * As funções de digitação — `digitosDaHora`, `mascararHora`, `minutosDosDigitos` — servem ao **cadastro**
 * de viagem, que é tela de funcionário e vive no aplicativo. No totem ninguém digita hora: escolhe-se uma
 * saída de uma lista, e o horário chega pronto do catálogo. Portar a máscara seria trazer o campo de
 * entrada mais delicado do fluviapp para um pacote que não tem o formulário que o justifica.
 *
 * Fica [minutosDaHora], que é a fronteira de **leitura** — o catálogo de viagens pode entregar a hora como
 * texto, e é por ela que ela vira número.
 */
import { MINUTOS_POR_DIA } from '../primitivos/calendario.js'

export { MINUTOS_POR_DIA }

/**
 * Minutos → `HH:mm`. Valores acima de um dia **dão a volta**, porque é o que a chegada estimada de uma
 * travessia longa produz: 26h depois da saída é uma hora do relógio, num dia adiante — e quantos dias
 * adiante é a chegada quem diz, não o relógio.
 */
export function formatarHora(minutos: number): string {
  const doDia = ((minutos % MINUTOS_POR_DIA) + MINUTOS_POR_DIA) % MINUTOS_POR_DIA
  const hora = Math.floor(doDia / 60)
  return `${hora.toString().padStart(2, '0')}:${(doDia % 60).toString().padStart(2, '0')}`
}

/**
 * `HH:mm` → minutos, ou **`null` quando não é uma hora**.
 *
 * Devolve `null` em vez de zero de propósito: `"00:00"` é meia-noite, um horário legítimo de saída de
 * balsa, e confundi-lo com "não informado" faria a fronteira aceitar campo vazio como madrugada.
 *
 * **Exige dois dígitos de cada lado.** A tolerância a `"8:05"` foi retirada no Kotlin porque o que ela
 * permitiria é a armadilha oposta: ler `"18:3"` como **18:03** quando se queria 18:30, silenciosamente.
 * Hora pela metade é hora incompleta, não hora abreviada.
 */
export function minutosDaHora(texto: string): number | null {
  const partes = texto.trim().split(':')
  if (partes.length !== 2) return null
  const [horaTexto, minutoTexto] = partes as [string, string]
  if (!/^\d{2}$/.test(horaTexto) || !/^\d{2}$/.test(minutoTexto)) return null

  const hora = Number(horaTexto)
  const minuto = Number(minutoTexto)
  if (hora > 23 || minuto > 59) return null

  return hora * 60 + minuto
}

/** A hora está dentro do relógio? É o que a fronteira pergunta antes de aceitar um horário do catálogo. */
export function horaValida(minutos: number): boolean {
  return Number.isInteger(minutos) && minutos >= 0 && minutos < MINUTOS_POR_DIA
}
