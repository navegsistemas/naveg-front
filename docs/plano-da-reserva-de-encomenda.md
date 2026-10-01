# Plano da reserva de encomenda — a carga na agência virtual

**Data:** 2026-10-01
**Situação:** C1, C3, C4, C5 e C9 decididas pelo PO em 2026-10-01; C6, C7, C8 e C10 seguem como proposta. Nenhuma
entrega começou.
**De onde vem:** o [plano do ERP do `fluviapp-kmp`](https://github.com/navegsistemas/fluviapp-kmp/blob/master/docs/plano-do-erp.md)
(`docs/plano-do-erp.md` lá), decisões **E3** (a carga entra, começando pela encomenda) e **M6** (o transporte de
carga chega ao front como **reserva com redirecionamento ao atendente**, igual à de passageiro), §6.3 e entrega 6.

> **Em uma frase:** quem quer mandar uma encomenda pela NAVEG tem um lugar próprio na página, com o mesmo jeito
> do totem de passagem: escolhe a saída, diz o que vai mandar e para quem, recebe um código e cai no WhatsApp do
> atendente com o pedido escrito. No porto, o atendente transforma a reserva em encomenda recebida.

---

## 1. O que muda em relação ao plano do ERP

O plano do ERP põe a encomenda **dentro do totem**, como uma terceira opção ao lado de passageiro e veículo. A
proposta do PO (2026-10-01) é outra, e este plano a segue:

- **uma seção própria na página**, "Envie sua encomenda", separada do totem de passagem;
- **mais fácil de achar:** item **"Encomendas"** na barra superior e um botão **"Enviar encomenda"** na capa,
  junto da descrição e do botão de reservar passagem.

A razão é de quem chega: quem quer mandar uma caixa não está comprando passagem, e não deve atravessar
"O que vai embarcar? Passageiro / Veículo" para descobrir que encomenda é outra coisa. Duas portas de entrada,
cada uma com as perguntas dela.

**O que continua igual ao do ERP:** o caminho por trás. A reserva de encomenda é gravada na mesma coleção
`reservas`, pela mesma API, com o mesmo código `NVG-XXXXXX`, o mesmo evento `reserva.criada`, a mesma fila na
seção Reservas do painel e o mesmo WhatsApp no fim. O que muda é a categoria (`ENCOMENDA`) e as perguntas.

## 2. As decisões

| # | pergunta | decisão |
|---|---|---|
| **C1** | Lançar antes uma etapa só pelo WhatsApp, sem gravar, enquanto o KMP não recebe encomenda? | **Não** (PO, 2026-10-01). A seção vai ao ar **já com a reserva gravada**, convertível no painel como a de passagem |
| **C2** | Os campos do pedido (é o **A1** do plano do ERP) | os da §3.2, que seguem C3 a C5 |
| **C3** | A descrição do conteúdo | **lista de tipos** (caixa, saco ou fardo, eletrodoméstico, móvel, outro), com complemento opcional de até 60 caracteres (PO, 2026-10-01) |
| **C4** | O peso | **faixa**: até 5 kg, 5 a 20, 20 a 50, acima de 50 (PO, 2026-10-01) |
| **C5** | O celular do destinatário | **obrigatório**: é como o destino avisa que a encomenda chegou (PO, 2026-10-01) |
| **C9** | O quiosque (`/totem`) oferece encomenda? | **Não**, só o site (PO, 2026-10-01). No saguão quem chega quer passagem |

**Ainda como proposta** — não mudam o que se constrói antes da entrega 5, e podem ser decididas no PR dela:

| # | pergunta | proposta |
|---|---|---|
| **C6** | Até quando a reserva de encomenda vale? | **até a partida**, como a de passageiro, com o aviso "entregue no porto antes da partida". Se houver prazo de recebimento (por exemplo, 2 horas antes), ele entra aqui |
| **C7** | Toda saída aceita encomenda? | **sim**, por enquanto. O plano do ERP deixa a capacidade de carga de fora (§6.1 lá); se a lancha não leva, entra como regra do tipo de embarcação |
| **C8** | O mesmo WhatsApp do atendimento de passagem, `(91) 99203-5322`? | **sim**, até haver um atendente só de carga |
| **C10** | O texto da capa, que hoje diz "para passageiros e veículos" | passa a citar a encomenda: "passageiros, veículos e encomendas" |
| **C11** | O nome para o público: **"Encomendas"** ou **"Cargas"**? (menu, botão, título, mensagem) | **"Encomendas"**. É como se diz no rio para o volume que alguém manda e outro retira, e é o que esta etapa aceita. "Carga" sugere frete grande (caminhão, carga geral), que é a onda 4 do ERP e não cabe aqui: chamaria pedidos que o atendente teria de recusar. Quando a carga geral entrar, a seção pode virar "Cargas e encomendas". **Por dentro**, a categoria é `ENCOMENDA` de qualquer jeito, a do plano do ERP |

## 3. O que o cliente vê

Um wireframe com os dois termos lado a lado (a página no desktop e três telas no celular, com uma chave para
trocar "Encomenda" por "Carga") foi feito para a análise da C11, em 2026-10-01.

### 3.1 Onde fica

- **Barra superior:** `Reservar · Encomendas · Atendentes · Avaliações · Contato`. O item sai sozinho da lista de
  seções (`conteudo/secoes.ts`), como os outros.
- **Capa:** três botões, nesta ordem: **Reservar passagem** (principal), **Enviar encomenda**, **Falar com
  atendente**.
- **A seção** fica logo depois da de passagem, com fundo alternado, título "Envie sua encomenda" e subtítulo
  curto: *"Diga o que vai mandar e para quem. O atendente confirma pelo WhatsApp e você entrega no porto."*

### 3.2 As perguntas, em ordem

| passo | pergunta | resposta |
|---|---|---|
| 1 | Escolha a saída | a mesma lista de saídas do totem |
| 2 | O que vai mandar? | tipo do volume (C3) e quantidade de volumes (1 a 20); complemento opcional |
| 3 | Quanto pesa, mais ou menos? | faixa de peso (C4) |
| 4 | Para quem vai? | nome e celular do destinatário (C5) |
| 5 | Quem está mandando? | nome e celular opcional do remetente, como no totem de passagem |
| 6 | Confira a encomenda | resumo, e o botão **Confirmar** |

No fim, a mesma tela de conclusão: o código e **"Enviar ao atendimento"**, com a mensagem (portos e nomes de exemplo):

```
Encomenda NVG-7K3QP2
Porto do Sal · Belém/PA → Porto de Santana · Santana/AP · Qua, 14/10 · 18:00
3 volumes · Caixa · 5 a 20 kg
De Maria Souza para João Lima, (96) 98888-7777
Entregue no porto antes da partida.
```

### 3.3 O que **não** se pede, de propósito

Pela mesma régua do totem de passagem (ADR-0001, LGPD): **nenhum documento**, de quem manda ou de quem
recebe, e **nenhum valor declarado**. Documento, valor e conferência do volume são feitos no balcão, por quem
pode conferir, quando a encomenda é recebida. O comprovante com QR é do balcão (entrega 5 do KMP), não da web.

## 4. Quando vai ao ar

**Só com a reserva gravada** (C1). A seção, o item no menu e o botão na capa aparecem **juntos**, no mesmo PR que
liga o envio à API — um caminho de entrada para algo que ainda não registra nada seria o atendente recebendo
pedido fora da fila.

Isso depende de, no `fluviapp-kmp`: a entrega 4 do ERP (o fim do compartilhamento), a 5 (a encomenda no balcão)
e a parte KMP da 6 (as regras de `reservas` aceitando `ENCOMENDA` e as chaves novas; o `ReservaDocumento.kt`
lendo; a conversão abrindo "Receber encomenda" preenchido). A ordem é a de sempre: **KMP → API → front**, e o
teste de contrato daqui confere as chaves novas contra o Kotlin.

**O que dá para adiantar aqui sem esperar**, e sem nada aparecer na página: o roteiro e a mensagem no domínio
(entrega 2) e a ilha com as telas, testada com o envio em memória (entrega 3). Nenhum dos dois toca o codec do
documento — é isso que deixa o teste de contrato verde enquanto o KMP não tem as chaves novas.

## 5. As entregas

| # | onde | entrega | depende de |
|---|---|---|---|
| **1** | aqui | **este plano** | — |
| **2** | aqui | **o roteiro da encomenda no domínio** (`@navegsistemas/domain`): as respostas, os passos, a coerência e a mensagem do WhatsApp, com cenários. Sem mexer no codec | 1 |
| **3** | aqui | **a ilha da encomenda**, reaproveitando as telas do totem (lista de saídas, conferência, conclusão), com cenários de tela e o envio em memória. **Não entra na página** | 2 |
| **4** | KMP | **a encomenda no balcão** (entrega 5 do ERP), depois da entrega 4 do ERP | — |
| **5** | KMP | **a reserva de encomenda nas regras e no painel** (parte KMP da entrega 6 do ERP) | 4 |
| **6** | aqui e API | **no ar:** a `ReservaDeEncomenda` no codec (`CAMPOS_DO_DOCUMENTO`), o pedido HTTP estrito, a API gravando, o domínio publicado em versão nova; **a seção, o item "Encomendas" no menu, o botão na capa e o texto da capa**; o E2E da jornada | 5 |

A 2 e a 3 não esperam ninguém. A 6 entra **junto** com o merge das regras no KMP, nem antes nem depois — merge na
API publica o deploy que aponta para a homologação.

## 6. Como fica no código

- **Domínio** — o roteiro da encomenda é **outro roteiro**, e não um ramo do de passageiro: as perguntas não se
  cruzam, e misturá-las faria a reserva de passagem pagar pela de encomenda em cada cenário. O que se
  reaproveita é o que já é comum: a ocorrência, o cliente, o código, a validade, o link de WhatsApp. Na entrega 6,
  `Reserva` ganha o terceiro caso, `ReservaDeEncomenda` (`categoria: 'ENCOMENDA'`), e o codec ganha as chaves
  `destinatario`, `volumes`, `tipoVolume`, `complemento` e `faixaPeso`.
- **Interface** — as telas do totem (`ListaDeTravessias`, `Conferencia`, `ReservaConcluida`) já recebem o que
  mostram por propriedade; a encomenda passa as dela. Os passos novos (tipo do volume, faixa de peso,
  destinatário) seguem o padrão de cartões e formulários de `packages/ui`.
- **Página** — uma segunda ilha, `client:visible`, na seção nova, só na `/`: o quiosque fica só com passagem
  (C9). As duas ilhas dividem o React e o domínio, que o build separa num pedaço comum.
- **Orçamento** — a ilha e o carregador estão em 17,5 kB de um teto de 20. Uma segunda ilha provavelmente passa
  dele. Medir na entrega 3; se passar, subir o teto é decisão registrada no `conferir-build.mjs`, com o número
  medido.
- **API** (entrega 6) — o `POST /reservas` já decide tudo pelo domínio: aceita a categoria nova quando o
  `pedidoDeReservaDoJson` aceitar. O que muda lá é a versão do domínio e os cenários.

## 7. Como se confere

- cenários do roteiro e da mensagem no domínio, como os da reserva de passagem;
- cenários de tela da ilha em jsdom;
- **E2E** (`e2e/`), na entrega 6: a jornada da encomenda pela barra superior e pelo botão da capa até o `href`
  do WhatsApp, com o corpo que vai à API e o código que volta, em Chromium e WebKit, desktop e celular; e o
  quiosque **sem** encomenda;
- na entrega 6, o teste de contrato conferindo as chaves novas contra o `ReservaDocumento.kt`.
