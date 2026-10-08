# Roteiro de UI/UX — seção por seção, até a emissão online

**Data:** 2026-10-06
**Situação:** **a 1.1 (topo e menu) está decidida, com o wireframe aceito** (2026-10-08); o roteiro começou **depois do endurecimento** (13.1 a 13.6), por
decisão do PO em 2026-10-06. O roteiro foi combinado com o PO em 2026-10-06: **com calma, uma seção de
cada vez**, das que já estão no ar até a compra com emissão online.
**De onde vem:** o passo 14 do [plano de implementação](plano-de-implementacao.md) e a entrega **7.1** do plano da
venda online do KMP, cujo lado do site está no [plano da venda online](plano-da-venda-online.md). As decisões de UX
de lá (**U1–U8**) se decidem aqui, cada uma na etapa em que aparece (§8).

> **Em uma frase:** antes de desenhar a compra, revisamos o site que já existe — as seções da página, a reserva, a
> encomenda —, depois desenhamos o cadastro e as páginas do cliente, e só então a compra e a emissão. Cada seção
> é olhada, proposta e decidida pelo PO antes de a próxima começar. Tem muito chão, e o roteiro é para não
> pular nenhum.

---

## 1. O ritual de cada seção

Toda seção passa pelos mesmos cinco passos, e a próxima seção só começa quando a anterior chegou ao 4.

| # | passo | quem | o que sai |
|---|---|---|---|
| **1** | **Levantamento** — como a seção está hoje, no celular e no computador, com as telas de cada estado | desenvolvimento | as capturas e o que o código já faz, registrados na ficha da seção (§3–§7) |
| **2** | **Análise** — o que funciona, o que atrapalha, o que falta, e o que as etapas seguintes vão pedir dela | desenvolvimento, com o PO | uma lista curta de achados, cada um com o porquê |
| **3** | **Proposta** — o wireframe **só daquela seção**, privado do PO em claude.ai, e os textos | desenvolvimento | o wireframe e as perguntas para o PO, com recomendação |
| **4** | **Decisão** — o PO aceita, ajusta ou recusa cada achado | **PO** | as decisões registradas na ficha, com data |
| **5** | **Implementação** — um PR pequeno com o que foi decidido, com o E2E e o axe da seção | desenvolvimento | a seção no ar na homologação, para o PO conferir |

**O passo 5 pode ficar para depois.** Uma etapa inteira pode ser decidida e só implementada quando a parte do KMP
ou da API dela existir — é o caso das etapas 3 a 5. O que não se faz é **implementar antes de decidir**.

**Uma seção pode terminar sem mudança.** "Está bom como está" é uma decisão, e fica registrada como as outras.

## 2. As réguas que valem para todas as seções

São as que o site já segue, mais as que a compra pede. A análise de cada seção confere a seção contra elas.

- **Celular primeiro.** Quem atravessa usa o celular, muitas vezes com sinal ruim: cada passo sobrevive a
  recarregar a página.
- **O laranja é superfície, nunca texto** (passo 1 do plano de implementação). O botão primário é laranja com
  rótulo marrom.
- **Dinheiro e hora sem ambiguidade**: `R$ 1.234,56`, e a hora no fuso da operação (`America/Belem`), nunca no
  do aparelho.
- **Acessível de verdade**: dá para fazer tudo só com o teclado; a troca de passo leva o foco ao título; o que muda
  sozinho é anunciado ao leitor de tela.
- **Erros que dizem o que fazer**, sempre com a saída para o atendimento pelo WhatsApp.
- **Nada de pressa falsa** e nenhum truque para empurrar a venda.
- **Dado pessoal no mínimo**: o totem público não pede documento (decisão de 2026-09-22); documento inteiro não
  volta à tela depois de gravado (O12).
- **Sem conteúdo inventado**: o que falta (fotos, depoimentos, nomes) aparece como molde, nunca como texto falso.

## 3. Etapa 1 — As seções vigentes

