/**
 * **A ilha da encomenda** — o que a página monta com `client:visible` na seção "Envie sua encomenda".
 *
 * As mesmas regras da ilha do totem (`TotemDaAgencia.tsx`, `conteudo/api.ts`): o catálogo da API, a não ser que
 * a demonstração seja pedida; o envio para a API com o Turnstile quando a chave pública está configurada, e em
 * memória sem ela. Só na página — o quiosque fica só com passagem (C9), e por isso não há modo aqui.
 */
import { useMemo } from 'react'

import { catalogoFixo, catalogoHttp, envioHttpDaEncomenda, envioLocalDaEncomenda, ReservaEmMemoria } from '@navegsistemas/dados'
import '@navegsistemas/ui/totem.css'

import { envioConfigurado, fonteConfigurada } from '../conteudo/api'
import { WHATSAPP_DAS_RESERVAS } from '../conteudo/atendimento'
import { CATALOGO_DE_DEMONSTRACAO } from '../conteudo/catalogo-de-demonstracao'
import { FUSO_DA_OPERACAO } from '../conteudo/operacao'
import { Encomenda } from './Encomenda'
import type { Demonstracao } from './Totem'
import { desafioTurnstile } from './turnstile'

/* Lidas no build, como na ilha do totem. */
const FONTE = fonteConfigurada(import.meta.env.PUBLIC_URL_DA_API)
const ENVIO = envioConfigurado(FONTE, import.meta.env.PUBLIC_TURNSTILE_SITE_KEY)

const DEMONSTRACAO: Demonstracao | null =
  FONTE.tipo === 'DEMONSTRACAO' ? 'SAIDAS_E_ENVIO' : ENVIO.tipo === 'MEMORIA' ? 'ENVIO' : null

export default function EncomendaDaAgencia() {
  const fonte = useMemo(
    () => (FONTE.tipo === 'API' ? catalogoHttp(FONTE.url) : catalogoFixo(CATALOGO_DE_DEMONSTRACAO)),
    [],
  )
  const envio = useMemo(
    () =>
      ENVIO.tipo === 'API'
        ? envioHttpDaEncomenda(ENVIO.url, desafioTurnstile(ENVIO.chaveDoDesafio))
        : envioLocalDaEncomenda(new ReservaEmMemoria()),
    [],
  )

  return (
    <Encomenda
      fonte={fonte}
      envio={envio}
      fuso={FUSO_DA_OPERACAO}
      demonstracao={DEMONSTRACAO}
      atendimento={WHATSAPP_DAS_RESERVAS}
    />
  )
}
