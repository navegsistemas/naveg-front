import { describe, expect, it } from 'vitest'

import { linkDaReserva, linkDeWhatsApp, linkSemCodigo, mensagemDaReserva, mensagemSemCodigo } from '../src/reserva/link-de-atendimento.js'
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

/* 2.6, E (PO, 2026-10-16): a saudação, um campo por linha com o nome em negrito, e o pedido de confirmação. */
describe('a mensagem da reserva', () => {
  it('o código é o primeiro campo, logo depois da saudação — é por ele que o atendente acha a reserva', () => {
    expect(mensagemDaReserva(REDE, ROTULOS).split('\n').slice(0, 3)).toEqual([
      'Olá! Gostaria de confirmar a reserva que fiz pelo site.',
      '',
      '*Reserva:* NVG-7K3QP2',
    ])
  })

  it('passageiro: o trecho, a saída, a passagem e o nome, e o pedido de confirmação', () => {
    expect(mensagemDaReserva(REDE, ROTULOS)).toBe(
      [
        'Olá! Gostaria de confirmar a reserva que fiz pelo site.',
        '',
        '*Reserva:* NVG-7K3QP2',
        '*Trecho:* Porto do Sal · Belém/PA → Porto de Camará · Salvaterra/PA',
        '*Saída:* Qua, 14/10 · 18:00',
        '*Passagem:* Rede · 1 pessoa',
        '*Nome:* Maria Souza',
        '',
        'Aguardo a confirmação.',
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
    expect(mensagemDaReserva(moto, ROTULOS).split('\n')).toContain('*Veículo:* Moto · 160 cc')
    expect(mensagemDaReserva(carro, ROTULOS).split('\n')).toContain('*Veículo:* Carro')
    expect(mensagemDaReserva(carro, ROTULOS)).not.toMatch(/Acompanhantes|Passagem/)
  })

  it('passageiros e veículo: as pessoas vão junto, como o painel do KMP escreve (naveg-front#66)', () => {
    const juntos = reservaDe(
      montarReserva(
        {
          canal: 'SITE',
          embarque: 'PASSAGEIROS_E_VEICULO',
          porteVeiculo: 'PESADO',
          classeVeiculo: 'CAMINHAO',
          quantidadePessoas: 3,
          acomodacao: 'REDE',
          cliente: CLIENTE,
        },
        contexto(),
        IDENTIDADE,
      ),
    )
    const linhas = mensagemDaReserva(juntos, ROTULOS).split('\n')
    expect(linhas).toContain('*Veículo:* Caminhão')
    expect(linhas).toContain('*Acompanhantes:* 3 pessoas em rede')
  })

  it('o cais do dia e o aviso da data alterada vão logo abaixo da saída (UI 2.2)', () => {
    const rotulos = {
      origem: 'Belém/PA',
      destino: 'Macapá/AP',
      partida: 'Qua, 14/10 · 19:00',
      embarque: 'Porto Brilhante · Belém/PA',
      alteracao: 'Embarque alterado nesta data: Cais em obra',
    }
    expect(mensagemDaReserva(REDE, rotulos).split('\n').slice(3, 7)).toEqual([
      '*Trecho:* Belém/PA → Macapá/AP',
      '*Saída:* Qua, 14/10 · 19:00',
      '*Embarque:* Porto Brilhante · Belém/PA',
      '*Atenção:* Embarque alterado nesta data: Cais em obra',
    ])
    expect(mensagemDaReserva(REDE, { ...rotulos, alteracao: null }).split('\n')[6]).toBe('*Passagem:* Rede · 1 pessoa')
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

/* 2.6, B (PO, 2026-10-16): a reserva que o site não conseguiu enviar vai pelo WhatsApp, sem código — nada foi gravado. */
describe('a mensagem sem código', () => {
  it('a abertura diz o que aconteceu, e o resto é a mesma reserva, sem a linha do código', () => {
    const linhas = mensagemSemCodigo(REDE, ROTULOS).split('\n')
    expect(linhas[0]).toBe('Olá! Tentei fazer esta reserva pelo site, mas ela não foi enviada. Podem registrá-la para mim?')
    const comCodigo = mensagemDaReserva(REDE, ROTULOS).split('\n')
    expect(linhas.slice(1)).toEqual(comCodigo.slice(1).filter((linha) => !linha.startsWith('*Reserva:*')))
    expect(textoDo(linkSemCodigo('(91) 99203-5322', REDE, ROTULOS))).not.toMatch(/NVG-/)
  })
})
