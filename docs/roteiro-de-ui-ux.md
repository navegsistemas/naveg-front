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
| **1 — As seções vigentes** | 1.1 a 1.9 | **1.1 no ar** (#43) e **1.2 no ar** (#45), conferidas pelo PO no celular (2026-10-15); **1.3 no ar** (#49, o calendário; as cidades da rota desde o #59); as outras, a começar |
| **2 — Melhorias na reserva** | 2.1 a 2.7 | **2.2 no ar** (#62, #68, #69; aceite do PO em 2026-10-15); **2.7 no ar** (#72, 2026-10-16; a encomenda no mesmo caminho, com a #58); **2.3 no ar** (#75, 2026-10-16; o celular obrigatório na página); **2.1 sem mudança** (o calendário da 1.3 cobriu); **2.4 no ar** (#77, 2026-10-16; a conferência), **com a 2.5** (a conclusão) junto, a pedido do PO; **2.6 decidida e em PR** (os erros, e o texto do WhatsApp; 2026-10-16) |
| **3 — O cadastro** | 3.1 a 3.5 | **em análise** (2026-10-16): o levantamento da área do cliente, inteira, e quatro perguntas que vêm antes das telas; depois, uma seção por vez, a começar pela 3.1 |
| **4 — As páginas do cliente** | 4.1 a 4.4 | 4.1 e 4.2 no levantamento da área do cliente; 4.3 e 4.4 vêm com a compra |
| **5 — A compra e a emissão online** | 5.1 a 5.8 | a começar |

**Antes do roteiro:** o endurecimento (13.1 a 13.6), que não muda nenhuma tela. **Em paralelo:** as
entregas do KMP (7.2, 7.3, 7.5). O roteiro anda no ritmo das decisões do PO, não no do código.

### A ordem até o MVP (PO, 2026-10-16)

O PO conferiu a ordem contra o caminho do MVP: **a partir do cadastro, o site deixa de ser uma página só**. Ele passa a
ter a área do cliente, e o topo passa a dizer se a pessoa está logada ou não. A ordem:

1. **2.4, a conferência**; depois **2.5, a conclusão**, e **2.6, os erros**: duas seções curtas, porque os erros já
   acontecem no ar e a reserva continua sendo o caminho livre depois da compra;
2. **a área do cliente**: as etapas 3 (o cadastro, com o "Entrar" e o "Minha conta" no topo, a 3.5 com a 1.1) e 4.1 e
   4.2 (Minha conta e Meus dados). **A implementação trava na U8 e na D4**, que o PO decide antes de a 2.4 terminar;
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

**Situação:** no ar (#49, 2026-10-09), conferida pelo PO na prévia. Pedido na prévia: escolhido o dia, a página
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
promovida no mesmo dia (naveg-api-vercel#40). A #58 fechou. O PO pediu, depois do aceite da 2.2: "continuemos na UX agora
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

**Situação:** decidida e implementada, em PR (2026-10-16). O que a pessoa vê quando algo dá errado na reserva da página: ao
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
| **A** | "foi combinado que haveriam dois domínios inicialmente: endereço de produção e API de homologação, faltando apenas configurar na Vercel"; o endereço `*.vercel.app` serve hoje aos dois, em desenvolvimento. A configuração pode ter ficado em outra máquina | **em aberto, com uma recomendação nova** (abaixo) |
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

**Depois da A e da E:** o wireframe da 3.1 (criar a conta), e as seções seguintes uma de cada vez.

