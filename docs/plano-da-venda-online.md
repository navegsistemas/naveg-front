# Plano da venda online no site — do endurecimento à UX da compra

**Data:** 2026-10-06
**Situação:** proposto ao PO. As decisões de produto já tomadas são as **O1–O15** do plano do KMP; as novas daqui
são as **U1–U8** (§5), **todas abertas**, com recomendação. A O14 (o que é obrigatório na compra) segue aberta lá.
**De onde vem:** o [plano da venda online do `fluviapp-kmp`](https://github.com/navegsistemas/fluviapp-kmp/blob/master/docs/plano-da-venda-online.md)
(fluviapp-kmp#39, mergeado em 2026-10-06), que é a **entrega 7** do
[plano do MVP](https://github.com/navegsistemas/fluviapp-kmp/blob/master/docs/plano-do-mvp.md). Lá, a 7.0 pede "o
resumo para o front e a API": é este documento, no lado do front.
**Substitui** a linha "Fase 2 (fora deste plano)" do [plano de implementação](plano-de-implementacao.md): a venda
online entra nele como **Bloco E**, e o passo 13 (endurecimento) passa a prepará-la.

> **Em uma frase:** o site deixa de ser só vitrine com totem de reserva e passa a ter **conta e compra** — por isso
> o resto do endurecimento (a entrega 6 do MVP) é feito **já com a compra em mente**, para não ser refeito; depois
> vem a UX da compra (7.1), que é o que o PO decide antes de qualquer tela; e só então as partes do site da 7.4,
> 7.6 e 7.7, sobre a API e o KMP.

---

## 1. O que o plano do KMP pede daqui

| entrega do KMP | o que cabe ao front | depende de |
|---|---|---|
| **7.1 — a UX da página** | **toda**: os casos comuns, o "outros" que vira reserva, a conta, os pedidos, o pagamento (§5 e §6) | nada — pode correr já |
| **7.4 — a conta do cliente** | as telas: criar conta, confirmar e-mail, entrar e sair, esqueci a senha, Meus dados (corrigir, apagar) | 7.1, a regra no KMP, **o domínio também na homologação** (§3) |
| **7.6 — a compra do passageiro** | o pedido, o valor da tabela, o pagamento (PIX e cartão), a espera, o bilhete, Meus pedidos | 7.1–7.4, a O14 |
| **7.7 — a compra do veículo** | o aviso de que a vaga está segura por um prazo, e o que acontece quando ele vence | 7.6 e a vaga segura no KMP |

A 7.2 (tabela de preços), a 7.3 (o TOTEM VIRTUAL) e a 7.5 (Clientes no painel) são do KMP e da API; o front só
**lê o que elas produzem** — o preço vem no catálogo, e quem emite é invisível para o cliente.

**O que não muda:** a reserva. O totem de reserva, a reserva de encomenda, o WhatsApp e o quiosque seguem como
estão (O11). A ADR-0002 também: **o navegador continua sem falar com o Firestore**; a conta e a compra passam pela
`naveg-api-vercel`, como a reserva.

## 2. O que a compra muda no site (a análise)

Cinco coisas do site de hoje deixam de valer, e cada uma vira item de plano:

| hoje | com a compra | onde entra |
|---|---|---|
| **Uma página estática e o `/totem`** | Páginas novas: a conta, Meus pedidos, o pagamento e três páginas legais (privacidade, cancelamento e reembolso, termos). O site continua `output: 'static'` — as páginas da conta são casca estática com ilha, e o dado vem da API | 13.1, 13.4, Bloco E |
| **Nenhuma sessão** | O cliente **entra**. Alguma coisa no navegador prova quem ele é para a API — e isso esbarra no endereço da homologação (§3) | U8, ADR-0003 |
| **Nenhum script de terceiro, fora o Turnstile** | Se o pagamento acontece no site (U1), o script e os quadros do Mercado Pago entram **só na página de pagamento** | 13.1 |
| **"Este canal gera reserva, não venda"** (`AVISO_DE_RESERVA`, no topo do totem, no rodapé e no WhatsApp) | Continua verdade **no caminho da reserva**, e fica falsa no rodapé, que fala do site inteiro. É a frase que evitava a reclamação; agora ela precisa dizer **qual dos dois caminhos** o cliente está seguindo | 7.1 (U2) |
| **"JS da página institucional = 0"** | Continua — a regra é da página institucional. As páginas da compra ganham **orçamento próprio**, declarado como o da ilha do totem | 13.6 |

**Um achado sobre o quiosque físico:** o `/totem` em modo quiosque é um terminal compartilhado. Conta e pagamento
nele deixam sessão aberta e dado de cartão ao alcance da próxima pessoa. A recomendação (U5) é **o quiosque
continuar só com reserva**, como já ficou só com passagem na encomenda.

**Um achado sobre a política de privacidade:** a entrega 6 do MVP a escreve para o site de hoje (nome, telefone,
o IP que vai à Cloudflare). Com a conta, ela passa a cobrir e-mail, senha, documento, histórico de compras, o Mercado
Pago como quem recebe o dado do pagamento, e a O7 (apagar a conta tira os dados; as passagens ficam). Escrever duas
vezes é pagar duas revisões. A recomendação (U7) está na §5.

## 3. A sessão do cliente e o endereço da homologação

É técnico, mas tem consequência de prazo, e por isso vem antes da técnica.

**A consequência:** a conta do cliente (7.4) **não funciona de forma confiável nos endereços `*.vercel.app`**
que a homologação usa hoje. O jeito seguro de manter alguém logado é um cookie que o JavaScript da página não
lê; e o front (`naveg-front-agencia.vercel.app`) e a API (`naveg-api-vercel.vercel.app`) são, para o navegador,
**sites diferentes** — o `vercel.app` é tratado como domínio público, como `com.br`. O Safari, e o Chrome cada vez
mais, recusam cookie entre sites diferentes. **No iPhone o login simplesmente não pararia de pé.**

**O que resolve**, em ordem de preferência:

1. **Os dois ambientes com endereço sob `gruponaveg.com.br`** — produção (`gruponaveg.com.br` e
   `api.gruponaveg.com.br`, a D4) e homologação (por exemplo `homologacao.gruponaveg.com.br` e
   `api-homologacao.gruponaveg.com.br`). Aí front e API são o mesmo site, e o cookie é de primeira parte. O plano
   do KMP já diz que a 7.4 depende da D4; **o que este plano acrescenta é que a D4 precisa cobrir a homologação
   também**, e antes da 7.4, não na produção.
2. **O front repassando `/api/*` para a API** (um *rewrite* da Vercel): a página e a API passam a ter a mesma
   origem, e o CORS some. Funciona sem domínio, mas a API passaria a ver o IP da Vercel e não o do cliente — e o
   limite por IP, que protege a reserva hoje, deixaria de funcionar sem ajuste. Fica como alternativa a provar
   num experimento, não como plano.

A forma da sessão (cookie, duração, como a API prova a conta para a plataforma) é a **ADR-0003** daqui, escrita
junto da 7.4, depois que o KMP disser como o servidor prova quem é o cliente.

## 4. O endurecimento, já com a compra em mente (passo 13 = entrega 6 do MVP)

O passo 13 tinha falta de: só teclado, a página sem JavaScript, o axe, os cabeçalhos, meta e `RUNBOOK`, o
Lighthouse — e o MVP juntou a política de privacidade. A lista é a mesma; muda **como** cada item é feito, para
servir também às páginas da compra. Cada linha é um PR pequeno.

| # | entrega | o que muda por causa da compra |
|---|---|---|
| **13.1** | **Cabeçalhos de segurança** no projeto da Vercel: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `frame-ancestors 'none'` | A CSP é **por rota**, não uma só para o site: a institucional é a mais estrita (só o próprio site e a API); o totem soma o Turnstile; e a página de pagamento é o único lugar onde o Mercado Pago poderá entrar — um acréscimo de uma linha, quando a U1 decidir. Os scripts que o Astro escreve na página entram por *hash*, gerado no build. `frame-ancestors 'none'` vale em todo o site: uma página de pagamento dentro de um quadro de outro site é o golpe clássico de clique sequestrado. `Referrer-Policy: strict-origin-when-cross-origin`, para o código do pedido que vier no endereço não vazar para outro site |
| **13.2** | **Só teclado, sem JavaScript e axe** — por rota, no E2E | O axe e o teste de teclado viram **um ajudante que recebe a rota**: cada página nova da compra entra no CI só por existir na lista. O teclado cobre a troca de passo (o foco vai para o título do passo novo), que é o mesmo padrão de que o pagamento vai precisar. Sem JavaScript, a institucional continua legível, e o totem e as páginas da compra dizem, num `<noscript>`, como reservar pelo WhatsApp |
| **13.3** | **Meta**: imagem de compartilhamento, `sitemap.xml`, `robots.txt` | O `robots.txt` e o `sitemap` já nascem sabendo que `/conta` e `/pedidos` existirão: fora do sitemap e com `noindex`. As páginas legais entram no sitemap |
| **13.4** | **A política de privacidade**, em página própria (`/privacidade`) — a primeira página nova do site | Ver a U7. O rodapé já tem o link como pendência, e o build já confere que ele não suma. A página nasce com **versão e data** no topo, porque vai mudar com a 7.4 e a 7.6 |
| **13.5** | **`docs/RUNBOOK.md`** | Além do que já estava previsto (Turnstile barrando reserva legítima, catálogo fora de hora, troca de chave), uma seção **"Venda online"** com os títulos já escritos e o conteúdo a preencher nas 7.4 e 7.6: o aviso do Mercado Pago que não chega; o pagamento aprovado sem passagem emitida; o estorno à mão; a troca da chave do Mercado Pago; e **como fechar a compra e deixar só a reserva** (§7) |
| **13.6** | **Lighthouse no CI**, mobile ≥90 nas quatro categorias | A régua vale por rota, e as páginas da compra entram nela como entraram no axe. O orçamento de bundle ganha uma linha para as ilhas da compra, declarada quando elas existirem |

**O que o endurecimento não faz:** não cria tela da compra, não liga o Mercado Pago, não muda o texto da reserva.
Ele deixa o terreno pronto para que a 7.4 e a 7.6 sejam só acréscimo.

**Fora do código, e que a compra torna urgente** (já estão nas pendências do README): o **2FA obrigatório** e a
**push protection** na org, antes de existir chave do Mercado Pago em qualquer lugar; e a **D2** (Vercel Pro),
antes da venda real — o plano Hobby não permite uso comercial, e venda é o caso mais claro disso.

## 5. As decisões de UX para o PO (a 7.1)

| # | pergunta | recomendação | por quê |
|---|---|---|---|
| **U1** | **Onde o cliente paga**: dentro do site (os blocos do Mercado Pago na nossa página) ou no ambiente do Mercado Pago (o cliente sai e volta) | **dentro do site** | O PIX é o caso mais comum, e no celular o que se usa é o **copia e cola**, mostrado na nossa página, com o tempo correndo e a confirmação aparecendo sozinha. Sair para o Mercado Pago e voltar é onde o cliente se perde, sobretudo no celular. O dado do cartão **continua sem passar pelo site**: os campos dele são quadros do próprio Mercado Pago. O custo é a CSP da página de pagamento abrir para o Mercado Pago (13.1) |
| **U2** | **Onde a compra começa** | **no mesmo totem**, que bifurca depois da categoria: com o caso comum e preço na tabela, o totem oferece **"Comprar — R$ X"** e **"Reservar"**; sem preço, ou "outros", só **"Reservar"**, com uma linha dizendo por quê | O cliente escolhe a travessia uma vez. A frase da reserva deixa de ser do site inteiro e passa a ser **do caminho**: "Reserva: o atendimento confirma com você" de um lado, "Compra: a passagem sai paga" do outro |
| **U3** | **Quando pede a conta** | **na hora de pagar**, não na entrada | O cliente vê o preço antes de se cadastrar. O pedido montado **sobrevive** ao cadastro e à ida ao e-mail para confirmar — quem volta do link de confirmação cai no pagamento, não no começo |
| **U4** | **Quanto tempo o PIX vale** | **30 minutos, e nunca depois do fim da venda da saída** | É o tempo que a vaga fica segura na 7.7. Depois disso o pedido expira, e o cliente vê "expirou, nada foi cobrado" e um botão para refazer |
| **U5** | **Compra no quiosque físico** | **não** — o quiosque fica só com reserva | Terminal compartilhado com conta logada e pagamento é risco para o próximo da fila (§2) |
| **U6** | **Cancelamento pelo cliente** | em **Meus pedidos**, um botão **"Pedir cancelamento"**, que o atendimento aprova; a passagem é cancelada e o estorno feito pelo servidor. Automático, só depois que o uso mostrar o volume | Mantém o atendente como guardião da regra (O11), e o texto legal da O5 fica ao lado do botão |
| **U7** | **A política de privacidade** | **Publicar na 13.4 a do site de hoje e, na mesma rodada, rascunhar as seções da conta e da compra**, para uma revisão jurídica só. As seções novas entram no ar com a 7.4 e a 7.6, cada uma mudando a versão e a data | Uma revisão em vez de duas, sem prometer no ar o que o site ainda não faz |
| **U8** | **O endereço da homologação** | **subdomínios de `gruponaveg.com.br` para a homologação também**, antes da 7.4 (§3) | Sem eles, a conta não funciona no iPhone em homologação, e o PO não consegue aceitar a 7.4 |

**A O14 (o que é obrigatório na compra) continua do PO**, no plano do KMP. Ela muda uma tela só — os dados do
titular — e por isso o resto da 7.1 não espera por ela. Para ajudar a decidir, o wireframe (§6) mostra a tela
com o mínimo que a conferência na doca pede: **nome completo e documento (tipo e número)** do titular, e a
**placa** do veículo na 7.7. O documento é digitado no aparelho do próprio cliente, logado — diferente do totem
público, onde a decisão de 2026-09-22 (nenhum documento) continua valendo.

## 6. O planejamento de UI/UX (o que a 7.1 entrega)

**A entrega da 7.1 é um wireframe navegável, privado do PO em claude.ai** — como o da encomenda —, e este plano
atualizado com as U1–U8 decididas. Nenhuma tela é codificada antes disso.

### 6.1 As jornadas

1. **Comprar como passageiro** (7.6): travessia → passageiro, inteira → resumo com o valor → entrar ou criar conta
   → dados do titular (O14) → pagar (PIX ou cartão) → esperar a confirmação → bilhete na tela e no e-mail.
2. **Criar a conta no meio da compra** (7.4): criar → "abra seu e-mail" → o link → de volta ao pagamento, com o
   pedido intacto.
3. **Cair na reserva**: "outros", ou caso sem preço → o totem de hoje, já com a travessia escolhida.
4. **Acompanhar e cancelar** (7.6, U6): Meus pedidos → o pedido → o bilhete, ou "Pedir cancelamento" → o estado do
   estorno.
5. **Cuidar da conta** (7.4): Meus dados → corrigir; apagar a conta, com o aviso da O7 (as passagens ficam).
6. **Comprar veículo** (7.7): a jornada 1, com a placa e o aviso "sua vaga fica guardada até HH:MM".

### 6.2 As telas e os estados de cada uma

O wireframe desenha **cada estado**, não só o caminho feliz — é nos estados que a compra online se perde.

| tela | estados que precisam existir |
|---|---|
| **a bifurcação no totem** | com preço (comprar ou reservar); sem preço (só reservar, com o porquê); compra fechada (§7: só reservar, sem alarde) |
| **o resumo do pedido** | valor da tabela; o aviso de que a agência não cobra taxa (O3); a saída partindo antes do fim do PIX (o pedido não começa) |
| **entrar / criar conta / esqueci a senha** | erro de senha sem dizer se o e-mail existe; e-mail não confirmado; link de confirmação vencido (reenviar); muitas tentativas (Turnstile) |
| **os dados do titular** | o que a O14 decidir; documento inválido pela regra do domínio, explicado em português |
| **o pagamento — PIX** | o código com **copiar** em destaque e o QR ao lado (o QR serve a quem paga noutro aparelho); o tempo restante; "aguardando o pagamento", que muda sozinho; expirado; aprovado |
| **o pagamento — cartão** | em análise; recusado, com o motivo que o Mercado Pago der, em linguagem de gente; aprovado |
| **a emissão** | emitindo; emitida (o bilhete com o QR, igual ao do balcão); **falhou** — "seu pagamento será devolvido", com o código para o atendimento |
| **Meus pedidos** | vazio; lista; o pedido aguardando pagamento (com o caminho de volta ao PIX); emitido; cancelamento pedido; estornado |
| **Meus dados** | corrigir; apagar, com confirmação e o texto da O7 |
| **as páginas legais** | privacidade, cancelamento e reembolso (O5), termos — texto puro, sem JavaScript |
| **o que vale para todas** | sessão expirada (volta ao mesmo lugar depois de entrar); API fora (o pedido não se perde); sem JavaScript |

### 6.3 As réguas de UX (as que o site já segue, e as novas)

- **Celular primeiro.** O cliente da travessia compra pelo celular, muitas vezes com sinal ruim: cada passo
  sobrevive a recarregar a página, e o "aguardando" do PIX não depende da aba ficar aberta — o e-mail chega igual.
- **O laranja é superfície, nunca texto** (a regra do passo 1). O botão "Comprar" é o primário laranja com rótulo
  marrom; "Reservar" é o secundário.
- **Dinheiro e hora sem ambiguidade**: `R$ 1.234,56`, e a hora no fuso da operação (`America/Belem`), nunca no do
  aparelho — a mesma régua do totem.
- **Estados anunciados**: a mudança do pagamento ("aprovado", "expirou") vai para uma região `aria-live`; a troca
  de passo leva o foco ao título (13.2).
- **Nada de pressa falsa**: o tempo do PIX é o tempo real da vaga, e não há contador onde não há prazo.
- **Erros que dizem o que fazer**, e sempre com a saída para o atendimento pelo WhatsApp.
- **Nenhum dado de cartão no site, nenhum documento inteiro na tela** depois de gravado — o mascaramento da O12
  vale também em Meus dados.

### 6.4 O que a 7.1 deixa para as seguintes

- os **cenários do E2E**, um por estado da §6.2, usados como aceite da 7.4 e da 7.6;
- os **textos**, num lugar só (`packages/ui/src/textos.ts`, como os do totem), revisados pelo PO no wireframe;
- a **lista do que o domínio precisa** — o pedido de compra, o preço, os estados do pagamento —, que vira a
  versão 0.7 do `@navegsistemas/domain`, com contrato contra o Kotlin da 7.2 e da 7.3.

## 7. Fechar a compra e deixar a reserva

Se o Mercado Pago cair, se a emissão falhar em série ou se a NAVEG decidir parar a venda, **a compra fecha e a
reserva continua**. É uma chave **na API** (o catálogo passa a dizer "compra fechada"), e não no front — para
fechar sem build nem deploy. O totem, vendo a compra fechada, mostra só "Reservar" (§6.2). Entra na 7.6; o
procedimento fica no `RUNBOOK` (13.5).

## 8. O que a API faz (o resumo para lá)

Não é deste repositório, e entra no plano da API quando a 7.3 começar. Fica registrado porque o front depende
de cada item:

- as rotas da conta (7.4) e do pedido (7.6), com **Turnstile e limite por IP** no cadastro, no entrar e no
  esqueci a senha, e respostas que **não revelam se um e-mail tem conta**;
- o **aviso do Mercado Pago** (webhook) com a assinatura conferida, e o pagamento **consultado no Mercado Pago**
  antes de emitir (plano do KMP, §7); o mesmo aviso repetido não emite duas vezes;
- a **trava ambiente × projeto** estendida às chaves do Mercado Pago: a homologação recusa subir com chave de
  produção, e a produção com chave de teste;
- **nenhum dado pessoal nos logs** — nem e-mail, nem documento, nem o código do PIX;
- a **chave da compra fechada** (§7).

## 9. A ordem

```
13 · Endurecimento (entrega 6 do MVP)
     13.1 cabeçalhos e CSP por rota -> 13.2 teclado, sem JS, axe -> 13.3 meta
     -> 13.4 política de privacidade (U7) -> 13.5 RUNBOOK -> 13.6 Lighthouse
14 · A UX da compra (7.1): U1–U8 com o PO -> wireframe -> este plano revisto      <- pode correr junto da 13
15 · O domínio da compra (0.7)                       <- depois da 7.2 e da 7.3 no KMP
16 · A conta no site (7.4) + ADR-0003                <- U8 (o domínio da homologação) e a regra no KMP
17 · A compra do passageiro (7.6)                    <- a O14 decidida
18 · A compra do veículo (7.7)                       <- a vaga segura no KMP
-> entrega 8: produção (o plano da produção do KMP)
```

**O que pode começar já:** a 13 inteira e a 14 — nenhuma das duas espera o KMP nem a API.
**O que destrava o resto:** a U8 (o domínio da homologação) para a 16; a O14 para a 17.

## 10. Riscos

| risco | o que o plano faz |
|---|---|
| **o login não funcionar na homologação** | §3: a U8 pede os subdomínios antes da 7.4 |
| **o cliente confundir reserva com compra** | U2: a frase passa a ser de cada caminho, e o botão diz o preço |
| **o cliente pagar e não receber a passagem** | o estado "falhou" na tela, o estorno pelo servidor, e o procedimento no `RUNBOOK` |
| **script de terceiro com acesso à página** | o Mercado Pago só na página de pagamento (CSP por rota, 13.1); o cartão em quadros dele |
| **sessão aberta num terminal compartilhado** | U5: o quiosque não compra |
| **a política de privacidade dizer menos do que o site faz** | U7: as seções novas entram junto com o que elas descrevem, com versão e data |
| **o Mercado Pago fora do ar derrubar a venda inteira** | §7: a compra fecha pela API, a reserva continua |
