/**
 * **O catálogo de demonstração** — e ele se anuncia como tal.
 *
 * O catálogo de verdade é o do fluviapp, gerado no build a partir do passo 9. Até lá o totem precisa de saídas
 * para ser visto e testado, e elas estão aqui — **declaradamente fictícias**, pela mesma régua dos depoimentos:
 * nome de porto real com horário inventado é conteúdo falso com cara de pronto, e é assim que ele chega a
 * produção. Por isso os portos se chamam "Porto de demonstração", as cidades são "Cidade Exemplo", e o totem
 * mostra uma faixa dizendo que nada é enviado.
 *
 * Há saída **todo dia**, para que a janela de sete dias nunca fique vazia — e um navio e uma lancha além do
 * ferry, para que os três cascos possam ser vistos recortando o roteiro.
 */
import { DIAS_DA_SEMANA, type CatalogoDoFluviapp, type Viagem } from '@naveg/domain'

const TODO_DIA = DIAS_DA_SEMANA

function diarias(prefixo: string, rotaId: string, embarcacaoId: string, horaMin: number): Viagem[] {
  return TODO_DIA.map((diaSemana) => ({
    id: `${prefixo}-${diaSemana.toLowerCase()}`,
    rotaId,
    embarcacaoId,
    diaSemana,
    horaMin,
    ativo: true,
  }))
}

export const CATALOGO_DE_DEMONSTRACAO: CatalogoDoFluviapp = {
  localidades: [
    { id: 'demo-cidade-a', municipio: 'Cidade Exemplo A', uf: 'PA', codigoIbge: '', ativo: true },
    { id: 'demo-cidade-b', municipio: 'Cidade Exemplo B', uf: 'PA', codigoIbge: '', ativo: true },
  ],
  portos: [
    { id: 'demo-porto-a', nome: 'Porto de demonstração', localidadeId: 'demo-cidade-a', ativo: true },
    { id: 'demo-porto-b', nome: 'Porto de demonstração', localidadeId: 'demo-cidade-b', ativo: true },
  ],
  rotas: [
    { id: 'demo-ida', portoOrigemId: 'demo-porto-a', portoDestinoId: 'demo-porto-b', distanciaMn: 40, tempoMedioH: 3.5, ativo: true },
    { id: 'demo-volta', portoOrigemId: 'demo-porto-b', portoDestinoId: 'demo-porto-a', distanciaMn: 40, tempoMedioH: 3.5, ativo: true },
  ],
  embarcacoes: [
    {
      id: 'demo-ferry', nome: 'Ferry de demonstração', tipo: 'FERRY_BOAT', capacidadeVeiculo: 40,
      capacidadeSuite2: 2, capacidadeSuite3: 2, capacidadeCamarote: 6, empresaId: 'demo',
    },
    {
      id: 'demo-navio', nome: 'Navio de demonstração', tipo: 'NAVIO', capacidadeVeiculo: 6,
      capacidadeSuite2: 4, capacidadeSuite3: 4, capacidadeCamarote: 10, empresaId: 'demo',
    },
    {
      id: 'demo-lancha', nome: 'Lancha de demonstração', tipo: 'LANCHA', capacidadeVeiculo: 0,
      capacidadeSuite2: 0, capacidadeSuite3: 0, capacidadeCamarote: 0, empresaId: 'demo',
    },
  ],
  viagens: [
    ...diarias('demo-lancha-ida', 'demo-ida', 'demo-lancha', 7 * 60),
    ...diarias('demo-ferry-ida', 'demo-ida', 'demo-ferry', 18 * 60),
    ...diarias('demo-navio-volta', 'demo-volta', 'demo-navio', 21 * 60 + 30),
  ],
  atuacao: {
    embarcacaoIds: new Set(['demo-ferry', 'demo-navio', 'demo-lancha']),
    portoIds: new Set(['demo-porto-a', 'demo-porto-b']),
  },
}