O que está no ar hoje, na ordem da página. **É por aqui que o roteiro começa.**

| # | seção | o que é hoje | o que a análise precisa olhar |
|---|---|---|---|
| **1.1** | **Topo e menu** | o logo e os itens Reservar, Encomendas, Atendentes, Avaliações | onde entram, mais adiante, **Entrar** e **Minha conta**, sem o menu ficar apertado no celular |
| **1.2** | **Capa** | a chamada, os botões de reservar passagem e enviar encomenda, a vitrine das embarcações (fotos pendentes) | o que a capa promete quando houver compra; a vitrine sem fotos |
| **1.3** | **Reserve sua passagem** (o totem na página) | o roteiro da reserva, do jeito de hoje — **o fluxo em si é a etapa 2**; aqui, a seção como parte da página | o título e o subtítulo ("não pede cadastro nem documento"), que mudam de sentido quando houver compra |
| **1.4** | **Envie sua encomenda** | a seção própria da encomenda | o mesmo: a seção na página; o fluxo é a etapa 2 |
| **1.5** | **Quem atende você** | o cartão do atendente (nome, foto e WhatsApp pendentes) | o que falta de conteúdo e como o atendimento aparece para quem compra |
| **1.6** | **O que dizem os passageiros** | as avaliações (lista vazia de propósito) e as redes | se a seção fica no ar vazia até haver depoimentos reais |
| **1.7** | **Rodapé** | identificação da empresa (pendente), contatos, links legais, o aviso "reserva, não venda" | o aviso, que deixa de valer para o site inteiro (U2); onde ficam as páginas legais novas |
| **1.8** | **O quiosque** (`/totem`) | o totem em página cheia, para o terminal físico | confirmar que continua só com reserva (U5) |
| **1.9** | **Sem JavaScript e acessibilidade da página** | o que se lê com o JavaScript desligado | casa com o passo 13.2 do endurecimento: o que a análise achar, o 13.2 testa |

## 4. Etapa 2 — Melhorias na reserva

O **fluxo** da reserva de passagem e da reserva de encomenda, passo a passo. A reserva continua sendo o caminho
livre, sem cadastro (O11), e é ela que recebe tudo o que a compra não cobre — por isso ela tem de estar boa antes.

| # | parte | o que é hoje |
|---|---|---|
| **2.1** | **A escolha da saída** | a travessia e a data, do catálogo da API |
| **2.2** | **O que vai embarcar** | categoria, acomodação, tipo tarifário, gratuidade, quantidade de pessoas, natureza e classe do veículo, cilindrada da moto |
| **2.3** | **Quem reserva** | nome e telefone opcional |
| **2.4** | **A conferência** | a revisão antes de enviar |
| **2.5** | **A conclusão** | o código `NVG-XXXXXX` e o botão "Enviar ao atendimento" (WhatsApp) |
| **2.6** | **Os erros** | a saída que partiu, a API fora do ar, o catálogo que não carrega, o desafio do Turnstile |
| **2.7** | **A reserva de encomenda** | o tipo do volume, a faixa de peso, quem manda, quem recebe, quem retira |

**O que a análise vai trazer** se descobre no passo 2 de cada parte, não aqui. Ficam anotados, só como pontos a
olhar, os que já apareceram em conversa: o preço da tabela (7.2) aparecer na reserva também; voltar e corrigir
um passo a partir da conferência; e o cliente acompanhar a reserva pelo código (a página `/r/{codigo}`, que espera
o domínio).

## 5. Etapa 3 — O cadastro

Telas novas, para a conta do cliente (7.4). **Começa depois da etapa 2**; a implementação espera a regra no KMP e
o domínio da homologação (U8).

