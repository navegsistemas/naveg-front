# Roteiro de UI/UX — seção por seção, até a emissão online

**Data:** 2026-10-06
**Situação:** **a 1.1 (topo e menu) e a 1.2 (capa) no ar e conferidas pelo PO no celular** (2026-10-15); a 1.3 no ar; a
2.2 em andamento (ver o quadro, §9). O roteiro começou **depois do endurecimento** (13.1 a 13.6), por
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
| **1.6** | **O que dizem os passageiros** | as avaliações (lista vazia de propósito) e as redes | **decidido em 2026-10-16** (§9, "A ordem até o MVP"): vira "Deixe sua opinião", para quem tem conta, com o carrossel das aprovadas; as redes saem |
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
| **2.8** | **A verificação contra robô** | o quadro do Turnstile, solto no rodapé da tela, fora do totem |

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
| **3.5** | **Onde se entra** | o item no topo (1.1), o convite na hora de pagar (U3) e **o convite na conclusão da reserva feita sem conta** (pedido do PO, 2026-10-16; ver a nota da 3.6 nas fichas) |

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
| **1 — As seções vigentes** | 1.1 a 1.9 | **1.1 no ar** (#43) e **1.2 no ar** (#45), conferidas pelo PO no celular (2026-10-15); **1.3 no ar** (#49, o calendário; as cidades da rota desde o #59), com os 90 dias e a saída suspensa aceitos pelo PO no celular (2026-10-20); o rodapé (#78, #79) aceito no mesmo dia; **1.4 no ar** (#101, o passo a passo em esquema), **aceita pelo PO no celular em 2026-10-22**; as outras, a começar |
| **2 — Melhorias na reserva** | 2.1 a 2.8 | **2.2 no ar** (#62, #68, #69; aceite do PO em 2026-10-15); **2.7 no ar** (#72, 2026-10-16; a encomenda no mesmo caminho, com a #58); **2.3 no ar** (#75, 2026-10-16; o celular obrigatório na página); **2.1 reaberta pelo PO e decidida em 2026-10-22** (o cartão da saída; o calendário da 1.3 cobriu o dia), **no ar** (#99) e **aceita pelo PO no celular no mesmo dia**; a foto em faixa (#103, a C revista), aceita no mesmo dia (roteiro 9); **2.4 no ar** (#77, 2026-10-16; a conferência), **com a 2.5** (a conclusão) junto, a pedido do PO; **2.6 no ar** (#81; os erros, e o texto do WhatsApp). **A 2.3, a 2.4, a 2.5, a 2.6 e a 2.7 aceitas pelo PO no celular em 2026-10-20** (a 2.6 com o #87); **2.8 no ar** (#92; a verificação contra robô como passo da conferência), **aceita pelo PO no celular em 2026-10-21** |
| **3 — O cadastro** | 3.1 a 3.5 | **decidida** (2026-10-16): 3.1 a 3.5, com as regras juntas em "As regras da conta"; a 3.6 (resgatar a reserva) retirada pelo PO. A implementação espera o KMP (fluviapp-kmp#70, #71), o domain e a API (naveg-api-vercel#30, #43) |
| **4 — As páginas do cliente** | 4.1 a 4.4 | **4.1 e 4.2 decididas** (2026-10-16), com a implementação junto do cadastro; 4.3 e 4.4 vêm com a compra |
| **5 — A compra e a emissão online** | 5.1 a 5.8 | a começar |

**Antes do roteiro:** o endurecimento (13.1 a 13.6), que não muda nenhuma tela. **Em paralelo:** as
entregas do KMP (7.2, 7.3, 7.5). O roteiro anda no ritmo das decisões do PO, não no do código.

### A ordem até o MVP (PO, 2026-10-16)

O PO conferiu a ordem contra o caminho do MVP: **a partir do cadastro, o site deixa de ser uma página só**. Ele passa a
ter a área do cliente, e o topo passa a dizer se a pessoa está logada ou não. A ordem:

1. **2.4, a conferência**; depois **2.5, a conclusão**, e **2.6, os erros**: duas seções curtas, porque os erros já
   acontecem no ar e a reserva continua sendo o caminho livre depois da compra;
2. **a área do cliente**: as etapas 3 (o cadastro, com o "Entrar" e o "Minha conta" no topo, a 3.5 com a 1.1) e 4.1 e
   4.2 (Minha conta e Meus dados). **A implementação travava na U8 e na D4**; com a API atrás do site (2026-10-16, ficha "A área do cliente"), nenhuma das duas trava a homologação;
3. **1.6, as opiniões** (abaixo);
4. **a emissão e o pagamento online**: a etapa 5, com a 4.3 (Meus pedidos) e a 4.4 (as páginas legais de cancelamento
   e reembolso, O5), que só fazem sentido com a compra.

**As redes sociais saem do roteiro**: a NAVEG não as tem. O item "Social" do topo muda de nome com a 1.6. **O rodapé
está bem estruturado**: falta só o que é do negócio (a identificação da empresa). A 1.5 (o atendente) espera o mesmo:
conteúdo do negócio.

**A 1.6 vira "Deixe sua opinião"** (PO, 2026-10-16): uma caixa de texto na própria seção, e ao lado um carrossel com as
opiniões, **só quando houver**. Decisões:

- **depois da área do cliente**: só quem tem conta deixa opinião, com o nome da conta. É menos spam, e casa com "cliente
  é quem tem conta" (#57);
- **a opinião só aparece depois de aprovada** por alguém da NAVEG, no painel do KMP. Protege a marca de ofensa, de spam
  e de dado pessoal escrito na caixa.

O trabalho fora daqui está em issues: a regra da coleção e a tela de aprovação no KMP
(navegsistemas/fluviapp-kmp#69), e as rotas na API (navegsistemas/naveg-api-vercel#42).

## 10. As fichas

Uma por seção, na ordem em que andam: o levantamento, os achados, as decisões do PO com data e o wireframe.

### 1.1 — Topo e menu

**Situação:** no ar na homologação (PR #43, 2026-10-08), com os ajustes do mesmo dia (A e F). **Conferida pelo PO no celular, na homologação, em
2026-10-15: "tá ótimo pro MVP".**
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
| **A** | **"Reservar agora" é o destaque.** O menu fica com **Encomendas, Atendentes, Social e Contato**; o item "Reservar" sai (é o botão). *Ajustes do mesmo dia:* as avaliações voltam como **"Social"** (a seção junta as avaliações e as redes) e os **Atendentes** voltam, já que o menu recolhido comporta mais itens; no rodapé, o atalho continua "Avaliações" (a 1.7). Com quatro itens, o menu recolhe **abaixo de 44rem** (704px), e não de 40rem: entre 640 e 700px os itens ficavam espremidos ao lado do botão |
| **B** | **Menu hambúrguer nas telas estreitas** (abaixo de 44rem, ver A). O tablet em pé (768px) cabe numa linha só, e o defeito de lá some |
| **C** | **No celular, a primeira linha fica presa ao rolar**: o logo, "Reservar agora" e o botão do menu, 60px |
| **D** | **"Minha conta" é um item do menu**, fixo (não muda entre "Entrar" e "Minha conta", para não pedir JavaScript em toda página). Entra com a 7.4; até lá, só o lugar no desenho |
| **E** | **Um script mínimo fecha o menu ao tocar num item**, dentro da página e liberado por *hash* na CSP. Sem JavaScript, o menu abre e fecha no botão (`<details>` nativo) e só não fecha sozinho |
| **F** | **Rolagem suave ao tocar num item** (pedido do PO, pela sensação de fluidez). O CSS sozinho trazia de volta o defeito de 2026-10-05 — o totem cresce no caminho e o alvo é empurrado (15 falhas em 128 execuções do E2E) —, então um script pequeno acompanha a chegada e reposiciona o alvo se algo cresceu, desistindo ao primeiro gesto da pessoa. Com movimento reduzido no aparelho, a âncora salta, como antes |

Com isso, a decisão antiga de não ter menu recolhido (`Topo.astro`) cai: o hambúrguer é o `<details>` nativo, que
funciona com teclado e sem script, e não o truque de CSS que ela temia.

**Pedido do PO para outras seções:** recolher seções no celular (um "toque para abrir"). Fica para a análise de cada
uma — candidatas a 1.5 (atendentes), 1.6 (avaliações) e 1.7 (rodapé); reserva e encomenda, não. O que já se sabe: o
`<details>` nativo recolhe em toda largura; recolher só no celular pede JavaScript ou um truque que confunde o leitor
de tela.

### 1.2 — Capa

**Situação:** no ar (#45, mergeado em 2026-10-09), com os textos da 2.2 (#62). **Conferida pelo PO no celular, na
homologação, em 2026-10-15: "tá ótimo pro MVP".**
**Wireframe:** [Wireframe: 1.2 Capa](https://claude.ai/artifact/An8JtBnPbybY1DpvXYuzMS) (privado do PO): celular,
tablet em pé e computador, com a foto como fundo da primeira seção.

**Levantamento** (2026-10-08, build de demonstração): o título "Belém ⇄ Macapá, com reserva em um minuto", o texto
de apresentação, três botões de mesmo peso (Reservar passagem, Enviar encomenda, Falar com atendente), três
destaques (Belém ⇄ Macapá; 15 anos; 3 ferry boats) e a vitrine das embarcações, em carrossel de CSS.

| | celular (360px) | computador (1280px) |
|---|---|---|
| altura da capa | 1,9 tela | 1,5 tela |
| botões | três, empilhados, cerca de 200px | três, numa linha |
| vitrine | começa no meio da segunda tela | na primeira dobra, cortada |

**Achados:**

1. **A vitrine mostra "Foto pendente" e o nome do arquivo** (`public/embarcacoes/regional.webp`) para o cliente —
   o molde é para a equipe, não para quem visita;
2. **"Falar com atendente" não abre o WhatsApp**: rola até a seção de atendentes. O motivo registrado em
   `conteudo/capa.ts` (o número pendente) caiu — o WhatsApp (91) 99203-5322 já está no site;
3. **três botões de mesmo peso**, empilhados no celular, quase um terço da tela — e o "Reservar agora" do topo já
   fica sempre à vista;
4. **o primeiro destaque repete o título** ("Belém ⇄ Macapá");
5. **o texto de apresentação tem 6 linhas no celular** e empurra os botões para baixo;
6. **Macapá ou Santana**: o título diz Macapá; o porto de chegada no catálogo é Santana/AP;
7. **para depois**: "com reserva" no título e "sem cadastro" no texto mudam de sentido com a compra — decide-se na
   5.1 (U2), não aqui.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | A vitrine sem fotos | **esconder até chegarem as fotos**; ela volta sozinha com a primeira. Se as fotos já existem, entram agora |
| **B** | "Falar com atendente" | **abrir direto o WhatsApp**, com o ícone, como "Falar no WhatsApp" |
| **C** | Os botões | **dois botões** (Reservar passagem, Enviar encomenda) e o WhatsApp como **link com ícone**, mais leve, abaixo |
| **D** | O destaque repetido | **trocar por um fato novo** (a frequência das saídas, a duração da viagem) — **falta o dado**; sem um bom, ficam dois destaques |
| **E** | O texto de apresentação | **encurtar** para 2–3 linhas no celular; o texto vem proposto no wireframe |
| **F** | Macapá ou Santana | **"Macapá" no título** (é como se procura) e **"chegada no porto de Santana"** no texto — ou outra forma que o PO preferir |

**Decisões do PO** (2026-10-08):

- **A** — a foto do **F/B Maria Ivanir** (pôr do sol) é o **fundo da primeira seção**, de borda a borda e encostada
  no topo: um bloco de foto separado era espaço sobrando. A vitrine mostra só embarcação com foto e **só aparece a
  partir da segunda**; com uma, repetiria a do fundo. A foto fica **original** em `src/assets/embarcacoes/`, e o
  Astro gera os tamanhos (AVIF e WebP); o recorte é CSS;
- **B e C** — dois botões (Reservar passagem, Enviar encomenda) e "Falar no WhatsApp" como link com ícone, que abre a
  conversa direto;
- **D** — o destaque repetido vira **"Saída todos os dias"** ("Nos dois sentidos da travessia");
- **E** — o texto encurta para "Reserve sua passagem ou mande sua encomenda por aqui, e o atendimento da NAVEG cuida
  do resto." (3 linhas no celular);
- **F** — só **Macapá**. Santana é o porto mais próximo, porque Macapá não atraca por questões geográficas, e quem
  viaja sabe: a capa não explica.

**Como ficou:** texto claro sobre a foto, com véu navy a 72% (o texto passa de 4,5:1 até sobre o céu mais claro); a
foto é `<img>` com prioridade alta, e não fundo de CSS, porque vira o LCP no celular. Lighthouse no celular: 100 nas
quatro categorias.

### 1.3 — Reserve sua passagem

**Situação:** no ar (#49, 2026-10-09), conferida pelo PO na prévia. **Os 90 dias e a saída suspensa aceitos pelo PO no
celular, em 2026-10-20** (roteiro de aceite 4, com o roteiro 4 do KMP). A data suspensa leva até um minuto e um
recarregar a mais para sumir: é o cache de borda do catálogo (`s-maxage=60, stale-while-revalidate`). A API confere o
catálogo sem cache a cada reserva e recusa a data suspensa com 409. Pedido na prévia: escolhido o dia, a página
leva até as saídas — no celular elas ficam abaixo do calendário. Desde a #51 (2026-10-11), os 90 dias se reservam. A primeira proposta (A–C, abaixo) deu
lugar à segunda, o calendário, depois da orientação do PO no mesmo dia (ver "A segunda proposta", no fim da ficha).
**Wireframes** (privados do PO): o da [primeira proposta](https://claude.ai/artifact/Hvj4pTK9ai5Yph3zA9Why5) e o da
[segunda, o calendário](https://claude.ai/artifact/Ct5MBwxdfJsucJ2BpPKttU). Os horários estão como [hora]: o
wireframe não inventa saída.

**O que é desta seção e o que não é.** Aqui se olha a seção **como parte da página**: o título, o texto de
apresentação, o aviso e quanto espaço ela ocupa. O fluxo da reserva (a forma de escolher a saída, os passos, a
conferência, os erros) é da etapa 2, e os achados dele ficam anotados para lá.

**Levantamento** (2026-10-09, build de demonstração): o título "Reserve sua passagem", o subtítulo ("Escolha a saída,
diga o que vai embarcar e receba o código da reserva. Leva menos de um minuto, não pede cadastro nem documento."), e
o totem num cartão: o aviso "reserva, não venda" numa caixa, a faixa "Demonstração" (só no build de demonstração),
"Escolha a saída" e a lista de **todas** as saídas dos próximos sete dias, cada uma num cartão com o botão "Reservar
esta saída".

| | celular (360px) | computador (1280px) |
|---|---|---|
| altura da seção (demonstração, 20 saídas) | **8.756px, 11,2 telas** | 5.686px, 7,1 telas |
| cartão de cada saída | 389px | 241px |
| onde começa a primeira saída | a 650px do título, no fim da primeira tela | a 470px do título |
| largura usada | toda | uma coluna de ~680px; metade da tela vazia |

Com o catálogo de verdade, "saída todos os dias, nos dois sentidos" (a 1.2) dá 14 saídas na janela de sete dias:
cerca de 5.400px no celular, umas 7 telas.

**Achados:**

1. **A lista de saídas empurra o resto da página para longe.** Quem chega pelo "Reservar passagem" da capa vê a
   seção; quem rola a página para conhecer a NAVEG atravessa 7 a 11 telas de saídas antes de achar a encomenda, os
   atendentes e as avaliações. A forma de escolher a saída é da 2.1, mas o tamanho que ela ocupa na página é daqui;
2. **o mesmo recado duas vezes antes da primeira saída.** O subtítulo explica como funciona (escolha, código) e o
   aviso, numa caixa logo abaixo, explica de novo (o atendimento confirma pelo WhatsApp). No celular são cerca de 10
   linhas de texto antes de "Escolha a saída";
3. **no computador, metade da largura fica vazia** ao lado do totem, e cada saída ocupa uma linha inteira;
4. **para depois, na 5.1 (U2):** "leva menos de um minuto" e "não pede cadastro nem documento" mudam de sentido
   quando houver compra; a capa tem o mesmo ponto ("com reserva em um minuto"). Decide-se lá, não aqui;
5. **para a 2.1:** o trecho repete o porto e a cidade nos dois lados ("Porto Brilhante · Belém/PA → Porto do Grego ·
   Santana/AP"), duas a três linhas no celular; cabe olhar se a escolha começa pelo sentido da travessia;
6. **para a 2.6:** "Não foi possível carregar as saídas" e "Não há saídas disponíveis nos próximos sete dias" não
   oferecem o WhatsApp, e a régua da §2 pede a saída para o atendimento em todo erro.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | O tamanho da lista | **mostrar as 4 próximas saídas** e um botão "Mostrar mais saídas", que acrescenta mais 4 por vez. A seção cai para cerca de 2 telas no celular. A forma da escolha (sentido primeiro, dia, horário) fica para a 2.1 |
| **B** | O texto antes das saídas | **um texto só**, no subtítulo: "Escolha a saída e receba o código da reserva, sem cadastro. Nada é pago aqui: o atendimento confirma a passagem pelo WhatsApp, e a reserva vale até a saída do barco." A caixa do aviso sai da página e **fica no quiosque** (`/totem`), que não tem subtítulo. O rodapé mantém o aviso dele (a 1.7) |
| **C** | O computador | **as saídas em duas colunas** a partir de 64rem; os passos depois da escolha continuam numa coluna só |

**A segunda proposta: a reserva começa pelo dia** (PO, 2026-10-09). A orientação do PO: numa agência de viagens, a
ordem é destino → data → viagem; com uma rota só (três navios, seis viagens semanais alternando Belém e Macapá), a
reserva começa pela **data, num calendário**. As ocorrências hoje só existem por uma semana (dia da semana e hora), e
uma data além disso não encaixa no centralizador; o fluviapp-kmp está fazendo primeiro o arcabouço que recebe as
ocorrências escolhidas pelo usuário, **até 90 dias**. O quiosque (`/totem`) mantém o funcionamento de hoje.

Um achado do wireframe: com os sentidos alternando, cada dia tem saída num sentido só. Um calendário que só marca
"tem saída" leva quem quer ir a Macapá a um dia em que o barco vem de lá.

**Decisões do PO (2026-10-09), todas pela recomendação:**

| # | pergunta | decisão |
|---|---|---|
| **A** | O sentido entra antes do dia? | **Não.** O dia vem primeiro, cada dia mostra a sigla da cidade de onde sai (⇄ quando há os dois sentidos), e o sentido é um filtro opcional ("Saindo de") |
| **B** | Antes do arcabouço do KMP | **Os 90 dias desde já**, com só a janela de hoje (7 dias) clicável; os dias seguintes tracejados, com o WhatsApp. Quando a API devolver as ocorrências de 90 dias, eles se acendem sem mudar a tela |
| **C** | Dia lotado (ADR-0018 do KMP) | **Riscado, com "lotado"**, sem clique. **Espera a API** saber da lotação; não foi implementado |
| **D** | O computador | **Calendário à esquerda, saídas do dia à direita**, um mês só, a partir de 64rem |
| **E** | O dia que vem escolhido | **O primeiro dia com saída**, com as saídas dele abertas |

E, do wireframe: **um texto só** no lugar do subtítulo e da caixa do aviso (a B da primeira proposta); a caixa fica no
quiosque, e o rodapé mantém o aviso dele.

**Implementação** (`ui/1.3-calendario`): a conta em `packages/ui/src/calendario.ts`, a grade em
`CalendarioDeSaidas.tsx`, o alcance em `conteudo/operacao.ts` (`ALCANCE_DO_CALENDARIO_DIAS = 90`). O que se reserva
continua sendo o que o domínio oferta (`DIAS_DA_JANELA`); os dias além dela vêm da mesma viagem semanal, calculada
para 90 dias. No teclado, só um dia entra no Tab, e as setas andam entre os dias com saída. **Depende de outro
repositório:** a lotação (C) e as ocorrências além da semana (B) chegam pela API, depois do arcabouço do KMP; a issue
na API sai quando o desenho de lá fechar.

**Os 90 dias se acendem** (#51, 2026-10-11): o arcabouço fechou no fluviapp-kmp#44, e a B chegou ao fim previsto —
na página, a passagem se reserva nos 90 dias, sem as datas que a transportadora suspendeu. A encomenda fica na
semana, e o quiosque não muda. O estado "reserva pelo atendimento" continua no calendário, para o dia que ele
mostrar além do que se reserva. A **lotação (C)** segue esperando a API.

### 2.1 — A escolha da saída: o cartão da saída

**Situação:** **reaberta pelo PO e decidida em 2026-10-22**, A a E pela recomendação; no ar com o #99 e
**aceita pelo PO no celular em 2026-10-22** (roteiro 6, todos os passos Ok). A C revista no mesmo dia (a foto em faixa,
#103, abaixo) entrou depois do aceite e foi aceita no mesmo dia, no roteiro 9. Ela tinha ficado "sem mudança",
porque o calendário da 1.3 cobriu a escolha do dia. Na revisão da página "Rumo ao MVP", o PO pediu: "a saída deve
ter um cartão mais apresentável e com as informações visíveis". O calendário e o "Saindo de" não mudam; esta ficha
é só o cartão de cada saída do dia. **Wireframe** (privado do PO): [o cartão da
saída](https://claude.ai/artifact/S4yDPVynznFWooWm8XoWwm), com o catálogo real da homologação (as viagens de
quinta, 22/10) e, ao lado, as capturas de hoje.

**Levantamento** (2026-10-22, build de demonstração): o cartão é o `ListaDeTravessias` (`packages/ui/src/Telas.tsx`).
Ele mostra o trecho pelas cidades ("Macapá/AP → Belém/PA"), "Saída: Quinta-feira, 22/10 · 11:00", "Chegada prevista:
Sex 17:00", a embarcação ("F/B REGIONAL · Ferry Boat") e o botão "Reservar esta saída". Todas as linhas têm o mesmo
peso. No celular, cada cartão tem 332px; no computador, 212px. O cais de embarque e o aviso da data alterada só
aparecem depois de escolher, no quadro da saída (`SaidaEscolhida`, 2.2).

**Achados:**

1. **A hora, que é o que se escolhe, está no meio de uma frase.** O dia já está no título ("Saídas de quinta-feira,
   22 de outubro") e se repete em cada cartão, e a hora fica no fim da linha.
2. **A viagem leva cerca de 30 horas, e o cartão não diz isso.** A chegada é sempre no dia seguinte, e "Sex 17:00"
   pede uma conta para ser entendida.
3. **O cais só aparece depois de escolher.** Quem é de Macapá embarca no Porto do Grego, em **Santana**: o cartão diz
   "Macapá/AP" e só o quadro seguinte diz onde embarcar.
4. **A data alterada não avisa na lista.** A 2.2 (decisão B) deixou o aviso na lista "se o PO quiser"; hoje ele só
   aparece depois de escolher.
5. **A embarcação é só um nome em maiúsculas.** Já existem fotos do Maria Ivanir e do Regional (a vitrine, e o cartão
   do Veículo usa a do Regional). A do Maria Eduarda ainda falta.
6. **Para depois:** o preço (7.2, 5.1) e a lotação (1.3, C) entram neste cartão quando a API os tiver. O desenho
   guarda lugar para eles, mas não os mostra.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | A hora em destaque | **A saída e a chegada em números grandes, com a cidade embaixo de cada uma, "≈ 30 h" entre elas e a data da chegada.** A data da saída sai do cartão, porque já está no título. "≈" porque é o tempo médio da rota |
| **B** | O cais no cartão | **Sim: "Embarque" e "Desembarque", com o cais e a cidade, antes de escolher.** É o que evita alguém de Macapá esperar o barco no lugar errado |
| **C** | A foto da embarcação | **Uma miniatura (72×54) ao lado do nome.** Sem foto, o desenho de um barco, e nunca uma foto de outra embarcação. A alternativa, a foto em faixa no alto do cartão, é mais bonita, mas deixa cada cartão cerca de 130px mais alto e pesa mais no celular com sinal ruim |
| **D** | A data alterada na lista | **Sim, no alto do cartão**, com o mesmo texto do quadro da saída ("Embarque alterado nesta data: …"), e o cais e a hora do dia |
| **E** | O botão | **No celular, de largura inteira; no computador, à direita, embaixo.** O texto continua "Reservar esta saída" |

**Decisões do PO (2026-10-22): A a E, todas pela recomendação** ("Gostei, aceitas as recomendações"). Ficam
pendentes duas fotos, que só o PO tem: **a do Maria Eduarda**, que até lá aparece com o desenho de um barco, e **uma
foto nova para o cartão do Veículo**, na pergunta "O que vai embarcar?" (2.2, decisão M), no lugar da do Regional.

**Implementação** (`ui/2.1-cartao-da-saida`): as contas do cartão em `packages/ui/src/cartao-da-saida.ts`, com
cenário. A duração vem da mesma conta que a chegada, para os números não discordarem. O nome que vem do casco em
caixa alta ("F/B MARIA IVANIR") aparece capitulado. A foto é a da vitrine, em miniatura, e a página a casa com a
embarcação **pelo nome**, porque o catálogo tem outro `id`. No celular, o rótulo do cais fica em cima do lugar: em
duas colunas estreitas, o nome do porto quebrava em quatro linhas. **O quiosque recebe o mesmo cartão, com o dia da
saída**, porque a lista dele mistura os dias da semana e não tem o título "Saídas de …"; ele não mostra as fotos.

**A C revista pelo PO, ao ver no ar (2026-10-22):** "eu tinha aceitado a recomendação, mas tinha gostado mais da
alternativa C que dava destaque pra imagem acima e as horas embaixo e o cais mais abaixo menor". O cartão passa a ter
**a foto em faixa no alto**, de ponta a ponta, com o nome da embarcação sobre ela; as horas embaixo; e o cais, menor,
antes do botão. Sem foto, uma faixa baixa com o desenho de um barco e o nome. O resto da reserva e a encomenda
foram aceitos no mesmo dia, nos roteiros 6 e 7 ("a reserva funcionou e a parte de enviar encomenda também,
perfeitinho"). PR `ui/2.1-foto-em-faixa`.

### 1.4 — Envie sua encomenda

**Situação:** decidida pelo PO em 2026-10-22, no ar com o #101 e **aceita pelo PO no celular em 2026-10-22**
(roteiro 7, todos os passos Ok). O pedido do PO: "melhor do que uma lista de frases, uma esquematização básica do passo a passo pra encomenda
e aí o botão no canto inferior direito da seção logo após o passo a passo". **Wireframe** (privado do PO): [o passo
a passo](https://claude.ai/artifact/MpugXBiyRnipqy6TYP1dAH), com as capturas de antes ao lado.

**Levantamento** (2026-10-22): o título, o subtítulo, uma lista numerada de quatro frases e o botão "Mandar uma
encomenda" logo abaixo, à esquerda. No celular, a seção tinha 606px; no computador, 483px, com a lista numa coluna
de 680px e o resto da largura vazio.

**Decisões do PO (2026-10-22), todas pela recomendação** ("Perfeito, implemente"):

| # | pergunta | decisão |
|---|---|---|
| **A** | O esquema | **Cada passo com um ícone do site, um título curto e uma frase.** No celular, um embaixo do outro, ligados por uma linha; no computador, os quatro lado a lado |
| **B** | Os títulos | **"Reserve aqui", "Confirme pelo WhatsApp", "Entregue no porto" e "Retire no destino".** As frases são as de antes, divididas: nada novo foi prometido |
| **C** | O botão | **No celular, de largura inteira; no computador, no canto inferior direito**, logo depois do passo a passo |

**Implementação** (`ui/1.4-passo-a-passo`): os passos em `conteudo/encomenda.ts` (ícone, título e frase), com
cenário; o desenho em `EnvieSuaEncomenda.astro`, sem script. O título de cada passo é um `h3`, e o ícone é decoração.
No celular, a seção tem 829px, porque cada passo ganhou um título; no computador, 546px, agora com a largura inteira.

### 2.2 — O que vai embarcar

**Situação:** no ar (#62, #68 e #69), com o aceite do PO no painel do KMP em 2026-10-15 ("tipo a definir"
apareceu); a #65 e a #66 fecharam. Foi a primeira das fases depois da escolha da saída, o pedido do PO de 2026-10-09. Entra junto a parte visual da #56: o cais do dia e o aviso de alteração, no resumo da saída escolhida
que acompanha todas as fases. **Wireframe** (privado do PO): [2.2](https://claude.ai/artifact/RYxFSUYBb5Fj8GctwXKZYQ).

**Levantamento** (2026-10-14, build de demonstração, o fluxo inteiro depois da escolha, 360px e 1280px): uma
pergunta por tela, com "Passo n de m" em cima, a pergunta, a ajuda quando há, e a saída numa linha de texto cinza
("Cidade Exemplo A/PA → Cidade Exemplo B/PA · Quinta-feira, 15/10 · 18:00", três linhas no celular). As opções são
cartões com o nome ("Passageiro", "Veículo"); a acomodação diz quantas pessoas cabem. Embaixo, "Voltar" e
"Recomeçar" lado a lado. O caminho do passageiro de rede inteira: categoria, acomodação, tipo, quem reserva,
conferência (5 passos); o do veículo: categoria, natureza, classe, e a cilindrada se for moto.

**Achados:**

1. **O total do indicador cresce**: "Passo 1 de 3", depois "2 de 4", depois "3 de 5". O código faz de propósito (o
   caminho se revela com as respostas), mas para quem usa parece um formulário que não acaba;
2. **a saída escolhida não diz de onde o barco sai.** A linha tem as cidades da rota e a hora, sem o cais e sem a
   embarcação. Desde o #59, a rota é Belém → Macapá e o cais em Santana só aparece na mensagem do WhatsApp. A data
   alterada (fluviapp-kmp#52) não avisa em lugar nenhum da tela;
3. **as opções não dizem o que se escolhe.** "Veículo" não diz se quem dirige precisa de passagem própria; "Rede",
   "Suíte" e "Camarote" dizem só a lotação. O texto precisa de fatos da operação;
4. **"Recomeçar" tem o mesmo peso de "Voltar"** e apaga tudo sem perguntar;
5. **no computador, cada opção ocupa a largura inteira** (uma palavra numa faixa de 630px);
6. **para outras partes:** a conferência repete a travessia duas vezes, no cabeçalho e na primeira linha, e não deixa
   corrigir um passo (a 2.4); a conclusão repete o resumo inteiro (a 2.5); o preço da tabela (a 7.2).

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | O resumo da saída escolhida | **um quadro só, igual em todas as fases**: dia e hora, as cidades da rota, o cais de embarque e o de desembarque com a cidade, a embarcação, e "Trocar" (volta ao calendário sem perder as respostas) |
| **B** | O aviso da data alterada | **no quadro da saída, na conferência, na conclusão e na mensagem do WhatsApp**: "Embarque alterado nesta data: {motivo}", com o cais e a hora do dia, sem mostrar o cais de antes. A lista de saídas do dia (2.1) também, se o PO quiser |
| **C** | O indicador | **as quatro etapas pelo nome**: Saída › Embarque › Seus dados › Conferir |
| **D** | O texto das opções | **uma linha curta em cada opção**, com fatos que o PO dá: o que a rede inclui (o passageiro leva a rede?), se quem dirige o veículo precisa de passagem, o que distingue a suíte do camarote |
| **E** | O "Recomeçar" | **um link discreto, com confirmação na tela**; "Voltar" fica como o botão |
| **F** | O computador | **as opções em duas ou três colunas** |

**Decisões do PO (2026-10-14):** **A a F pela recomendação.** E, no lugar da D:

- **a rede não leva texto**: quem viaja de navio sabe que leva a própria rede;
- **três opções**: **Passageiros** (no plural), **Veículo** e **Passageiros e veículo**. O veículo muitas vezes vai
  sozinho, e a reserva serve ao atendimento: o máximo de informação com o mínimo de esforço;
- **passageiros**: "Quantos viajam?" 1, 2, 3, 4, 5 ou mais; depois a acomodação e os dados;
- **sem o tipo da passagem** (inteira, meia, gratuidade): quem define é o balcão;
- **"O que vai embarcar" é a primeira pergunta**, antes do dia, e o veículo se divide em **leve ou pesado**;
- **a apresentação fala das três coisas**: "Reserve sua passagem, mande seu veículo ou sua encomenda", e o
  "Reservar agora", no topo e na capa, fica genérico;
- **o site faz sentir que dá para levar pesados e encomendas** (a encomenda é a próxima fase, a 2.7), também nas fotos
  dos carrosséis. O passageiro vem em segundo plano, mas continua importante.

**A segunda proposta** ([wireframe](https://claude.ai/artifact/WosK1u2zNW21aKVvGFbano)): o caminho passa a ser o que
vai embarcar → o dia e a saída → os dados → conferir. O calendário só acende os dias cuja embarcação leva o que foi
escolhido (a lancha não leva veículo; o navio, só carro e moto). A linha de hoje só tem ferries, com 45 vagas de
veículo cada.

| # | pergunta | recomendação |
|---|---|---|
| **G** | A ordem e o peso das opções | **Veículo grande, com foto**; depois Passageiros e veículo; depois Passageiros; a Encomenda como link para a seção dela, até a 2.7 |
| **H** | Leve ou pesado, e a classe | **"Leve ou pesado?" e depois "Qual?"**, só com as classes do grupo (a tarifa é por classe). Leves: carro, SUV, van, moto, quadriciclo, carretilha, jet ski. Pesados: caminhão, ônibus, motorhome, cavalo mecânico, carreta, trailer, lancha, trator, empilhadeira, retroescavadeira |
| **I** | "5 ou mais" | **abre um contador, de 5 a 50** |
| **J** | Mais de uma pessoa | **uma acomodação para o grupo**; grupo misto, o balcão resolve |
| **K** | Passageiros e veículo | **uma reserva só, com um código** |
| **L** | O quiosque | **o mesmo caminho novo**, com a lista de saídas no lugar do calendário |
| **M** | As fotos | **um veículo pesado embarcando**, para a opção Veículo e a capa; carga e encomenda nos carrosséis. Precisa de fotos da NAVEG ou da MOCORONGO |

**Depende do KMP** (a issue sai lá com as respostas H a K): a reserva de passageiros sem o tipo da passagem, a
quantidade de pessoas sem o teto da acomodação, e a reserva com pessoas e veículo. Enquanto isso, o que não depende
dele pode ir antes: as etapas pelo nome, o quadro da saída com o cais, o aviso de alteração e o texto da apresentação.

**Decisões do PO sobre a segunda proposta (2026-10-14):**

- **O quiosque (`/totem`) não muda** (L, contra a recomendação). A operação interna pode e deve ser diferente do que se
  exige do cliente;
- **o tipo da passagem nunca é exigido na reserva**: quem guarda essa regra do negócio é o atendente;
- **a reserva não recusa a acomodação pela quantidade**: 5 pessoas em suíte vão assim, e o atendimento resolve, por
  exemplo, em duas suítes. O que importa é a informação que chega;
- **as regras do Firestore não mudam**: elas também guardam o negócio. O que muda no KMP são casos de uso e fluxos.

Conferido nas regras (`firestore.rules`, `formaDoPedido`): a passagem e o veículo só têm as chaves conferidas. Elas não
exigem o tipo, não limitam a quantidade pela acomodação e não separam pessoas de veículo. Quem recusa hoje é o leitor
do KMP (`ReservaDocumento.paraDominio`), que exige o tipo e descarta a reserva de passageiro com veículo. A mudança é
lá, no leitor e no fluxo de converter, e aqui, na montagem do `@navegsistemas/domain`.

**G a K e M pela recomendação (PO, 2026-10-14)**, e o PO registra a mudança como **requisito do negócio para o MVP**:
o escopo estava fechado, e ela entrou por força maior (ver o
[plano de implementação](plano-de-implementacao.md), "Resumo da ordem"). As issues do KMP:
navegsistemas/fluviapp-kmp#62 (a reserva sem o tipo e sem o teto da acomodação) e #63 (passageiros e veículo numa
reserva só). A ordem é KMP → domain → API e site.

**A reserva sem o tipo e de 1 a 50 (#65, 2026-10-15):** o KMP entrou no `master` (fluviapp-kmp#67). Na página, depois de
"Passageiro", vêm "Quantos viajam?" (1, 2, 3, 4 e "5 ou mais", que abre um contador até 50) e "Onde vocês querem
viajar?", uma acomodação para o grupo; o tipo não é perguntado, e o resumo diz "inteira, meia ou gratuidade no
atendimento". O quiosque não muda. A página manda `canal: 'SITE'` nas respostas, e é por ele que a API remonta a reserva
pelo mesmo caminho. Por isso a ordem tem um passo a mais: o domain 0.9.0 primeiro, depois a API com ele **promovida**, e
só então a página: com a API de antes, a reserva sem o tipo seria recusada. Falta a primeira pergunta ("o que vai
embarcar", com Passageiros e veículo), que é a #66.

**O caminho novo da segunda proposta (#66, 2026-10-15):** o KMP entrou no `master` (fluviapp-kmp#68). Na página, a
reserva começa por **"O que vai embarcar?"**, antes do dia:

- **Veículo** é o cartão grande, com "Leve" e "Pesado" e os exemplos à vista; **Passageiros e veículo** e
  **Passageiros** vêm menores; a encomenda é um link para a seção dela;
- o veículo pergunta **"Leve ou pesado?"** e **"Qual?"**, só com as classes daquele porte (e a cilindrada, na moto);
- as pessoas perguntam **"Quantos viajam?"** e a acomodação do grupo, como na #65;
- depois vem **o dia**, e o calendário só acende as saídas cuja embarcação leva o que foi escolhido;
- o que já foi respondido fica num quadro com **"Mudar"** ("Caminhão + 3 pessoas em rede"), e as etapas passam a ser
  O que vai embarcar › Dia e saída › Seus dados › Conferir.

"Passageiros e veículo" é uma reserva só, de veículo, com as pessoas e a acomodação, e sem o tipo. O cartão do veículo
fica sem foto até a decisão M: destaca-se pelo tamanho e pela posição. O quiosque não muda.

Desta vez o domain e a página vão num PR só: com o domain novo, a página já muda. A ordem continua a mesma: a tag
`domain-v0.10.0` sai do commit do PR, a API sobe para ela e é promovida, e só então o PR entra na `main`. Enquanto isso,
a API nova continua aceitando a página de antes (a `categoria` vale como o que vai embarcar).

**O que vai antes, sem o KMP:**
- a parte visual da primeira proposta (A, B, C, E e F) e o título da apresentação;
- o quadro da saída com o cais e o aviso de alteração vale também no quiosque, porque é informação e não muda o fluxo;
- as etapas pelo nome, o "Recomeçar" discreto e as colunas valem **só na página**, porque o quiosque não muda.

### 2.7 — A reserva de encomenda

**Situação:** no ar (#72, juntado em 2026-10-16, depois de o PO conferir a prévia), com a API do domain 0.11.0
promovida no mesmo dia (naveg-api-vercel#40). **Aceita pelo PO no celular, em 2026-10-20** (roteiro de aceite 2). A #58 fechou. O PO pediu, depois do aceite da 2.2: "continuemos na UX agora
com a parte de encomenda". Entra junto a #58 (a encomenda só com quem manda, decisão de LGPD de 2026-10-07).
**Wireframe** (privado do PO): [2.7](https://claude.ai/artifact/V7vUdrj1vNqNyhY7ftWCNc).

**Levantamento** (2026-10-15, build de demonstração, 360px e 1280px): a seção "Envie sua encomenda" tem um totem
próprio. Começa por uma lista de todas as saídas da semana (20 cartões, cerca de 5.000px no computador); depois "Passo
n de m", com "O que vai mandar?" (o tipo em cartões, a quantidade num campo de texto e o complemento numa tela só),
"Quanto pesa?", "Quem retira no destino?", "Para quem vai?" (com outra pessoa), quem manda e a conferência. O card fica
na largura de texto (680px), com duas caixas de aviso antes da pergunta.

**Achados:**

1. **A lista longa** antes de qualquer pergunta, quando a reserva já usa o calendário;
2. **o card estreito**, com o espaço vazio à direita que a reserva acabou de corrigir;
3. **o indicador e a navegação de antes**: "Passo n de m" que cresce, e "Recomeçar" do mesmo peso de "Voltar";
4. **"Quem retira?" e "Para quem vai?"** ainda no site, contra a decisão de 2026-10-07 (#58);
5. **duas caixas de aviso** antes da pergunta;
6. **três perguntas numa tela** na primeira (o tipo, a quantidade e o complemento);
7. **duas portas para reservar**, cada uma com outro jeito de andar: quem entra por "Reservar agora" só vê a encomenda
   num link.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | Um caminho só | **Encomenda como quarta resposta de "O que vai embarcar?"**, na seção da reserva; o formulário à parte sai |
| **B** | A seção "Envie sua encomenda" | **fica, curta**: como funciona em quatro linhas e o botão "Mandar uma encomenda", que abre a reserva já em "Encomenda"; o menu e a capa continuam apontando para ela |
| **C** | O cartão Encomenda | **o mesmo peso de Passageiros**, com "Caixas, sacos, eletrodomésticos, móveis"; a foto quando chegar (decisão M) |
| **D** | As perguntas | **três telas**: o tipo em cartões, com "O que é" opcional; quantos volumes, com 1 a 4 e "5 ou mais" (até 20); o peso em quatro faixas |
| **E** | O calendário | **só os próximos 7 dias acendem** (a regra do KMP), com a linha "A encomenda se reserva para os próximos 7 dias. Para mais adiante, fale com o atendimento" |
| **F** | Seus dados | **nome e celular obrigatório** (#58), com "É por ele que o atendimento fala com você e avisa quando a encomenda chegar" |
| **G** | A retirada | **uma linha na conferência e na conclusão**: "No destino, a encomenda é retirada no porto com documento. Quem vai buscar, você combina com o atendimento." O texto é fato da operação: **o PO confirma** |
| **H** | Encomenda com passageiros | **não, por enquanto**: uma reserva por vez, e a conclusão oferece "Reservar mais alguma coisa" |

**A ordem, depois da decisão:** tirar quem retira e o destinatário muda o domain e a API. Vai como a #66: um PR com o
domain e a página, a tag no commit do PR, a API sobe e é promovida, e só então o PR entra. O KMP não muda (fluviapp-kmp#43).
O quiosque não muda: ele não tem encomenda.

**Decisões do PO (2026-10-15):** **A a H pela recomendação**, com o texto da G. E uma mudança na #58: **o destinatário
volta, opcional, depois de quem manda** — "o KMP nunca deixou de receber, então não tem tanto problema; foi um requisito
que o negócio gostou que tenha". "Quem retira no destino?" continua fora: com o destinatário informado, a reserva vai
como "outra pessoa retira"; sem ele, sem a retirada, e o atendimento combina (é o que o KMP já lê, fluviapp-kmp#43). O
celular de quem manda é obrigatório nos dois casos (F). A política de privacidade passa a dizer que o destinatário é
opcional.

**O que foi implementado (#72, 2026-10-16;** capturas a 360px e 1280px no build de demonstração**):**

- **Encomenda** é a quarta resposta de "O que vai embarcar?". Depois vêm três telas: o tipo em cartões, com "O que é"
  opcional; quantos volumes (1 a 4, ou "5 ou mais", que abre o contador até 20); e o peso em quatro faixas;
- **o dia:** só os próximos 7 dias acendem, e o resto fica tracejado. A nota dos tracejados, embaixo do calendário, é a
  linha da E, com o link do WhatsApp: "A encomenda se reserva para os próximos 7 dias. Para mais adiante, fale com o
  atendimento pelo WhatsApp";
- **quem manda**, com o celular obrigatório; **quem recebe**, opcional, com "Pular: combino com o atendimento";
- **a conferência e a conclusão** dizem "Quem retira: A combinar com o atendimento" e trazem a linha da G. A conclusão
  oferece "Reservar mais alguma coisa" (H);
- **a seção "Envie sua encomenda"** tem os quatro passos e o botão "Mandar uma encomenda", que abre a reserva já em
  "Encomenda". O menu e o botão da capa continuam levando à seção;
- **o quiosque** não muda: ele não tem encomenda.

**As fotos (PO, 2026-10-16): não haverá fotos de carga.** O cartão Encomenda fica sem foto (C), e os carrosséis da
decisão M ficam sem carga e encomenda. A foto do Maria Eduarda para a vitrine continua pendente.

O que as capturas mostraram, e foi corrigido no mesmo PR:

- **"Quem recebe?" abria com o nome e o celular de quem manda**: o formulário do passo anterior era reaproveitado.
  Com um toque em "Continuar", o remetente iria como destinatário;
- **no computador, a linha dos 7 dias tomava a coluna das saídas**, e elas caíam para baixo do calendário. A linha
  passou a ser a nota dos tracejados, que antes repetia o mesmo assunto logo acima;
- **na conferência, os valores saíam desalinhados** quando um rótulo era longo ("Celular de quem manda"). Os rótulos
  agora dividem uma coluna só, também na reserva de passagem.

### 2.3 — Quem reserva

**Situação:** no ar (#75, juntado em 2026-10-16), com a API do domain 0.12.0 promovida depois dele (naveg-api-vercel#41).
**Aceita pelo PO no celular, em 2026-10-20** (roteiro de aceite 1, com a reserva gravada que conferiu a promoção da API).
É o passo "Seus dados" da reserva de passagem e de veículo na página. A encomenda já tem o dela, decidido na 2.7 (F). O quiosque não muda (decisão de 2026-10-14).
**Wireframe** (privado do PO): [2.3](https://claude.ai/artifact/U1rdUt7V5BZdR1VqF4E3GF).

**Levantamento** (2026-10-16, build de demonstração, 360px e 1280px; dois passageiros em rede): depois do quadro do que
vai embarcar e do da saída, a pergunta "Em nome de quem fica a reserva?", com a ajuda "O telefone é opcional: ao final,
você fala com o atendimento pelo WhatsApp". Dois campos: "Nome" e "Celular com DDD (opcional)", com a máscara
(91) 98888-7777. Sem o nome, "Informe o nome de quem faz a reserva."; com o celular pela metade, "Precisa ser um celular
com DDD — ou deixe em branco.". A conferência e a conclusão dizem "Em nome de" e "Telefone: Não informado". No
computador, os campos ficam na largura de leitura (680px). O quiosque mostra o mesmo passo, com "Passo 4 de 5".

**Achados:**

1. **O celular é opcional na passagem e obrigatório na encomenda.** Quem não informa o celular e não toca em "Enviar ao
   atendimento" deixa uma reserva que o atendimento não tem como confirmar. E o plano diz que este passo existe para
   formar clientela ([plano](plano-de-implementacao.md), o passo `CONTATO`);
2. **a ajuda começa pelo que não precisa** ("o telefone é opcional"), e não pelo que o celular serve;
3. **três nomes para a mesma coisa:** "Celular com DDD" no campo, "telefone" na ajuda, "Telefone" na conferência;
4. **nada no passo diz para que servem os dados**, nem leva à política de privacidade, no momento em que o dado é
   pedido;
5. **só o nome de quem reserva**, mesmo com 2 ou mais pessoas: os nomes de quem viaja ficam para o atendimento;
6. **para outras partes:** no quadro da saída, a embarcação aparece colada à linha do desembarque (2.2); com a conta
   (7.4), o nome e o celular podem vir dela; o vocabulário de passageiro e cliente (#57) não toca este passo, porque
   quem reserva não é chamado de cliente na tela.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | O celular na página | **obrigatório, na passagem e no veículo**, como já é na encomenda; o quiosque continua opcional. A política de privacidade muda junto ("se você quiser informar" sai). O dado que decidiria: quantas reservas do site chegam ao painel sem telefone e sem conversa no WhatsApp |
| **B** | Um nome só | **"Celular com WhatsApp"** no campo, **"Celular"** na conferência e na conclusão, e a ajuda diz para que serve: "É pelo WhatsApp deste celular que o atendimento confirma a reserva com você" |
| **C** | A privacidade no passo | **uma linha com o link para a política**: "Usamos o nome e o celular só para esta reserva, e apagamos 14 dias depois da viagem" |
| **D** | Os nomes de quem viaja | **continuar sem pedir**: só o nome de quem reserva; os de quem viaja ficam para o atendimento, na emissão |

**A ordem, se A for "obrigatório":** o domain já sabe pedir o celular (é o `telefoneObrigatorio` da encomenda). Se a
regra entrar no domain para o canal do site, a API sobe o domain e é promovida antes da página, como na 2.7; se ficar só
na tela, vai num PR só da página. O KMP não muda: ele já lê a reserva com ou sem telefone.

**Decisões do PO (2026-10-16):** **A a D pela recomendação**, com o celular obrigatório na reserva da página. O quiosque
continua opcional.

**A implementação (#75):**

- **o domain 0.12.0:** o passo de quem reserva pede o celular quando o canal é o site, na passagem e no veículo. A regra
  fica no roteiro, e não no agregado: a montagem recusa a reserva do site sem celular (a API responde 422), e o KMP
  segue lendo a reserva com ou sem telefone. O quiosque não manda o canal, e segue opcional;
- **na tela:** "Celular com WhatsApp" no campo, a ajuda "É pelo WhatsApp deste celular que o atendimento confirma a
  reserva com você", a linha de privacidade com o link, antes do "Continuar", e "Celular" na conferência e na conclusão;
  na encomenda, quem manda ganha o mesmo rótulo e a mesma linha;
- **a política de privacidade 1.2:** o nome e o celular, e o celular opcional só no terminal da agência;
- **a ordem é a inversa da 2.7: a página antes, a API depois.** A página nova sempre manda o celular, e a API que está no
  ar aceita. Depois, a tag `domain-v0.12.0` no commit do PR, e a API sobe o domain e é promovida. Na ordem da 2.7, a
  API nova recusaria, até o merge, quem reservasse sem celular pela página de antes.

### 2.4 — A conferência

**Situação:** no ar (#77, juntado em 2026-10-16), com a melhoria da conclusão (a 2.5) junto, a pedido do PO.
**A 2.4 e a 2.5 aceitas pelo PO no celular, em 2026-10-20** (roteiros de aceite 1 e 2).
É a última tela antes de confirmar a reserva de passagem ou de veículo, na página. A da encomenda segue a mesma tela, com as linhas dela (2.7). O quiosque não muda.
**Wireframe** (privado do PO): [2.4](https://claude.ai/artifact/Vq8MEfYSrWSRopTmXzzpZK).

**Levantamento** (2026-10-16, build de demonstração, 360px e 1280px; passageiros, veículo, e passageiros e veículo):
as etapas, a pergunta "Confira a reserva" e uma lista de nove linhas: Travessia, Saída, Embarque, Desembarque,
Embarcação, Passagem, Em nome de, Celular e Vale até. Depois, "Confirmar reserva", e "Voltar" com "Recomeçar a reserva".
Os quadros "Mudar" e "Trocar a saída" das telas anteriores não aparecem aqui. No celular, ao chegar, a tela mostra a
pergunta e as três primeiras linhas; o botão fica a quase duas telas. No computador, a lista cabe numa tela, em duas
colunas.

**Achados:**

1. **no celular, o botão fica a quase duas telas da chegada**: nove linhas, boa parte endereço completo;
2. **o que a pessoa escolheu aparece na sexta linha**, depois de cinco sobre a viagem;
3. **o veículo aparece como "Passagem: Veículo: Carro · + 3 pessoas em suíte · inteira, meia ou gratuidade no
   atendimento"**: um rótulo errado e quatro informações numa linha;
4. **para corrigir uma coisa, só "Voltar", um passo de cada vez, ou "Recomeçar"**: os quadros com "Mudar" somem
   justo aqui;
5. **"Vale até: a saída — Sexta-feira, 16/10 · 18:00"** repete a saída e não diz o que acontece ao confirmar;
6. **nada perto do botão diz que nada é pago** e que o próximo passo é o WhatsApp; só o subtítulo da seção, lá em cima;
7. **para outras partes:** o desembarque e o tipo da embarcação ficam para o WhatsApp e para a conclusão (2.5); os erros
   na conferência são da 2.6; o preço, da etapa 5. O achado da 2.2 ("a conferência repete a travessia no cabeçalho e na
   primeira linha") não vale mais: o cabeçalho saiu com a 2.2.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | A ordem e o agrupamento | **três blocos: "O que vai", "A viagem" e "Em nome de"**, nessa ordem; no computador, lado a lado. A viagem com o dia e a hora, as cidades, o cais de embarque e a embarcação. O desembarque e o tipo da embarcação saem da conferência (ficam no WhatsApp e na conclusão) |
| **B** | Corrigir sem recomeçar | **"Mudar" ou "Trocar" em cada bloco**, que leva ao passo e mantém o resto, como os quadros das telas anteriores |
| **C** | O veículo escrito como se fala | **"Carro, com 3 pessoas em suíte"**, e numa linha à parte "Inteira, meia ou gratuidade: no atendimento"; para passageiros, "2 pessoas em rede". O KMP e o WhatsApp não mudam |
| **D** | O que acontece ao confirmar | **sai "Vale até"**, e entra embaixo do botão: "Nada é pago agora. Ao confirmar, você recebe o código e fala com o atendimento pelo WhatsApp. A reserva vale até a saída." Com a compra (etapa 5), a linha muda para o caminho de quem reserva |

**A ordem:** só a página. O domain e a API não mudam.

**Decisões do PO (2026-10-16):** **A a D pela recomendação** ("gostei dos blocos"). E: **incluir na 2.4 uma melhoria no
pós-confirmação**, que era a 2.5. O levantamento da conclusão, no modo que envia: "Reserva feita", "Reserva registrada.
Guarde este código:", o código, "Copiar código" e só depois "Enviar ao atendimento", e a lista de nove linhas de novo.
O achado: **a reserva só é confirmada pelo atendimento, no WhatsApp, mas a tela parece de algo terminado**. A pergunta E
teve a recomendação aceita:

| # | pergunta | decisão |
|---|---|---|
| **E** | A conclusão | **o WhatsApp como o passo que falta**: o código com "Copiar" ao lado; logo abaixo, num quadro, "Falta um passo: envie a reserva ao atendimento. É pelo WhatsApp que ela é confirmada.", o botão "Enviar pelo WhatsApp" e "Se não abrir, fale com o atendimento pelo (número), com o código."; depois os três blocos, sem o "Mudar". Contra: abrir o WhatsApp sozinho (o navegador pode bloquear) e só reordenar |

**A implementação (#77):**

- **a conferência em blocos**, lado a lado no computador, na largura do cartão; o texto corrido (a nota, o passo que
  falta) segue na largura de leitura. Na encomenda, os blocos são "O que vai", "A viagem", "Quem manda" e "Quem recebe";
- **"Mudar" e "Trocar"** levam ao passo e mantêm o resto. O que vai embarcar volta à primeira pergunta e à escolha da
  saída, como o quadro "Mudar" já fazia. **O formulário de quem reserva volta preenchido**, também no "Voltar", que antes
  o devolvia vazio. O que foi digitado se apaga ao recomeçar, inclusive na inatividade do quiosque;
- **a nota da conferência** na encomenda troca "A reserva vale até a saída" pela entrega no porto;
- **o quiosque não muda**: a conferência em linhas e a conclusão de antes.

### 2.6 — Os erros

**Situação:** no ar (#81). **O texto do WhatsApp aceito pelo PO no celular, em 2026-10-20** (roteiros de aceite 1 e 2).
**Os erros aceitos no mesmo dia** (roteiro 3), depois do #87: na primeira vez, o passo 1 falhou (com o modo avião, o
site disse "a verificação contra robô não passou", porque o script do Turnstile não carrega sem rede). O que a pessoa vê quando algo dá errado na reserva da página: ao
confirmar, e quando as saídas não carregam. **Wireframe** (privado do PO): [2.6](https://claude.ai/artifact/3WKUvz1NP45qtgZZ3tCMqF).

**Levantamento** (2026-10-16, o build do E2E com a API falsa, 360px; a conferência da 2.4): a API já responde cada caso
com um código próprio — 429 (`LIMITE_EXCEDIDO`, 20 envios em 10 minutos), 403 (`DESAFIO_INVALIDO`), 409 (a saída saiu
da oferta), 422 (as pendências) e 500 —, mas o site junta quase tudo:

| o que aconteceu | o site mostra hoje |
|---|---|
| sem internet, a API fora do ar, envios demais, a verificação contra robô | "Não foi possível enviar a reserva agora. Confira a conexão e tente de novo.", em texto simples, embaixo da nota |
| a saída saiu da oferta (partiu, foi suspensa, ou a encomenda passou da semana) | "Esta saída já partiu. Escolha outra travessia.", num quadro, e "Escolher outra saída" |
| as saídas não carregam | "Não foi possível carregar as saídas. Tente de novo em instantes.", sem botão |

**Achados:**

1. **três erros diferentes viram a mesma frase**, que manda conferir a conexão mesmo quando a internet está boa;
2. **no limite de envios, "tente de novo" falha de novo** por até 10 minutos, sem a pessoa saber por quê;
3. **nenhum erro leva ao WhatsApp**, contra a régua da §2 ("erros que dizem o que fazer, sempre com a saída para o
   atendimento");
4. **a frase do envio aparece embaixo da nota, longe do botão**, em texto simples; só a da saída que partiu tem quadro;
5. **"Esta saída já partiu"** aparece também quando ela foi suspensa, ou quando a encomenda passou da semana;
6. **as saídas que não carregam** não têm botão para tentar de novo: só recarregando a página;
7. **o quiosque** mostra as mesmas frases. Lá o WhatsApp não serve (é um terminal da agência): ele ganha só os textos.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | Cada erro com a sua frase | **quatro frases** — sem internet ou API fora do ar; envios demais; a verificação contra robô; as pendências, que já têm texto — **num quadro de aviso logo acima do botão**, que vira "Tentar de novo" |
| **B** | O WhatsApp como saída | **"Enviar pelo WhatsApp" em todo erro do envio, só na página**: a conversa abre com a reserva escrita, sem código, e o atendimento registra no painel. Custo: essa reserva não entra sozinha no painel |
| **C** | As saídas que não carregam | **o quadro de aviso, "Tentar de novo"** (carrega de novo sem perder o que foi escolhido) **e o WhatsApp do atendimento** embaixo |
| **D** | A saída que não está mais aberta | **"Esta saída não está mais aberta para reserva. Ela partiu, ou foi suspensa. O resto da reserva continua aqui."**; para a encomenda fora da semana, a frase da semana |

**A ordem:** só a página e o pacote de dados (que passa a devolver o motivo da falha). A API já manda o código de cada
erro; o domain e o KMP não mudam.

**Decisões do PO (2026-10-16):** **A a D pela recomendação.** Sobre a B, o PO perguntou se as reservas deixariam de
entrar sozinhas: não. O envio que dá certo segue gravado no painel; só a reserva **que falhou** (nada foi gravado) vai
pelo WhatsApp e é lançada à mão. E: **"uma melhor formatação no texto enviado pelo WhatsApp, um tom mais
profissional"**, a última mudança na reserva. A pergunta E teve a recomendação aceita:

| # | pergunta | decisão |
|---|---|---|
| **E** | O texto do WhatsApp | **a saudação, um campo por linha com o nome em negrito, e o pedido de confirmação**, na voz do cliente, que é quem envia: "Olá! Gostaria de confirmar a reserva que fiz pelo site." · `*Reserva:*` · `*Trecho:*` · `*Saída:*` · `*Embarque:*` · `*Passagem:*` (ou `*Veículo:*` e `*Acompanhantes:*`) · `*Nome:*` · "Aguardo a confirmação." Na encomenda, `*Volumes:*`, `*Remetente:*`, `*Destinatário:*` e "Entrego no porto antes da saída. Aguardo a confirmação." **Sai o "Vale até a partida."**: o site já o diz ao cliente. Na reserva que falhou (B), a abertura é "Olá! Tentei fazer esta reserva pelo site, mas ela não foi enviada. Podem registrá-la para mim?", sem a linha do código |

**A implementação:**

- **o envio que falha** diz por quê (a conexão, os envios demais, a verificação contra robô) num quadro acima do botão,
  que vira "Tentar de novo"; na página, "Enviar pelo WhatsApp" embaixo, com a reserva escrita e sem código;
- **as saídas que não carregam**: o quadro, "Tentar de novo" (carrega de novo e mantém o que foi escolhido) e, na
  página, o WhatsApp do atendimento;
- **a saída fechada**: a frase da D; na encomenda, a da semana;
- **a mensagem do WhatsApp** (E) muda no domain, que só a página usa: a API e o KMP não leem o texto, e o domain
  não precisa de versão nova. O atendente acha a reserva pelo código, agora o primeiro campo;
- **o quiosque** ganha só as frases: lá não há WhatsApp.

### 2.8 — A verificação contra robô

**Situação:** **no ar** (#92, juntado em 2026-10-21) e **aceita pelo PO no celular no mesmo dia** ("Funcionou").
**Decidida** (2026-10-21): **A e B pela recomendação**. O pedido do PO, no mesmo dia: "não vi adequação à
interface a verificação de robô, antes ele aparecia avulso no meio da tela embaixo e ficava lá mesmo depois de ter sido
verificado; se possível, adiciona como pequeno passo extra pra confirmar reserva no próprio totem". **Wireframe:** os
dois desenhos foram mostrados ao PO na própria pergunta, em texto.

**Levantamento** (2026-10-21): o Turnstile era desenhado num contêiner preso ao `body` da página, fixo no rodapé da
tela, fora do totem, e só no envio (`appearance: 'interaction-only'`). Quase sempre ele resolvia sem aparecer. Quando a
Cloudflare pedia um toque, o quadro aparecia solto embaixo da tela e **ficava lá com o "Sucesso"**, porque nada o tirava
depois do token. Vale para a passagem, o veículo e a encomenda, na página e no quiosque; a conta (3.1, 3.3) vai usar o
mesmo.

**Achados:**

1. **o quadro solto não diz de onde vem**: aparece longe do botão, e parece outra coisa da página;
2. **ele não sai depois de verificado**: fica sobre o conteúdo até recarregar;
3. **carregar na conferência, e não no envio**, muda o momento em que a Cloudflare recebe o endereço: a política dizia
   "Ao enviar uma reserva", e passa a dizer "na conferência, antes de você confirmar". Continua só para quem chega à
   conferência.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | Como a verificação entra | **um passo visível da conferência**, "Verificação contra robô", acima do botão: começa sozinha ao abrir a conferência, quase sempre passa em um ou dois segundos com o visto, às vezes pede um toque; o "Confirmar reserva" diz "Verificando…" e espera. Contra: invisível como hoje, só que dentro do cartão e sumindo depois |
| **B** | O quiosque | **igual à página**: ele tem o mesmo defeito. Contra: só corrigir o quadro solto |

**A implementação:**

- o quadro é o da Cloudflare (`appearance: 'always'`, `size: 'flexible'`, em português), dentro do cartão, com o título
  no estilo dos blocos da conferência; ele sai da tela com a conferência;
- **um token por envio**: o envio leva o token, e o quadro busca outro, que serve ao "Tentar de novo" se a API recusar.
  O token que vence (5 minutos) se renova sozinho, e o botão volta a "Verificando…";
- **quando não resolve**, a frase fica embaixo do quadro, com "Verificar de novo": sem rede, "A verificação não carregou.
  A internet pode ter caído. O que você escolheu continua aqui."; com rede, "A verificação não passou.";
- a frase do envio recusado por robô (2.6, A) perde o "Atualize a página": "A verificação contra robô não passou. Tente
  de novo.", porque o "Tentar de novo" agora pede outra verificação;
- a demonstração, que não envia, não tem o passo.

### A área do cliente — o levantamento (etapa 3, 4.1 e 4.2)

**Situação:** em análise (2026-10-16). O levantamento é da área inteira, porque ela ainda não existe no site e as
perguntas que vêm antes das telas valem para todas. As telas andam depois **uma seção por vez**, pelo ritual: 3.1
(criar a conta), 3.2 (confirmar o e-mail), 3.3 (entrar e sair), 3.4 (esqueci a senha), 3.5 com a 1.1 (onde se
entra), 4.1 (Minha conta) e 4.2 (Meus dados).

**Levantamento** (2026-10-16):

| onde | o que já existe |
|---|---|
| **o site** | nenhuma tela da conta. Quatro páginas: `/`, `/totem`, `/privacidade` e `/termos`. O topo guarda o lugar de **"Minha conta" como item fixo do menu** (1.1, D, 2026-10-08), sem JavaScript para trocar entre "Entrar" e "Minha conta". O `meta.ts` já prevê `/conta` e `/pedidos` fora do mapa, com `noindex`. A privacidade e os termos dizem que a conta vem depois |
| **o KMP** | **pronto** (fluviapp-kmp#55, ADR-0022, 2026-10-13). A conta é `contasDeCliente`, com **nome, e-mail, telefone (opcional), criada em, confirmada em e ativa**. A senha e o código de confirmação ficam num `segredos/` que só o servidor lê. O Supervisor desativa e reativa a conta pelo painel; o Agente só vê |
| **a API** | **a fazer** (naveg-api-vercel#30): cadastro, confirmação, entrar (recusa a conta desativada), Meus dados (corrigir nome e telefone, apagar) e o resumo para a Saúde. As chaves entram antes no `@navegsistemas/domain` daqui |
| **as regras do negócio** | **O6**: conta obrigatória **só para comprar**, com o e-mail confirmado; reservar continua sem conta. **O7**: apagar a conta tira os dados, e as passagens ficam. **U3**: a conta é pedida na hora de pagar. **U5**: o quiosque não tem conta. **ADR-0002**: o navegador não fala com o Firestore; tudo passa pela API |
| **o que não existe em lugar nenhum** | **o envio de e-mail.** Nenhum dos três repositórios manda e-mail hoje. A confirmação (3.2), o esqueci a senha (3.4) e, depois, o bilhete (7.6) precisam de um provedor de e-mail transacional e de registros no DNS de `gruponaveg.com.br` (SPF e DKIM), ou caem no spam |

**Achados:**

1. **Antes da compra, a conta dá pouco ao cliente.** No MVP sem a 7.6, quem entra vê os próprios dados e pode deixar
   opinião (1.6), e só. É o que o PO decidiu na ordem até o MVP, e não muda nada aqui. Mas é por isso que vale a conta
   **preencher a reserva** com o nome e o celular (a 2.3 já deixou isso anotado): é o primeiro ganho visível.
2. **O e-mail é o que mais trava**, mais que a tela. Sem provedor e sem o DNS, não há confirmação nem senha
   esquecida, e a conta não se completa. Escolher o provedor é de engenharia; **ter acesso ao DNS de
   `gruponaveg.com.br`** e aceitar o custo são do negócio.
3. **A U8 e a D4 são uma ação só, no mesmo DNS.** A U8 (a homologação num subdomínio) trava a conta em homologação: em
   `*.vercel.app` o iPhone descarta o cookie de outro domínio. **A D4 (o domínio da API de produção) não trava a
   homologação** (naveg-api-vercel#30); trava só a produção. O que falta é quem tem acesso ao DNS, e os nomes.
4. **O celular: obrigatório na reserva da página (2.3), opcional na conta (o contrato do KMP).** Se a conta não pede,
   a reserva feita por quem entrou ainda vai perguntar. O contrato aceita os dois jeitos; a escolha é de produto.
5. **"Sem revelar se o e-mail tem conta"** (3.1 e 3.4, e o plano da API) deixa as mensagens genéricas: "se houver uma
   conta com este e-mail, enviamos o link". É o certo contra quem testa e-mails alheios, e a tela tem de deixar
   claro o que fazer a seguir.
6. **A conta desativada pelo Supervisor** precisa de uma frase e da saída para o WhatsApp (a régua da §2): "Esta conta
   está desativada. Fale com o atendimento."
7. **O site deixa de ser uma página só.** O topo já leva às âncoras da página a partir de qualquer página
   (`ancoraVistaDe`), e o "Reservar agora" de `/conta` leva à página. O quiosque continua sem "Minha conta" (U5).
8. **A privacidade muda com a conta** (U7): e-mail, senha, histórico. A seção nova vai à revisão jurídica e entra no
   ar com a 7.4, mudando a versão e a data.

**Perguntas para o PO, antes das telas, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | O DNS de `gruponaveg.com.br` e os nomes (a U8 e a D4 juntas) | **o site da homologação em `homologacao.gruponaveg.com.br` e a API em `api-homologacao.gruponaveg.com.br`**; em produção, o site em `gruponaveg.com.br` e a API em `api.gruponaveg.com.br`. O Claude entrega os registros prontos; **quem tem o acesso ao DNS os grava**. Sem isso, a conta pode ser desenhada, mas não aceita no celular |
| **B** | O e-mail que o site manda | **um provedor de e-mail transacional**, escolhido pelo Claude, saindo de `naoresponda@gruponaveg.com.br`, com os registros SPF e DKIM no mesmo DNS da A. No volume do MVP, os provedores grandes ficam na faixa gratuita; o custo aparece só com volume. As respostas de quem escreve de volta vão para o `contato@` |
| **C** | O celular na conta | **obrigatório**, como na reserva da página: um campo a mais no cadastro, e quem entra reserva sem digitar nada. Contra: opcional, com a reserva perguntando de novo |
| **D** | Entrar com o Google | **não no MVP**: e-mail e senha, como o KMP já preparou. O Google tira a senha e a confirmação, mas pede outro contrato com o KMP e outra configuração; o bilhete da 7.6 vai por e-mail do mesmo jeito. Volta à mesa se o uso pedir |

**Respostas do PO (2026-10-16):**

| # | resposta | o que fica |
|---|---|---|
| **A** | "foi combinado que haveriam dois domínios inicialmente: endereço de produção e API de homologação, faltando apenas configurar na Vercel"; o endereço `*.vercel.app` serve hoje aos dois, em desenvolvimento. A configuração pode ter ficado em outra máquina | **decidida em seguida, pela recomendação nova** (abaixo): a API atrás do site, em `/api` |
| **B** | "o e-mail com o domínio já está completamente configurado" | **decidida.** O domínio usa o **Google Workspace**, com SPF, DKIM e DMARC no ar (conferido no DNS em 2026-10-16). O site manda e-mail pelo próprio Workspace, de um apelido `naoresponda@`, sem provedor novo e sem custo de licença. Na implementação da 3.2, o PO cria o apelido e a senha de app |
| **C** | obrigatórios, "assim como na passagem": **nome completo, data de nascimento, tipo e número do documento, e-mail** (para a confirmação) e **celular** (para mandar as passagens) | **decidida.** Muda o contrato do KMP: a ADR-0022 dizia que a conta não era o passageiro e só tinha nome, e-mail e telefone (navegsistemas/fluviapp-kmp#70; a ordem é KMP, domain, API e site). O documento segue a O12: mascarado na tela, depois de gravado |
| **D** | aceita | **decidida:** e-mail e senha, sem o Google no MVP |

**E o bilhete, para a etapa 5** (PO, 2026-10-16): o celular serve, numa fase futura, para mandar a passagem pelo
WhatsApp, com automação. Como a automação custa tempo, **no MVP a passagem vai por e-mail, ou é baixada no site em PDF**.
Vale para a 5.6.

**O que se achou da A** (2026-10-16): `gruponaveg.com.br` e `www` estão no projeto do site na Vercel, mas **o DNS, no
Registro.br, ainda não aponta para a Vercel**: o endereço não abre. Não há `api.` nem `homologacao.`. O que falta é um
registro no Registro.br, e não na Vercel.

**A recomendação nova para a A:** **a API atrás do próprio site, em `/api`** (a Vercel repassa o pedido). Para o
navegador, o site e a API passam a ser o mesmo endereço, qualquer que seja ele, e o login funciona inclusive em
`*.vercel.app`. Com isso:

- **a U8 deixa de travar**: a homologação continua onde está, sem subdomínio;
- **a D4 encolhe**: a produção precisa só de `gruponaveg.com.br` apontado para a Vercel, e a API não ganha endereço
  público próprio;
- **o que conferir antes** (é de engenharia, na ADR-0003): que a API continue vendo o endereço de quem acessa, porque
  o limite de envios e o Turnstile dependem dele.

**Uma pergunta nova, que a C trouxe:**

| # | pergunta | recomendação |
|---|---|---|
| **E** | Uma conta por documento? | **sim, uma por documento**, como o passageiro (ADR-0023). Quem tenta outra conta com o mesmo documento lê a mesma frase que não revela nada: "Se já houver uma conta com estes dados, entre por ela ou use 'Esqueci a senha'." Contra: deixar repetir, e a análise de clientes contaria a mesma pessoa duas vezes |

**Decisões do PO (2026-10-16), em seguida:** **a A e a E pela recomendação** ("recomendações aceitas, pode começar").
A API vai para trás do site, em `/api`, e a conferência do endereço de quem acessa fica na ADR-0003 (naveg-api-vercel#30).
Uma conta por documento (fluviapp-kmp#70).

**A seguir:** a 3.1 (criar a conta), e as seções seguintes uma de cada vez.

### 3.1 — Criar a conta

**Situação:** **decidida** (2026-10-16): os campos, o texto da versão 3 e **A a F pela recomendação** ("perfeito,
recomendações aceitas"). A implementação espera o KMP (fluviapp-kmp#70), o domain e a API (naveg-api-vercel#30). **Wireframe** (privado do PO):
[3.1](https://claude.ai/artifact/WTLLEkH8cCHm6WX8CgA1Es), com o formulário, os erros e a passagem para a 3.2, no
celular e no computador.

**Levantamento** (2026-10-16): a tela não existe. O que ela precisa seguir, das decisões da área do cliente:
- **os campos**, todos obrigatórios (C): nome completo, nascimento, tipo e número do documento, e-mail e celular, mais a
  senha (D);
- **uma conta por documento**, com a frase que não revela nada (E);
- **o e-mail de confirmação** sai pelo Google Workspace (B);
- **a conta serve para comprar, não para reservar** (O6).

O que o site já tem e a tela reaproveita: o campo "Celular com WhatsApp" e a linha de privacidade da 2.3; o quadro de
aviso e o "Tentar de novo" da 2.6; o `TipoDocumento` do domain, com a máscara e a validação (CPF, CNPJ, RG, CNH e
passaporte).

**Achados:**

1. **A conta pede mais que a reserva**, que não pede documento. *Corrigido pelo PO (2026-10-16, abaixo): a passagem
   não sai necessariamente no nome de quem tem a conta, e a tela não explica o porquê;*
2. **o CNPJ está no `TipoDocumento`**, mas a conta é de pessoa;
3. **menores de idade:** com o nascimento obrigatório, a tela sabe a idade. Dado de criança e adolescente pede o
   consentimento de um responsável (LGPD, art. 14);
4. **os erros por campo** são novos no site (a reserva erra por passo). Eles aparecem embaixo do campo, e o foco vai
   ao primeiro com erro;
5. **a nota "já há registro seu"** (#57) fica de fora: ela espera a análise de LGPD.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | Onde fica o cadastro | **uma página própria**, `/conta/criar`, com o topo do site. Chega-se a ela por "Minha conta" → "Criar conta" e, depois, pela compra (3.5). Contra: uma janela sobre a página, que some ao recarregar |
| **B** | Uma página ou passos | **uma página, em dois grupos**: "Seus dados" e "Contato e acesso". São seis campos e a senha; cabem, e a pessoa vê de uma vez tudo o que vai informar. Contra: um campo por tela, com mais toques |
| **C** | A senha | **pelo menos 8 caracteres, sem regra de símbolo**, com "Mostrar" e **sem "repita a senha"**, porque o "Mostrar" faz esse papel. Senha muito comum ou vazada é recusada, com a frase dizendo por quê |
| **D** | A idade mínima | **18 anos.** Menores viajam com a passagem comprada por um adulto, como no balcão |
| **E** | Os tipos de documento | **CPF** (já escolhido), **RG, CNH e Passaporte**; o CNPJ sai. O passaporte cobre o estrangeiro |
| **F** | Os termos e a privacidade | **uma frase acima do botão**, com os dois links, **sem caixa de marcar** e sem autorização para propaganda. A seção da conta na política entra junto, com versão nova (U7) |

**A ordem:** a tela só vai ao ar depois do KMP (fluviapp-kmp#70), do domain e da API (naveg-api-vercel#30). A decisão
pode vir antes; a implementação espera.

**Implementada em 2026-10-23** (`/conta/criar`), depois da API (naveg-api-vercel#46 a #56, no ar) e da política 1.3 (a
seção da conta, #109). Duas mudanças desde o wireframe, das decisões que vieram depois dele:

- **sem o documento:** ele saiu do cadastro e entra na primeira compra (PO, 2026-10-19; fluviapp-kmp, ADR-0022 D6). Os
  "Seus dados" ficam com o nome e o nascimento; a linha de apoio do grupo continua, porque fala da compra para outra
  pessoa;
- **sem o quadro "Se já houver uma conta com estes dados…":** desde 2026-10-21 o cadastro responde sempre "Confira seu
  e-mail", com conta nova ou não, e a diferença vai pelo e-mail (naveg-api-vercel#46).

O "Já tem conta? Entrar" entra com a 3.3, quando a página de entrar existir. Depois de criar, a tela mostra "Confira seu
e-mail" com o endereço; o resto dessa tela (o reenviar, o corrigir) é a 3.2.

**O PO sobre o wireframe (2026-10-16):** "gostei dos campos, mas não precisa do texto de suporte". E o porquê:

- **os dados da conta são do cadastro de quem tem a conta, e não da passagem.** O cliente compra uma passagem para
  outra pessoa, desde que tenha em mãos o documento e a data de nascimento dela. Os dados de quem viaja são pedidos na
  compra (5.3, com a O14);
- **o e-mail e o celular são dados de contato**;
- **na área do cliente, ele também reserva veículo e encomenda**, que seguem para o atendimento, como a reserva da
  página. Isso entra na 4.1 (Minha conta) e na etapa 5.

**Wireframe, versão 2:** sem o texto de apoio. **Versão 3**, a pedido do PO no mesmo dia ("achei melhor com o texto,
porém pode ter a informação extra que eu dei, e resumida"): uma linha de abertura e uma de apoio por grupo, nenhuma
embaixo de campo:

- **abertura:** "Com a conta, você compra passagens para você ou para outra pessoa, e reserva veículos e encomendas com o
  atendimento.";
- **Seus dados:** "Para comprar para outra pessoa, basta ter o documento e a data de nascimento dela.";
- **Contato e acesso:** "O e-mail confirma a conta. Por ele e pelo celular, falamos com você sobre seus pedidos."


### 3.2 — Confirmar o e-mail

**Situação:** **decidida** (2026-10-16): **A a F pela recomendação** ("recomendações aceitas"). A F virou a
naveg-api-vercel#43. A implementação espera o KMP, o domain e a API, como a 3.1. **Wireframe** (privado do PO):
[3.2](https://claude.ai/artifact/D7H3ptFWbr2dDrGAUDqgGq): a tela "Confira seu e-mail", o reenvio, a correção do e-mail,
o próprio e-mail, o link confirmado e o link que não vale mais.

**Levantamento** (2026-10-16): a tela não existe, e nenhum dos três repositórios manda e-mail. O que já está decidido:
- **comprar pede o e-mail confirmado (O6)**; reservar não pede conta;
- **o e-mail sai pelo Google Workspace**, de `naoresponda@gruponaveg.com.br` (B da área do cliente);
- **o KMP guarda `confirmadaEm`** na conta, e o código de confirmação em `segredos/`, que só o servidor lê (ADR-0022);
- **quem volta do link cai na compra**, e não no começo (U3).

**Achados:**

1. **o e-mail é aberto, muitas vezes, em outro aparelho** ou no aplicativo de e-mail. O link precisa funcionar fora do
   navegador em que a conta foi criada. Por isso a volta à compra (U3) depende de o pedido estar guardado no servidor,
   e não só no navegador;
2. **quem errou o e-mail fica preso:** com uma conta por documento (E), não dá para criar outra. A tela precisa deixar
   corrigir;
3. **a conta que nunca confirma** guarda documento e nascimento sem uso. É dado pessoal parado, e prende o documento;
4. **o e-mail cai no spam** às vezes, mesmo com SPF e DKIM. A tela diz onde procurar;
5. **"Reenviar" sem freio** vira abuso, e o Workspace tem limite de envios por dia.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | Link ou código | **um link no e-mail**, de um toque, que funciona em qualquer aparelho. Contra: um código de 6 números para digitar no site |
| **B** | Quanto tempo o link vale | **24 horas**, e o "Reenviar" a cada 60 segundos, com um limite por hora. O link novo invalida o anterior |
| **C** | Depois de confirmar | **a pessoa já fica dentro da conta** e volta para onde ia: a compra (U3) ou Minha conta, com o aviso "E-mail confirmado". Contra: pedir a senha de novo |
| **D** | Entrar antes de confirmar | **pode**, com o aviso "Confirme seu e-mail para comprar" em Minha conta e na hora de pagar. Só a compra espera |
| **E** | Errou o e-mail | **"Corrigir o e-mail"** na tela de espera, enquanto ele não foi confirmado; o link do e-mail antigo deixa de valer |
| **F** | A conta que nunca confirma | **apagada sozinha depois de 7 dias**, e o documento fica livre. Pede a API (uma tarefa agendada, como a #21) e conta no resumo do painel |

**A ordem:** como a 3.1, a implementação espera o KMP (fluviapp-kmp#70), o domain e a API (naveg-api-vercel#30). O
PO cria o apelido `naoresponda@` e a senha de app quando a API for mandar o primeiro e-mail.

**Implementada em 2026-10-23:** "Confira seu e-mail" depois de criar a conta, com o "Reenviar" a cada 60 segundos (a
contagem no botão, o aviso "Enviamos de novo"), e a página do link, `/conta/confirmar`: confirmado, já confirmado,
vencido e "não vale mais" (os dois pedem um link novo pelo e-mail da conta), e a falha de conexão. O código sai do
endereço assim que a página o lê. O que mudou desde o wireframe:

- **o "Corrigir o e-mail" (E) espera a 3.3.** Desde 2026-10-21 o cadastro não entra na conta, e corrigir pede entrar com
  a senha antes ("errou o e-mail", nas regras da conta). A API já tem a troca (naveg-api-vercel#55); a tela entra quando
  o entrar existir;
- **depois de confirmar, o destino é Minha conta (4.1)**; até ela existir, a tela confirma e oferece "Reservar agora";
- **o link é `/conta/confirmar#…`**, e não `?c=…`: o que vem depois do `#` não chega ao servidor nem aos logs
  (ADR-0003, seção 3).

### 3.3 — Entrar e sair

**Situação:** **decidida** (2026-10-16): **A a F pela recomendação** ("as recomendações foram aceitas"). A implementação
espera o KMP, o domain e a API, como a 3.1. **Wireframe** (privado do PO):
[3.3](https://claude.ai/artifact/LNG8wmYhfbS7RTtzRyLesb): entrar, entrar vindo da compra, o erro, as tentativas demais,
a conta desativada, o menu com "Minha conta" e o sair.

**Levantamento** (2026-10-16): a tela não existe. O que já está decidido:
- **e-mail e senha**, sem o Google (D da área do cliente);
- **"Minha conta" é um item fixo do menu** (1.1, D): ele não troca para "Entrar", para não pedir JavaScript em toda
  página;
- **a API recusa a conta desativada** pelo Supervisor (naveg-api-vercel#30) e tem Turnstile e limite por endereço de
  rede no entrar (plano da venda online);
- **as respostas não revelam se um e-mail tem conta**;
- **entrar antes de confirmar o e-mail** é permitido (3.2, D);
- **a sessão é um cookie do próprio site**, com a API em `/api` (A da área do cliente). A forma vai na ADR-0003.

**Achados:**

1. **o celular é o aparelho de quem compra**, e digitar a senha a cada visita afasta. Mas o celular também é emprestado:
   o sair precisa ser fácil de achar e de conferir;
2. **o limite por endereço de rede não basta** contra quem tenta senhas de uma conta só, de vários endereços. O freio
   precisa ser também por e-mail;
3. **a conta desativada** precisa de uma frase própria e da saída para o WhatsApp; antes da senha certa, ela não pode se
   distinguir de um e-mail sem conta;
4. **quem chega da compra** (U3) precisa saber por que está entrando, e voltar para ela.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | Quanto tempo fica dentro | **30 dias no mesmo aparelho**, renovados a cada uso, sem a caixa "lembrar de mim". Trocar a senha (3.4) tira a conta de todos os aparelhos |
| **B** | A frase do erro | **"E-mail ou senha não conferem"**, a mesma nos dois casos |
| **C** | Muitas tentativas | **5 erros seguidos no mesmo e-mail → 15 minutos de espera**, com o "Esqueci a senha" liberado; e o limite por endereço de rede, que já existe |
| **D** | Onde fica o "Sair" | **no fim de Minha conta**; o menu não muda. "Sair de todos os aparelhos" fica para depois do MVP |
| **E** | Depois de entrar | **volta para onde a pessoa ia**: a compra (U3), a opinião (1.6), ou Minha conta |
| **F** | A conta desativada | **"Esta conta está desativada"**, com o WhatsApp e a reserva sem conta, **só depois da senha certa** |

**A revista pelo PO (2026-10-21):** **14 dias**, e não 30, ainda renovados a cada uso ("alinhe as sessões em 14", o
teto da sessão do Firebase; ADR-0003).

**A ordem:** como a 3.1 e a 3.2. O freio por e-mail (C) e a sessão de 14 dias (A) são da API (naveg-api-vercel#30,
ADR-0003).

**Implementada em 2026-10-23**, na página `/conta` (o lugar da 3.5, A): a página pergunta à API quem está dentro e
mostra o entrar ou a conta. Entrar com e-mail e senha ("Mostrar"); a frase única da B; a espera da C; a conta desativada
da F, só com a senha certa; e o "Sair" no fim, com "Você saiu da sua conta neste aparelho". O "Já tem conta? Entrar"
da 3.1 leva para cá. O que mudou desde o wireframe, ou espera outra seção:

- **a verificação contra robô é visível**, acima do botão, como no cadastro e na reserva desde a 2.8 (2026-10-21); o
  wireframe, de antes, a dizia invisível;
- **o "Esqueci a senha" entra com a 3.4**, para não levar a uma página que ainda não existe;
- **dentro, até a 4.1**, o miolo diz que a pessoa está na conta, com o aviso "Confirme seu e-mail para comprar" (3.2,
  D) e o "Reservar agora"; a 4.1 põe Minha conta no lugar;
- **a volta para onde a pessoa ia** (E) espera a compra (U3) e a opinião (1.6).

### 3.6 — Resgatar a reserva (retirada: vira um convite na 3.5)

**Situação:** **retirada pelo PO no mesmo dia (2026-10-16)**: "esquece, não resgata reserva, só indica que pode emitir e
embarcar direto com o cadastro". A reserva feita sem conta continua sem dono, e nada muda no KMP nem na API. O que fica
é **um convite na conclusão da reserva da página**, desenhado na **3.5** (onde se entra), com duas perguntas que vão
para lá:

- **quando entra:** a recomendação é **junto com a compra online (7.6)**. Antes dela, o convite prometeria uma emissão
  que o site ainda não faz;
- **o texto:** algo como "Com uma conta, você compra a passagem aqui no site, confirma no balcão em segundos e embarca.",
  com "Criar conta". Ele não aparece no quiosque (U5).

O registro abaixo é o da análise do pedido de antes, mantido para o histórico.

**O pedido de antes:** "acrescentar ao final da reserva deslogada a possibilidade de resgatar a reserva
e emitir a passagem se cadastrando".

**O que existe hoje:** a conclusão da reserva da página (2.5, no ar) mostra o código, "Copiar" e o WhatsApp como o passo
que falta. A reserva não tem dono: ela guarda o nome e o celular de quem reservou, e o código. O quiosque não tem conta
(U5).

**Achados:**

1. **"Emitir" pela internet é a compra (7.6)**, que ainda não existe, e que no MVP cobre só **passageiro, em rede, com
   preço na tabela**. Veículo, encomenda, as outras acomodações e a saída sem preço seguem com o atendimento. Antes da
   7.6, resgatar só pode **guardar a reserva na conta**;
2. **a prova de que a reserva é da pessoa:** o código sozinho não serve, porque ele vai no WhatsApp e pode ser visto
   por outros. Quem tiver o código tomaria a reserva, e os dados de quem reservou;
3. **a reserva no painel muda de figura:** o atendente precisa ver que ela está numa conta. Se ele já converteu a
   reserva em passagem no balcão, o site não pode deixar pagar de novo;
4. **o nome de quem reservou pode não ser o da conta**, e quem viaja pode ser outra pessoa (3.1). Na compra, os dados
   de quem viaja são pedidos como em qualquer compra (5.3, com a O14).

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | Quando o convite aparece | **na conclusão de toda reserva da página**: "Guarde esta reserva na sua conta", com "Criar conta" e "Entrar". **"Emitir a passagem"** só onde a compra cobre (passageiro em rede com preço); nas outras, a reserva fica na conta e segue com o atendimento. O quiosque não mostra (U5) |
| **B** | A prova de que é dela | **só no mesmo aparelho**, logo depois de reservar: a API entrega, junto com o código, um comprovante que fica guardado no navegador até a saída do barco. Sem ele, não há resgate, nem pelo código digitado |
| **C** | Antes da compra online | **resgatar entra com a área do cliente**: a reserva aparece em Minha conta, com o código e o WhatsApp. **Emitir entra com a 7.6**, a partir dessa mesma reserva, sem escolher a saída de novo |
| **D** | No painel | **a reserva ganha o vínculo com a conta**, e o atendente vê "reserva de cliente com conta". Se ela já foi convertida no balcão, o site mostra a passagem como emitida e não oferece pagar. Pede o KMP e a API (issues depois da decisão) |

### 3.4 — Esqueci a senha

**Situação:** **decidida** (2026-10-16): **A a F pela recomendação** ("recomendações aceitas"). A implementação espera
o KMP, o domain e a API, como a 3.1. **Wireframe** (privado do PO):
[3.4](https://claude.ai/artifact/WdKaLFHigKz3vY4Tffbst6): pedir o link, "Confira seu e-mail", o e-mail, a senha nova, a
senha trocada e o link que não vale mais.

**Levantamento** (2026-10-16): a tela não existe. O que já está decidido: o e-mail pelo Google Workspace (B da área do
cliente); respostas que não revelam se um e-mail tem conta; a senha de pelo menos 8 caracteres, com "Mostrar" (3.1, C);
trocar a senha tira a conta de todos os aparelhos (3.3, A); o "Esqueci a senha" liberado mesmo depois de tentativas
demais (3.3, C). O formato do e-mail é o da 3.2.

**Achados:**

1. **o link de troca dá acesso à conta**: precisa valer menos tempo que o da confirmação, e uma vez só;
2. **quem não lembra o e-mail da conta** não tem como recuperar pelo site; a saída é o atendimento, que vê as contas no
   painel;
3. **a troca feita por outra pessoa** (alguém com acesso ao e-mail) só é percebida se a conta avisar;
4. **a conta sem e-mail confirmado** pede o link de troca: abrir o link prova que a pessoa recebe naquele e-mail;
5. **a conta desativada** não pode trocar a senha e entrar, mas a tela de pedir não pode revelar que ela existe.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | Quanto tempo o link vale | **1 hora, e uma vez só**; o link novo invalida o anterior |
| **B** | A resposta ao pedido | **"Se houver uma conta com este e-mail, o link chega em instantes"**, sempre a mesma |
| **C** | Depois de trocar | **a pessoa já fica dentro da conta neste aparelho**, e sai dos outros |
| **D** | O aviso da troca | **um e-mail "Sua senha foi trocada"**, com a hora e o WhatsApp para quem não reconhece a troca |
| **E** | A conta sem e-mail confirmado | **o link também confirma o e-mail** |
| **F** | A conta desativada | **a tela responde igual** (B), e o e-mail que chega diz que a conta está desativada, com o WhatsApp, sem link de troca |

**A ordem:** como a 3.1 a 3.3. O link, o aviso e o freio são da API (naveg-api-vercel#30).

**Implementada em 2026-10-23:** o "Esqueci a senha" ao lado do rótulo da senha, no entrar (o e-mail digitado vai junto,
pela aba, e não pelo endereço); `/conta/esqueci`, com a resposta que não revela nada e o "Mandar de novo" de 60
segundos; e `/conta/nova-senha`, o link do e-mail: a senha nova com "Mostrar", "Senha trocada" (já dentro, fora dos
outros aparelhos), "Este link não vale mais" (um texto para vencido, usado e trocado) e a conta desativada. O que mudou
desde o wireframe:

- **sem a verificação contra robô no pedido do link:** a API não a pede (naveg-api-vercel#51). O freio é o limite por
  endereço de rede e, por e-mail, um pedido por minuto e 5 por hora; e a resposta é sempre a mesma;
- **sem o "Para a conta maria@…" na senha nova:** a API só diz de quem é a conta depois da troca, e o link não leva o
  e-mail;
- **o link é `/conta/nova-senha#…`**, e não `/conta/senha?c=…`, como o da confirmação (ADR-0003, seção 3).

### As regras da conta (3.1 a 4.2, decididas em 2026-10-16)

**Para que serve:** a especificação, num lugar só, do que o PO decidiu para a conta do cliente, para a API
(naveg-api-vercel#30, #43) e o painel (fluviapp-kmp#70, #71) implementarem igual. O PO pediu "tudo isso documentado"
(2026-10-16). As fichas acima guardam o porquê de cada uma; aqui fica só a regra.

**A conta**

| regra | decisão | de onde |
|---|---|---|
| para que serve | comprar passagens, para si ou para outra pessoa (com o documento e o nascimento dela), e reservar veículos e encomendas com o atendimento. Reservar pela página continua sem conta | O6; 3.1 |
| os campos, todos obrigatórios | nome completo, data de nascimento, tipo e número do documento, e-mail e celular com WhatsApp, e a senha | C da área do cliente |
| os documentos | CPF (o padrão), RG, CNH e Passaporte; sem CNPJ | 3.1, E |
| uma conta por documento | sim; a frase não revela se já existe: "Se já houver uma conta com estes dados, entre por ela ou use 'Esqueci a senha'." | E da área do cliente |
| uma conta por e-mail | sim, e **o cadastro não revela se o e-mail já tem conta**: a resposta é sempre "Confira seu e-mail". O e-mail novo recebe o link de confirmação; o dono do e-mail já usado, "Alguém tentou criar uma conta com este e-mail. Se foi você, entre ou use 'Esqueci a senha'." (PO, 2026-10-21: "Não revelar") | naveg-api-vercel#46 |
| a idade mínima | 18 anos | 3.1, D |
| a senha | pelo menos 8 caracteres, sem regra de símbolo, com "Mostrar" e sem "repita a senha"; senha muito comum ou vazada é recusada, com o motivo | 3.1, C |
| os termos | uma frase acima do botão, com os links dos Termos e da Política, sem caixa de marcar e sem autorização para propaganda | 3.1, F |
| entrar | e-mail e senha; sem o Google | D da área do cliente |
| o endereço | a API atrás do site, em `/api`; a sessão é um cookie do próprio site | A da área do cliente |
| o e-mail que o site manda | pelo Google Workspace, de `naoresponda@gruponaveg.com.br`; as respostas vão ao `contato@` | B da área do cliente |
| a passagem, no MVP | por e-mail, ou em PDF baixado no site; pelo WhatsApp, numa fase futura | C da área do cliente |
| a reserva feita sem conta | não é resgatada; a conclusão ganha o convite "Com uma conta, você compra a passagem aqui no site, confirma no balcão em segundos e embarca.", no ar junto com a compra | 3.6, retirada; 3.5, E |

**Os prazos e os limites**

| o quê | valor | de onde |
|---|---|---|
| o link de confirmação do e-mail | 24 horas; o novo invalida o anterior | 3.2, B |
| o link de troca de senha | 1 hora, e uma vez só; o novo invalida o anterior | 3.4, A |
| reenviar um link | a cada 60 segundos, com um limite por hora | 3.2, B |
| a conta que nunca confirma | apagada sozinha depois de 7 dias, e o documento fica livre | 3.2, F (naveg-api-vercel#43) |
| ficar dentro da conta | 14 dias no mesmo aparelho, renovados a cada uso (era 30; PO, 2026-10-21) | 3.3, A; ADR-0003 |
| tentativas de entrar | 5 erros seguidos no mesmo e-mail → 15 minutos de espera; e o limite por endereço de rede | 3.3, C |

**O que acontece em cada caso**

| caso | o que o site faz | de onde |
|---|---|---|
| criou a conta | "Confira seu e-mail". A pessoa **não** fica dentro: entra pelo link (3.2, C) ou com a senha (3.2, D). Era "já está dentro"; mudou porque só a conta nova entraria direto, e isso diria a quem testa um e-mail que ele já é cliente (PO, 2026-10-21) | 3.2, D; naveg-api-vercel#46 |
| entrou sem confirmar | entra; o aviso "Confirme seu e-mail para comprar" em Minha conta e na hora de pagar | 3.2, D |
| confirmou pelo link | fica dentro da conta no aparelho em que abriu o link, e volta para onde ia | 3.2, C |
| errou o e-mail | "Corrigir o e-mail", enquanto não confirmou. Como o cadastro não entra na conta, a pessoa entra com a senha antes de corrigir: sem isso, qualquer um trocaria o e-mail de qualquer conta | 3.2, E |
| e-mail ou senha errados | "E-mail ou senha não conferem", a mesma frase nos dois casos | 3.3, B |
| conta desativada | "Esta conta está desativada", com o WhatsApp, **só depois da senha certa** | 3.3, F |
| entrou | volta para onde ia: a compra, a opinião, ou Minha conta | 3.3, E |
| sair | no fim de Minha conta; o menu não muda | 3.3, D |
| esqueceu a senha | "Se houver uma conta com este e-mail, o link chega em instantes", sempre a mesma | 3.4, B |
| trocou a senha | fica dentro neste aparelho, sai dos outros, e recebe o e-mail "Sua senha foi trocada" | 3.4, C e D |
| pediu troca sem ter confirmado | o link de troca também confirma o e-mail | 3.4, E |
| pediu troca com a conta desativada | a mesma resposta na tela; o e-mail diz que a conta está desativada, sem link | 3.4, F |

**Onde se entra, Minha conta e Meus dados**

| regra | decisão | de onde |
|---|---|---|
| "Minha conta" no topo | item fixo do menu, igual para todos; no celular, o último item, separado; no computador, no fim do menu, com o desenho de uma pessoa. Se não couber no tablet em pé, o menu recolhe até 50rem | 1.1, D; 3.5, B e C |
| quem não entrou e toca em "Minha conta" | a página da conta mostra o entrar (3.3), com "Criar conta" | 3.5, A |
| o nome de quem entrou | em Minha conta, não no topo | 3.5, F |
| o convite na hora de pagar | "Para comprar, entre na sua conta": "Entrar" primeiro, "Criar conta", e "Prefere não criar conta? Reservar"; a escolha fica guardada | 3.5, D; U3 |
| Minha conta, primeiro | "Olá, (nome)" e as ações: reservar passagem, reservar veículo, enviar encomenda. Com a compra, "Comprar passagem" vira a primeira ação | 4.1, A e E |
| a reserva feita com a conta | o nome e o celular já vão preenchidos, e podem ser mudados naquela reserva | 4.1, B |
| as reservas da conta | não são listadas antes da compra; Meus pedidos (4.3) chega com ela | 4.1, C |
| os dados em Minha conta | um resumo (e-mail, celular, documento mascarado), com "Ver e corrigir" | 4.1, D |
| a opinião (1.6) | um atalho em Minha conta, quando a 1.6 existir | 4.1, F |
| o que a pessoa corrige | o nome e o celular, com "Salvar alterações". O nascimento e o documento, só pelo atendimento (painel) | 4.2, A e F |
| trocar o e-mail | com a senha atual; o novo só vale depois de confirmado pelo link (24 horas), e o antigo recebe um aviso. Se o novo já for de outra conta, a resposta é a mesma | 4.2, B |
| trocar a senha | com a senha atual; a conta sai dos outros aparelhos, e chega o aviso da troca | 4.2, C |
| o documento na tela | sempre mascarado, inclusive para o dono | 4.2, D; O12 |
| apagar a conta | num passo próprio, com o que sai e o que fica escrito antes e a senha para confirmar; vale na hora, a conta sai de todos os aparelhos e o documento fica livre. As passagens ficam | 4.2, E; O7 |

**As anormalidades que o painel sana** (PO, 2026-10-16: "anormalidades devem ser capazes de serem sanadas pelo
backend"). Detalhe e forma em navegsistemas/fluviapp-kmp#71:

1. não lembra o e-mail da conta → achar a conta pelo documento e mostrar o e-mail mascarado;
2. perdeu o acesso ao e-mail → corrigir o e-mail, conferida a pessoa, e mandar a confirmação ao novo;
3. o e-mail não chega → reenviar o link e ver o último envio (marcar como confirmado à mão, não);
4. bloqueada por tentativas → liberar;
5. alguém entrou na conta → tirar de todos os aparelhos e mandar o link de troca, ou desativar;
6. documento preso → apagar a conta não confirmada antes dos 7 dias;
7. dado do cadastro errado → o Supervisor corrige o que o Meus dados (4.2) não corrigir;
8. pedido de apagar a conta → apagar pelo painel (O7);
9. conta desativada → reativar (já existe).

Cada ação do painel fica registrada: quem fez, quando e o quê. **A conta não vai ao ar sem os remédios 1 a 5.**

### 3.5 — Onde se entra

**Situação:** **decidida** (2026-10-16): **A a F pela recomendação** ("recomendações aceitas"). Na E, o PO corrigiu o
texto: "nesse embarca direto, me expressei mal, melhor um 'confirma no balcão em segundos e embarca'". O convite fica
"Com uma conta, você compra a passagem aqui no site, confirma no balcão em segundos e embarca." **Para a etapa 5:** a
passagem comprada pelo site ainda passa pelo balcão, numa conferência rápida (o bilhete e o QR, 5.6), e não vai direto
ao barco. **Wireframe** (privado do PO):
[3.5](https://claude.ai/artifact/GYSnUUPhVRWTavWb8Mu1dK): o "Minha conta" no menu do celular e do computador, a página
da conta para quem não entrou, o convite na hora de pagar e o convite na conclusão da reserva.

**Levantamento** (2026-10-16, o `Topo.astro` e as fichas): o topo tem quatro itens (Encomendas, Atendentes, Social,
Contato) e "Reservar agora"; abaixo de 44rem, o menu recolhe num `<details>`. A barra presa do celular tem três coisas
(logo, botão, menu). **"Minha conta" é um item fixo** (1.1, D), sem JavaScript para trocar o rótulo. A U3 pede a conta
na hora de pagar, com a escolha guardada. O PO trocou o resgate da reserva por **um convite na conclusão** (3.6).

**Achados:**

1. **a barra presa do celular não comporta um quarto elemento** em 360px: "Minha conta" vai para dentro do menu;
2. **com cinco itens, o tablet em pé (768px) pode não caber numa linha**, o defeito que a 1.1 resolveu. Medir na
   implementação; se não couber, o menu recolhe até 50rem;
3. **"Minha conta" para quem não entrou** leva a uma página que precisa mostrar o entrar, sem um salto de endereço que
   pisca ou se perde sem JavaScript;
4. **na hora de pagar, quem já tem conta é quem volta a comprar**: "Entrar" vem antes de "Criar conta". A reserva sem
   conta continua como saída (O11);
5. **o convite na conclusão não pode competir com o WhatsApp**, que é o passo que confirma a reserva (2.5), nem prometer
   a compra antes de ela existir.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | O que "Minha conta" abre para quem não entrou | **a tela de entrar (3.3), na própria página da conta**, com "Criar conta"; depois de entrar, a mesma página vira Minha conta |
| **B** | No celular | **o último item do menu, separado**, com o desenho de uma pessoa; a barra presa não muda |
| **C** | No computador e no tablet | **no fim do menu, com o desenho de uma pessoa**, antes de "Reservar agora"; se não couber no tablet em pé, o menu recolhe até 50rem |
| **D** | O convite na hora de pagar | **"Para comprar, entre na sua conta"**, com "Entrar" primeiro, "Criar conta", e "Prefere não criar conta? Reservar"; a escolha fica guardada |
| **E** | O convite na conclusão da reserva | **uma linha e um link embaixo do passo do WhatsApp**: "Com uma conta, você compra a passagem aqui no site, confirma no balcão em segundos e embarca." Só na página, e **só quando a compra existir** |
| **F** | O nome de quem entrou no topo | **não**: o topo é igual para todos (1.1, D); o nome aparece em Minha conta |

**A ordem:** o item do topo e a página da conta entram com a conta (depois do KMP, do domain e da API). Os convites D
e E entram com a compra (7.6).

### 4.1 — Minha conta

**Situação:** **decidida** (2026-10-16): **A a F pela recomendação** ("perfeito, recomendações aceitas"). **Wireframe** (privado do PO): [4.1](https://claude.ai/artifact/XLfUjZVFKWRY29w95cqUf2): a conta antes
da compra, no celular e no computador; o e-mail sem confirmar; e o lugar da compra e de Meus pedidos, quando
existirem.

**Levantamento** (2026-10-16): a página não existe. O que já está decidido:
- **é o lugar para onde "Minha conta" leva** (3.5, A); para quem não entrou, a mesma página mostra o entrar;
- **com a conta, o cliente compra passagens** para si ou para outra pessoa, e **reserva veículos e encomendas** com o
  atendimento (3.1);
- **o aviso "Confirme seu e-mail para comprar"** fica aqui (3.2, D), e o **"Sair" no fim** (3.3, D);
- **o nome de quem entrou** aparece aqui, e não no topo (3.5, F);
- **o documento aparece mascarado** (O12), como no painel.

**Achados:**

1. **antes da compra pelo site, a conta serve para reservar**: o que a pessoa veio fazer é reservar, e é isso que
   deve vir primeiro;
2. **a reserva com conta pode vir preenchida** com o nome e o celular: é o primeiro ganho visível da conta (achado 1 da
   área do cliente);
3. **listar as reservas feitas com a conta** pede que a reserva guarde a conta, uma mudança no KMP e na API que o PO
   recusou para a reserva sem conta (3.6). Sem a lista, a conta não tem histórico até a compra;
4. **a compra (7.6) e Meus pedidos (4.3) precisam de lugar** na página desde já, para a página não ser refeita.

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | O que aparece primeiro | **"Olá, Maria" e as ações**: reservar passagem, reservar veículo, enviar encomenda; os dados depois, num resumo |
| **B** | A reserva feita com a conta | **o nome e o celular já vão preenchidos**, e podem ser mudados naquela reserva; o resto do caminho é o da página |
| **C** | As reservas feitas com a conta aparecem aqui? | **não antes da compra**: a reserva segue com o código e o WhatsApp; Meus pedidos (4.3) chega com a compra |
| **D** | Os dados na Minha conta | **um resumo** (e-mail, celular, documento mascarado), com "Ver e corrigir" para Meus dados (4.2) |
| **E** | Comprar, quando existir | **vira a primeira ação**, com "pague pelo site, confirme no balcão em segundos e embarque"; antes da 7.6, não aparece |
| **F** | Deixe sua opinião (1.6) | **um atalho aqui também**, quando a 1.6 existir |

**A ordem:** como o cadastro, depois do KMP, do domain e da API. A reserva preenchida (B) é só da página.

### 4.2 — Meus dados

**Situação:** **decidida** (2026-10-16): **A a F pela recomendação** ("perfeito, recomendações aceitas, pode
documentar"). Com ela, **a área do cliente está toda desenhada e decidida**; as regras estão juntas em "As regras da
conta". **Wireframe** (privado do PO): [4.2](https://claude.ai/artifact/8GtC5KXTQpFxiDjsRwXSn8): os dados,
trocar o e-mail, trocar a senha, apagar a conta e a conta apagada.

**Levantamento** (2026-10-16): a página não existe. O que já está decidido:
- **chega-se por "Ver e corrigir"** em Minha conta (4.1, D);
- **o documento inteiro não volta à tela** depois de gravado (O12);
- **apagar a conta tira os dados, e as passagens ficam** (O7);
- **o KMP previa que o Meus dados corrigisse o nome e o telefone** (ADR-0022; naveg-api-vercel#30). A conta ganhou
  nascimento e documento depois (fluviapp-kmp#70);
- **o que a pessoa não corrige, o atendimento corrige pelo painel** (fluviapp-kmp#71, item 7);
- **a troca de senha** segue a 3.4: tira a conta dos outros aparelhos e manda o aviso.

**Achados:**

1. **o documento faz a conta ser uma por pessoa** (E da área do cliente): se a pessoa pudesse trocá-lo, uma conta
   tomaria o documento de outra;
2. **trocar o e-mail muda o acesso à conta**: precisa da senha atual, da confirmação do e-mail novo e de um aviso ao
   antigo, ou quem pegar o celular desbloqueado leva a conta;
3. **apagar é para sempre**: a página precisa dizer o que sai e o que fica antes de pedir a confirmação;
4. **o botão de apagar não pode ter a cor da ação principal** (o laranja).

**Perguntas para o PO, com a recomendação:**

| # | pergunta | recomendação |
|---|---|---|
| **A** | O que a pessoa corrige sozinha | **o nome e o celular**; o nascimento e o documento, só pelo atendimento |
| **B** | Trocar o e-mail | **com a senha atual e o link ao e-mail novo**; o novo só vale depois de confirmado, e o antigo recebe um aviso |
| **C** | Trocar a senha | **com a senha atual**; a conta sai dos outros aparelhos, e chega o aviso da troca |
| **D** | O documento na tela | **sempre mascarado, inclusive para o dono** (O12) |
| **E** | Apagar a conta | **num passo próprio**, com o que sai e o que fica escrito antes e a senha para confirmar; vale na hora, e o documento fica livre |
| **F** | Como salvar | **um "Salvar alterações" para o nome e o celular**; o e-mail, a senha e o apagar, cada um no seu passo |

**A ordem:** como o cadastro, depois do KMP, do domain e da API. Trocar o e-mail e apagar a conta são da API
(naveg-api-vercel#30).

**A ordem de implementação da área do cliente** (a regra de sempre: KMP, domain, API e site):

1. **KMP:** as chaves novas da conta e o índice do documento (fluviapp-kmp#70); os remédios do painel, ao menos os
   itens 1 a 5 (fluviapp-kmp#71);
2. **`@navegsistemas/domain`** (naveg-front): a conta, as validações dos campos (nascimento, documento, idade mínima,
   senha) e as frases, com versão e tag;
3. **API:** a conta (naveg-api-vercel#30), com a ADR-0003 (a sessão, e a API atrás do site, em `/api`, conferindo que
   o limite por endereço de rede e o Turnstile continuam vendo quem acessa); o envio pelo Google Workspace; a conta que
   nunca confirma (#43). **O PO cria o apelido `naoresponda@` e a senha de app** quando o primeiro e-mail for sair;
4. **site:** a política de privacidade com a seção da conta (U7, versão nova); as telas da 3.1 à 4.2, com o E2E e o axe
   de cada estado desenhado; o "Minha conta" no topo; a reserva preenchida para quem entrou;
5. **o aceite do PO na homologação**, no celular, com os remédios do painel testados de verdade.

Os convites da compra (3.5, D e E), "Comprar passagem" (4.1, E) e Meus pedidos (4.3) entram com a compra (7.6).
