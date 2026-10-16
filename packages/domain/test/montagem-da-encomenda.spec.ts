/**
 * **A reserva de encomenda: a montagem, a coerência e a mensagem para o atendente.**
 */
import { describe, expect, it } from 'vitest'

import { mensagemDaEncomenda } from '../src/encomenda/mensagem-da-encomenda.js'
import { linkDaEncomenda, mensagemDaReserva, mensagemSemCodigo } from '../src/reserva/link-de-atendimento.js'
import { montarEncomenda, type ResultadoDaMontagemDaEncomenda } from '../src/encomenda/montagem-da-encomenda.js'
import { pendenciasDaReserva, type ReservaDeEncomenda } from '../src/reserva/reserva.js'
import { contexto, ENCOMENDA_DO_PROPRIO, ENCOMENDA_PARA_OUTRA, IDENTIDADE, instante } from './exemplos.js'

function reservaDe(resultado: ResultadoDaMontagemDaEncomenda): ReservaDeEncomenda {
  if (resultado.caso !== 'OK') throw new Error(`esperava OK, veio ${JSON.stringify(resultado, (_, v) => (v instanceof Set ? [...v] : v))}`)
  return resultado.reserva
}

function pendenciasDe(resultado: ResultadoDaMontagemDaEncomenda): string[] {
  if (resultado.caso !== 'INCOERENTE') throw new Error(`esperava INCOERENTE, veio ${resultado.caso}`)
  return [...resultado.pendencias].sort()
}

const ROTULOS = {
  origem: 'Porto do Sal · Belém/PA',
  destino: 'Porto de Santana · Santana/AP',
  partida: 'Qua, 14/10 · 18:00',
}

describe('a montagem', () => {
  it('para outra pessoa: o pedido, o destinatário e quem manda, com os celulares normalizados', () => {
    expect(reservaDe(montarEncomenda(ENCOMENDA_PARA_OUTRA, contexto(), IDENTIDADE))).toEqual({
      codigo: 'NVG-7K3QP2',
      ocorrencia: contexto().ocorrencia,
      cliente: { nome: 'Maria Souza', telefone: '5591988887777' },
      status: 'RESERVADA',
      origem: 'TOTEM_WEB',
      criadoEm: IDENTIDADE.criadoEm,
      expiraEm: contexto().partida,
      categoria: 'ENCOMENDA',
      tipoVolume: 'CAIXA',
      quantidadeVolumes: 3,
      faixaPeso: 'DE_5_A_20',
      retirada: 'OUTRA_PESSOA',
      destinatario: { nome: 'João Lima', telefone: '5596988887777' },
    })
  })

  it('do próprio remetente: sem destinatário, e com o celular de quem manda', () => {
    const reserva = reservaDe(montarEncomenda(ENCOMENDA_DO_PROPRIO, contexto(), IDENTIDADE))
    expect(reserva.retirada).toBe('REMETENTE')
    expect(reserva).not.toHaveProperty('destinatario')
    expect(reserva.cliente).toEqual({ nome: 'Carlos Melo', telefone: '5591988881234' })
  })

  it('o destinatário que sobrou de um "Outra pessoa" desfeito não entra', () => {
    const reserva = reservaDe(
      montarEncomenda({ ...ENCOMENDA_DO_PROPRIO, destinatario: { nome: 'João Lima', telefone: '(96) 98888-7777' } }, contexto(), IDENTIDADE),
    )
    expect(reserva).not.toHaveProperty('destinatario')
  })

  it('o complemento entra aparado, e em branco não entra', () => {
    const com = reservaDe(montarEncomenda({ ...ENCOMENDA_PARA_OUTRA, complemento: '  mantimentos ' }, contexto(), IDENTIDADE))
    expect(com.complemento).toBe('mantimentos')
    const sem = reservaDe(montarEncomenda({ ...ENCOMENDA_PARA_OUTRA, complemento: '   ' }, contexto(), IDENTIDADE))
    expect(sem).not.toHaveProperty('complemento')
  })

  it('a agência da implantação entra quando há uma', () => {
    const reserva = reservaDe(montarEncomenda(ENCOMENDA_PARA_OUTRA, contexto(), { ...IDENTIDADE, agenciaId: 'naveg' }))
    expect(reserva.agenciaId).toBe('naveg')
  })

  it('com o roteiro aberto, diz qual passo falta', () => {
    const resultado = montarEncomenda({ tipoVolume: 'CAIXA', quantidadeVolumes: 2 }, contexto(), IDENTIDADE)
    expect(resultado).toEqual({ caso: 'INCOMPLETA', faltando: { passo: 'PESO', opcoes: ['ATE_5', 'DE_5_A_20', 'DE_20_A_50', 'ACIMA_DE_50'] } })
  })
})

