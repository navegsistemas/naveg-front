/**
 * **A reserva de encomenda: a montagem, a coerência e a mensagem para o atendente.**
 */
import { describe, expect, it } from 'vitest'

import { mensagemDaEncomenda } from '../src/encomenda/mensagem-da-encomenda.js'
import { linkDaEncomenda, mensagemDaReserva } from '../src/reserva/link-de-atendimento.js'
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
  it('para outra pessoa: o código, a saída, o que vai e quem retira, com o celular dele', () => {
    const reserva = reservaDe(montarEncomenda({ ...ENCOMENDA_PARA_OUTRA, complemento: 'mantimentos' }, contexto(), IDENTIDADE))
    expect(mensagemDaEncomenda(reserva, ROTULOS)).toBe(
      [
        'Encomenda NVG-7K3QP2',
        'Porto do Sal · Belém/PA → Porto de Santana · Santana/AP · Qua, 14/10 · 18:00',
        '3 volumes · Caixa (mantimentos) · 5 a 20 kg',
        'De Maria Souza para João Lima, (96) 98888-7777',
        'Entregue no porto antes da partida.',
      ].join('\n'),
    )
  })

  it('do próprio remetente: quem envia e retira, com o celular dele', () => {
    const reserva = reservaDe(montarEncomenda(ENCOMENDA_DO_PROPRIO, contexto(), IDENTIDADE))
    const linhas = mensagemDaEncomenda(reserva, ROTULOS).split('\n')
    expect(linhas[2]).toBe('1 volume · Saco ou fardo · Até 5 kg')
    expect(linhas[3]).toBe('Carlos Melo envia e retira no destino, (91) 98888-1234')
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
