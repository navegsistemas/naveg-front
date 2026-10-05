/**
 * **O passo da encomenda em foco, desenhado** — o `PassoDaReserva` da seção "Envie sua encomenda".
 *
 * Mesma régua: as opções vêm do nó, e este arquivo só sabe escrever a resposta no campo certo — o inverso do
 * `respondidoNaEncomenda` do domínio.
 */
import {
  FaixaPeso,
  Retirada,
  casoImpossivel,
  type NoDaEncomenda,
  type RespostasDaEncomenda,
} from '@navegsistemas/domain'

import { EscolhaEmCartoes } from './EscolhaEmCartoes.js'
import { FormularioDoCliente, FormularioDoVolume } from './Formularios.js'

export interface PropsDoPassoDaEncomenda {
  /** Qualquer nó, menos a conferência — ela tem componente próprio. */
  readonly no: Exclude<NoDaEncomenda, { passo: 'CONFERENCIA' }>
  readonly respostas: RespostasDaEncomenda
  readonly aoResponder: (respostas: RespostasDaEncomenda) => void
}

/** Uma linha sob cada forma de retirada, para quem não sabe o que "eu mesmo" quer dizer aqui. */
const DESCRICAO_DA_RETIRADA: Readonly<Record<Retirada, string>> = {
  REMETENTE: 'Eu despacho e eu pego no destino',
  OUTRA_PESSOA: 'Alguém retira no destino',
}

export function PassoDaEncomenda({ no, respostas, aoResponder }: PropsDoPassoDaEncomenda) {
  const com = (parcial: RespostasDaEncomenda) => aoResponder({ ...respostas, ...parcial })

  switch (no.passo) {
    case 'VOLUMES':
      return (
        <FormularioDoVolume
          tipos={no.tipos}
          inicial={{
            ...(respostas.tipoVolume !== undefined ? { tipoVolume: respostas.tipoVolume } : {}),
            ...(respostas.quantidadeVolumes !== undefined ? { quantidadeVolumes: respostas.quantidadeVolumes } : {}),
            ...(respostas.complemento !== undefined ? { complemento: respostas.complemento } : {}),
          }}
          aoConfirmar={(volume) => {
            /* Sem complemento é sem a chave: o que sobrou de antes não fica. */
            const { complemento: _, ...semComplemento } = respostas
            aoResponder({ ...semComplemento, ...volume })
          }}
        />
      )
    case 'PESO':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: FaixaPeso.rotulo(valor) }))}
          escolhida={respostas.faixaPeso}
          aoEscolher={(faixaPeso) => com({ faixaPeso })}
        />
      )
    case 'RETIRADA':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: Retirada.rotulo(valor), descricao: DESCRICAO_DA_RETIRADA[valor] }))}
          escolhida={respostas.retirada}
          aoEscolher={(retirada) => com({ retirada })}
        />
      )
    case 'DESTINATARIO':
      return (
        <FormularioDoCliente
          inicial={respostas.destinatario}
          telefoneObrigatorio
          erroDoNome="Informe o nome de quem retira a encomenda."
          aoConfirmar={(destinatario) => com({ destinatario })}
        />
      )
    case 'REMETENTE':
      return (
        <FormularioDoCliente
          /* A chave muda com a obrigatoriedade: o formulário começa de novo se quem retira mudou. */
          key={String(no.telefoneObrigatorio)}
          inicial={respostas.cliente}
          telefoneObrigatorio={no.telefoneObrigatorio}
          erroDoNome="Informe o nome de quem está mandando."
          aoConfirmar={(cliente) => com({ cliente })}
        />
      )
    default:
      return casoImpossivel(no, 'PassoDaEncomenda')
  }
}