describe('a coerência', () => {
  it('celulares que não são celulares são apontados, cada um no seu lugar', () => {
    const resultado = montarEncomenda(
      { ...ENCOMENDA_PARA_OUTRA, cliente: { nome: 'Maria', telefone: '3222-1111' }, destinatario: { nome: 'João', telefone: '98888' } },
      contexto(),
      IDENTIDADE,
    )
    expect(pendenciasDe(resultado)).toEqual(['CLIENTE_TELEFONE', 'DESTINATARIO_TELEFONE'])
  })

  it('o complemento acima de 60 letras é recusado', () => {
    const resultado = montarEncomenda({ ...ENCOMENDA_PARA_OUTRA, complemento: 'x'.repeat(61) }, contexto(), IDENTIDADE)
    expect(pendenciasDe(resultado)).toEqual(['COMPLEMENTO'])
  })

  it('o navio que já partiu deixa a encomenda sem validade', () => {
    const resultado = montarEncomenda(ENCOMENDA_PARA_OUTRA, contexto(), { ...IDENTIDADE, criadoEm: instante('2026-10-14T18:30:00') })
    expect(pendenciasDe(resultado)).toEqual(['VALIDADE'])
  })

  it('a reserva lida de fora é conferida inteira: retirada e destinatário andam juntos', () => {
    const base = reservaDe(montarEncomenda(ENCOMENDA_DO_PROPRIO, contexto(), IDENTIDADE))
    expect([...pendenciasDaReserva({ ...base, destinatario: { nome: 'X', telefone: '5596988887777' } })]).toEqual(['DESTINATARIO_INDEVIDO'])
    expect([...pendenciasDaReserva({ ...base, cliente: { nome: 'Carlos' } })]).toEqual(['CLIENTE_TELEFONE_AUSENTE'])
    expect([...pendenciasDaReserva({ ...base, retirada: 'OUTRA_PESSOA' })]).toEqual(['DESTINATARIO_AUSENTE'])
    expect([...pendenciasDaReserva({ ...base, quantidadeVolumes: 21 })]).toEqual(['VOLUMES'])
  })

  it('a conversão é em encomenda: CONVERTIDA anda com o encomendaId, e só com ele', () => {
    const base = reservaDe(montarEncomenda(ENCOMENDA_DO_PROPRIO, contexto(), IDENTIDADE))
    expect([...pendenciasDaReserva({ ...base, status: 'CONVERTIDA', encomendaId: 'enc-1' })]).toEqual([])
    expect([...pendenciasDaReserva({ ...base, status: 'CONVERTIDA' })]).toEqual(['CONVERSAO'])
    expect([...pendenciasDaReserva({ ...base, encomendaId: 'enc-1' })]).toEqual(['CONVERSAO'])
  })
})

describe('a mensagem para o atendente', () => {
  /* 2.6, E (PO, 2026-10-16): a saudação, um campo por linha, e o pedido de confirmação. */
  it('para outra pessoa: o código, a saída, o que vai e quem retira, com o celular dele', () => {
    const reserva = reservaDe(montarEncomenda({ ...ENCOMENDA_PARA_OUTRA, complemento: 'mantimentos' }, contexto(), IDENTIDADE))
    expect(mensagemDaEncomenda(reserva, ROTULOS)).toBe(
      [
        'Olá! Gostaria de confirmar a encomenda que registrei pelo site.',
        '',
        '*Encomenda:* NVG-7K3QP2',
        '*Trecho:* Porto do Sal · Belém/PA → Porto de Santana · Santana/AP',
        '*Saída:* Qua, 14/10 · 18:00',
        '*Volumes:* 3 · Caixa (mantimentos) · 5 a 20 kg',
        '*Remetente:* Maria Souza',
        '*Destinatário:* João Lima, (96) 98888-7777',
        '',
        'Entrego no porto antes da saída. Aguardo a confirmação.',
      ].join('\n'),
    )
  })

  it('do próprio remetente: o celular vai com ele, e o destinatário é ele mesmo', () => {
    const reserva = reservaDe(montarEncomenda(ENCOMENDA_DO_PROPRIO, contexto(), IDENTIDADE))
    const linhas = mensagemDaEncomenda(reserva, ROTULOS).split('\n')
    expect(linhas).toContain('*Volumes:* 1 · Saco ou fardo · Até 5 kg')
    expect(linhas).toContain('*Remetente:* Carlos Melo, (91) 98888-1234')
    expect(linhas).toContain('*Destinatário:* o próprio remetente')
  })

  it('sem quem retira: o destinatário fica a combinar com o atendimento (naveg-front#58)', () => {
    const base = reservaDe(montarEncomenda(ENCOMENDA_DO_PROPRIO, contexto(), IDENTIDADE))
    const { retirada: _, ...semRetirada } = base
    const linhas = mensagemDaEncomenda(semRetirada, ROTULOS).split('\n')
    expect(linhas).toContain('*Remetente:* Carlos Melo, (91) 98888-1234')
    expect(linhas).toContain('*Destinatário:* a combinar com o atendimento')
  })

  it('a que o site não conseguiu enviar: a abertura diz o que aconteceu, e não há código', () => {
    const reserva = reservaDe(montarEncomenda(ENCOMENDA_PARA_OUTRA, contexto(), IDENTIDADE))
    const mensagem = mensagemSemCodigo(reserva, ROTULOS)
    expect(mensagem.split('\n')[0]).toBe(
      'Olá! Tentei registrar esta encomenda pelo site, mas ela não foi enviada. Podem registrá-la para mim?',
    )
    expect(mensagem).not.toMatch(/NVG-|\*Encomenda:\*/)
  })

  it('o link leva à conversa da NAVEG, com a mensagem inteira', () => {
    const reserva = reservaDe(montarEncomenda(ENCOMENDA_PARA_OUTRA, contexto(), IDENTIDADE))
    const link = new URL(linkDaEncomenda('(91) 99203-5322', reserva, ROTULOS))
    expect(`${link.origin}${link.pathname}`).toBe('https://wa.me/5591992035322')
    expect(link.searchParams.get('text')).toBe(mensagemDaEncomenda(reserva, ROTULOS))
  })

  it('a mensagem de uma Reserva qualquer, quando é encomenda, é a da encomenda', () => {
    const reserva = reservaDe(montarEncomenda(ENCOMENDA_PARA_OUTRA, contexto(), IDENTIDADE))
    expect(mensagemDaReserva(reserva, ROTULOS)).toBe(mensagemDaEncomenda(reserva, ROTULOS))
  })
})
