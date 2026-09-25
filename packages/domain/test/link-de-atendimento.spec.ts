import { describe, expect, it } from 'vitest'

import { linkDaReserva, linkDeWhatsApp, mensagemDaReserva } from '../src/reserva/link-de-atendimento.js'
import { montarReserva, type ResultadoDaMontagem } from '../src/reserva/montagem-da-reserva.js'
import type { Reserva } from '../src/reserva/reserva.js'
import { CLIENTE, contexto, IDENTIDADE, REDE_COMPLETA } from './exemplos.js'

function reservaDe(resultado: ResultadoDaMontagem): Reserva {
  if (resultado.caso !== 'OK') throw new Error(`esperava OK, veio ${JSON.stringify(resultado)}`)
  return resultado.reserva
}

const ROTULOS = {
  origem: 'Porto do Sal · Belém/PA',
  destino: 'Porto de Camará · Salvaterra/PA',
  partida: 'Qua, 14/10 · 18:00',
}

const REDE = reservaDe(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE))

/** O texto que chega do outro lado, lido de volta do link. */
function textoDo(link: string): string {
  return new URL(link).searchParams.get('text') ?? ''
}

describe('o link do WhatsApp', () => {
  it('o número vai só com dígitos e o código do país, qualquer que seja a grafia', () => {
    for (const grafia of ['(91) 98888-7777', '91988887777', '+55 91 98888-7777', '5591988887777']) {
      expect(linkDeWhatsApp(grafia), grafia).toBe('https://wa.me/5591988887777')
    }
  })

  it('um número que não é celular quebra, em vez de virar um link que não abre', () => {
    expect(() => linkDeWhatsApp('(91) 3333-4444')).toThrow(/Celular inválido/)
    expect(() => linkDeWhatsApp('98888-7777')).toThrow(/Celular inválido/)
  })

  it('sem mensagem, ou com mensagem em branco, é só o número', () => {
    expect(linkDeWhatsApp('(91) 98888-7777', '  ')).toBe('https://wa.me/5591988887777')
  })

  it('acento, & e quebra de linha chegam inteiros — nenhum vira outro parâmetro', () => {
    const mensagem = 'Suíte & camarote\nsegunda linha'
    const link = linkDeWhatsApp('(91) 98888-7777', mensagem)
    expect(link.split('?text=')[1]).not.toMatch(/[&\n ]/)
    expect(new URL(link).searchParams.size).toBe(1)
    expect(textoDo(link)).toBe(mensagem)
  })
})

describe('a mensagem da reserva', () => {
  it('o código na primeira linha — é por ele que o atendente acha a reserva', () => {
    expect(mensagemDaReserva(REDE, ROTULOS).split('\n')[0]).toBe('Reserva NVG-7K3QP2')
  })

  it('passageiro: travessia, acomodação, pessoas e nome', () => {
    expect(mensagemDaReserva(REDE, ROTULOS)).toBe(
      [
        'Reserva NVG-7K3QP2',
        'Porto do Sal · Belém/PA → Porto de Camará · Salvaterra/PA · Qua, 14/10 · 18:00',
        'Rede · 1 pessoa · Maria Souza',
        'Vale até a partida.',
      ].join('\n'),
    )
  })

  it('veículo: a classe no lugar da acomodação, e a cilindrada quando há', () => {
    const moto = reservaDe(
      montarReserva(
        { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO', cilindrada: 160, cliente: CLIENTE },
        contexto(),
        IDENTIDADE,
      ),
    )
    const carro = reservaDe(
      montarReserva({ categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', cliente: CLIENTE }, contexto('NAVIO'), IDENTIDADE),
    )
    expect(mensagemDaReserva(moto, ROTULOS).split('\n')[2]).toBe('Moto · 160 cc · Maria Souza')
    expect(mensagemDaReserva(carro, ROTULOS).split('\n')[2]).toBe('Carro · Maria Souza')
  })

  it('nem telefone nem documento vão na mensagem', () => {
    const mensagem = mensagemDaReserva(REDE, ROTULOS)
    expect(mensagem).not.toMatch(/9888|7777/)
    expect(mensagem).not.toMatch(/\d{11}/)
  })

  it('o link da reserva leva a mensagem inteira, que se lê de volta igual', () => {
    const link = linkDaReserva('(91) 98888-7777', REDE, ROTULOS)
    expect(link.startsWith('https://wa.me/5591988887777?text=')).toBe(true)
    expect(textoDo(link)).toBe(mensagemDaReserva(REDE, ROTULOS))
  })
})
