/**
 * **A ilha** — o que a página monta com `client:visible` (ou `client:load`, no quiosque).
 *
 * Propriedades de ilha atravessam do servidor para o navegador serializadas, então só entra aqui o que é dado:
 * o modo. As dependências — a fonte do catálogo e o envio — são construídas **aqui dentro**, e é o único lugar
 * que sabe de onde vêm. O `Totem` não percebe.
 *
 * - **O catálogo**: da API da agência, por padrão; o de demonstração só quando pedido
 *   (`PUBLIC_URL_DA_API=demonstracao`).
 * - **A reserva**: para a API, com a verificação do Turnstile como passo da conferência, quando a chave pública está configurada
 *   (`PUBLIC_TURNSTILE_SITE_KEY`); sem ela, montada e guardada em memória, e a faixa diz que nada é enviado.
 *
 * As duas regras estão em `conteudo/api.ts`, com cenário.
 */
import { useMemo } from 'react'

import { catalogoFixo, catalogoHttp, envioHttp, envioLocal, ReservaEmMemoria } from '@navegsistemas/dados'
import type { FotoDoCartao } from '@navegsistemas/ui'
import '@navegsistemas/ui/totem.css'

import { envioConfigurado, fonteConfigurada } from '../conteudo/api'
import { WHATSAPP_DAS_RESERVAS } from '../conteudo/atendimento'
import { CATALOGO_DE_DEMONSTRACAO } from '../conteudo/catalogo-de-demonstracao'
import { ALCANCE_DO_CALENDARIO_DIAS, FUSO_DA_OPERACAO, INATIVIDADE_DO_QUIOSQUE_MS } from '../conteudo/operacao'
import { Totem, type Demonstracao } from './Totem'
import { verificacaoTurnstile } from './turnstile'
import { PassoDaVerificacao, useEstadoDaVerificacao } from './VerificacaoContraRobo'

export interface PropsDaIlha {
  readonly modo: 'pagina' | 'quiosque'
  /** A foto do cartão do Veículo, que a página gera no build (decisão M da 2.2). O quiosque não a usa. */
  readonly fotoDoVeiculo?: FotoDoCartao | null
  /** As miniaturas das embarcações no cartão da saída (UI 2.1, C), que a página gera no build. O quiosque não as usa. */
  readonly fotosDasEmbarcacoes?: Readonly<Record<string, FotoDoCartao>>
}

/* Lidas no build: um valor inválido quebra o build aqui, e não no navegador de quem abre a página. */
const FONTE = fonteConfigurada(import.meta.env.PUBLIC_URL_DA_API)
const ENVIO = envioConfigurado(FONTE, import.meta.env.PUBLIC_TURNSTILE_SITE_KEY)

const DEMONSTRACAO: Demonstracao | null =
  FONTE.tipo === 'DEMONSTRACAO' ? 'SAIDAS_E_ENVIO' : ENVIO.tipo === 'MEMORIA' ? 'ENVIO' : null

export default function TotemDaAgencia({ modo, fotoDoVeiculo = null, fotosDasEmbarcacoes = {} }: PropsDaIlha) {
  const fonte = useMemo(
    () => (FONTE.tipo === 'API' ? catalogoHttp(FONTE.url) : catalogoFixo(CATALOGO_DE_DEMONSTRACAO)),
    [],
  )
  /* A verificação contra robô é um passo da conferência (2.8): o envio leva o token que ela guardou. */
  const verificacao = useMemo(() => (ENVIO.tipo === 'API' ? verificacaoTurnstile(ENVIO.chaveDoDesafio) : null), [])
  const envio = useMemo(
    () =>
      ENVIO.tipo === 'API' && verificacao !== null
        ? envioHttp(ENVIO.url, verificacao.obterDesafio)
        : envioLocal(new ReservaEmMemoria()),
    [verificacao],
  )
  const estadoDaVerificacao = useEstadoDaVerificacao(verificacao)
  const quiosque = modo === 'quiosque'

  return (
    <Totem
      fonte={fonte}
      envio={envio}
      fuso={FUSO_DA_OPERACAO}
      inatividadeMs={quiosque ? INATIVIDADE_DO_QUIOSQUE_MS : null}
      demonstracao={DEMONSTRACAO}
      quiosque={quiosque}
      atendimento={WHATSAPP_DAS_RESERVAS}
      alcanceDoCalendario={quiosque ? null : ALCANCE_DO_CALENDARIO_DIAS}
      fotoDoVeiculo={fotoDoVeiculo}
      fotosDasEmbarcacoes={fotosDasEmbarcacoes}
      verificacao={
        verificacao === null || estadoDaVerificacao === null
          ? null
          : {
              elemento: <PassoDaVerificacao verificacao={verificacao} estado={estadoDaVerificacao} />,
              verificada: estadoDaVerificacao === 'VERIFICADA',
            }
      }
    />
  )
}