| # | tela | estados a desenhar |
|---|---|---|
| **3.1** | **Criar a conta** | os campos; e-mail já usado, **sem revelar** que ele tem conta; o desafio contra robô |
| **3.2** | **Confirmar o e-mail** | "abra seu e-mail"; o link confirmado; o link vencido, com reenviar |
| **3.3** | **Entrar e sair** | senha errada; e-mail ainda não confirmado; muitas tentativas; voltar ao lugar de onde veio |
| **3.4** | **Esqueci a senha** | pedir o link; o link; a senha nova; o link vencido |
| **3.5** | **Onde se entra** | o item no topo (1.1) e o convite na hora de pagar (U3) |

## 6. Etapa 4 — As páginas do cliente

O que o cliente logado vê sobre si (7.4 e 7.6).

| # | página | estados a desenhar |
|---|---|---|
| **4.1** | **Minha conta** (a entrada) | o que aparece primeiro para quem acabou de entrar |
| **4.2** | **Meus dados** | ver e corrigir; o documento mascarado (O12); apagar a conta, com o aviso da O7 (as passagens ficam) |
| **4.3** | **Meus pedidos** | vazio; a lista; cada pedido no seu estado — o desenho fino dos estados da compra é da etapa 5 |
| **4.4** | **As páginas legais** | privacidade (a 13.4 publica a primeira versão), cancelamento e reembolso (O5), termos |

## 7. Etapa 5 — A compra e a emissão online

O ponto de chegada (7.6 e 7.7). Só começa com as etapas 1 a 4 decididas, e a tela do titular espera a O14.

| # | tela | estados a desenhar |
|---|---|---|
| **5.1** | **A bifurcação no totem** (U2) | com preço: "Comprar — R$ X" e "Reservar"; sem preço ou "outros": só reservar, com o porquê; compra fechada: só reservar |
| **5.2** | **O resumo do pedido** | o valor da tabela; sem taxa para o cliente (O3); a saída partindo antes do fim do PIX |
| **5.3** | **Os dados do titular** (O14) | o que a O14 decidir; documento inválido, explicado em português |
| **5.4** | **O pagamento — PIX** (U1, U4) | o código com **copiar** em destaque e o QR ao lado; o tempo restante; aguardando, que muda sozinho; expirado; aprovado |
| **5.5** | **O pagamento — cartão** (U1) | em análise; recusado, com o motivo em linguagem de gente; aprovado |
| **5.6** | **A emissão e o bilhete** | emitindo; emitida, com o bilhete e o QR iguais aos do balcão, e o e-mail; **falhou**, "seu pagamento será devolvido" |
| **5.7** | **O pedido em Meus pedidos** | aguardando pagamento (com volta ao PIX); emitido; cancelamento pedido (U6); estornado |
| **5.8** | **A compra do veículo** (7.7) | a placa; "sua vaga fica guardada até HH:MM"; a vaga que expirou |

## 8. Onde cada decisão U se decide

| decisão (plano da venda online, §5) | etapa |
|---|---|
| **U2** — a compra começa no totem, e a frase passa a ser de cada caminho | 1.3 e 1.7 (o texto), 5.1 (a bifurcação) |
| **U5** — o quiosque não compra | 1.8 |
| **U3** — a conta pedida na hora de pagar | 3.5 |
| **U6** — o cancelamento pedido em Meus pedidos | 4.3 e 5.7 |
| **U7** — a política de privacidade | 4.4, junto da 13.4 |
| **U1** e **U4** — onde se paga e quanto o PIX vale | 5.4 e 5.5 |
| **U8** — o endereço da homologação | não é de tela, mas trava a implementação da etapa 3: precisa estar resolvida antes |

## 9. O quadro

Atualizado a cada seção. Situações: **a começar**, **em análise** (passos 1–3), **decidida** (passo 4), **no ar**
(passo 5), **sem mudança**.

| etapa | seções | situação |
|---|---|---|
| **1 — As seções vigentes** | 1.1 a 1.9 | **1.1 decidida, wireframe aceito** (§10), a implementar; as outras, a começar |
| **2 — Melhorias na reserva** | 2.1 a 2.7 | a começar |
| **3 — O cadastro** | 3.1 a 3.5 | a começar |
| **4 — As páginas do cliente** | 4.1 a 4.4 | a começar |
| **5 — A compra e a emissão online** | 5.1 a 5.8 | a começar |

**Antes do roteiro:** o endurecimento (13.1 a 13.6), que não muda nenhuma tela. **Em paralelo:** as
entregas do KMP (7.2, 7.3, 7.5). O roteiro anda no ritmo das decisões do PO, não no do código.

## 10. As fichas

Uma por seção, na ordem em que andam: o levantamento, os achados, as decisões do PO com data e o wireframe.

### 1.1 — Topo e menu

**Situação:** decidida, e o wireframe aceito pelo PO (2026-10-08). Próximo: a implementação (passo 5).
**Wireframe:** [Wireframe: 1.1 Topo e menu](https://claude.ai/artifact/KHnVE1gfFh9JtAuC5S7gP9) (privado do PO), com
três telas de celular (fechado, que abre no toque; aberto; rolado), o tablet em pé e o computador.

**Levantamento** (2026-10-08, build de demonstração): logo, cinco itens (Reservar, Encomendas, Atendentes,
Avaliações, Contato) e o botão "Reservar agora". Sem menu recolhido: os itens quebram em linha — decisão
registrada no `Topo.astro`, para não depender de JavaScript.

| largura | altura do topo | preso ao rolar |
|---|---|---|
| até 509px | 161px — 22% da tela num celular de 360px | não: some ao rolar |
| 510–639px | 115px | não |
| 640–789px (tablet em pé) | 115px, com o botão sozinho numa segunda linha | sim, 11% da tela o tempo todo |
| 790px ou mais | 60px, numa linha | sim |

O que está bom e fica: o título da seção não some sob o topo ao clicar num item; o foco do teclado aparece; o
contraste passa no axe.

**Achados:** o item "Reservar" repete o botão; o topo quebrado no tablet em pé; no celular, quem rola perde o menu e
o botão de reservar (a página é longa); o lugar de "Minha conta"; e o texto do botão, que muda com a compra (fica
para a 1.2, a 1.3 e a 5.1, com a U2).

**Decisões do PO (2026-10-08):**

| # | decisão |
|---|---|
| **A** | **"Reservar agora" é o destaque.** O menu fica com **Encomendas, Social e Contato**; Atendentes e o item "Reservar" saem (as seções continuam na página). *Ajuste do mesmo dia:* as avaliações voltam ao menu com o nome **"Social"** (a seção junta as avaliações e as redes), já que o menu recolhido comporta mais itens; no rodapé, o atalho continua "Avaliações" (a 1.7) |
| **B** | **Menu hambúrguer nas telas estreitas** (abaixo de 640px). Com dois itens, o tablet em pé cabe numa linha só, e o defeito de lá some |
| **C** | **No celular, a primeira linha fica presa ao rolar**: o logo, "Reservar agora" e o botão do menu, 60px |
| **D** | **"Minha conta" é um item do menu**, fixo (não muda entre "Entrar" e "Minha conta", para não pedir JavaScript em toda página). Entra com a 7.4; até lá, só o lugar no desenho |
| **E** | **Um script mínimo fecha o menu ao tocar num item**, dentro da página e liberado por *hash* na CSP. Sem JavaScript, o menu abre e fecha no botão (`<details>` nativo) e só não fecha sozinho |

Com isso, a decisão antiga de não ter menu recolhido (`Topo.astro`) cai: o hambúrguer é o `<details>` nativo, que
funciona com teclado e sem script, e não o truque de CSS que ela temia.

**Pedido do PO para outras seções:** recolher seções no celular (um "toque para abrir"). Fica para a análise de cada
uma — candidatas a 1.5 (atendentes), 1.6 (avaliações) e 1.7 (rodapé); reserva e encomenda, não. O que já se sabe: o
`<details>` nativo recolhe em toda largura; recolher só no celular pede JavaScript ou um truque que confunde o leitor
de tela.
