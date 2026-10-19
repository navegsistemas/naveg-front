# Roteiro de aceite

O que o PO confere **no celular, na homologação do site**, entrega por entrega. É a versão curta das fichas do
[roteiro de UI/UX](roteiro-de-ui-ux.md) (§10) e dos PRs: aqui fica só o que se toca e o que se espera ver. O formato é o
do [roteiro de aceite do KMP](https://github.com/navegsistemas/fluviapp-kmp/blob/master/docs/roteiro-de-aceite.md).
Uma entrega aceita **sai deste arquivo**, e a ficha dela ganha a data do aceite; uma que vai chegar entra em "As que
virão" e sobe quando o PR for juntado.

**Antes de começar:**

- **O site:** `naveg-front-agencia.vercel.app`, o preview da `main`, atrás do login da Vercel. É ele que fala com a API
  de verdade. A prévia de um PR usa o catálogo de demonstração e não grava reserva.
- **A API:** a homologação (`naveg-api-vercel.vercel.app`), sobre o `fluvi-app-dev`. A reserva gravada chega ao painel
  do KMP, no exe do `master`.
- **Quem:** *Celular* é o PO no navegador do celular, como cliente; *Agente NAVEG* é o exe do painel.
- **Os dados:** usar um nome que diga que é teste ("Teste PO") e o próprio celular. As reservas de teste ficam no painel;
  o atendimento as cancela ou deixa vencer.

**O que o aceite garante** (o mesmo do KMP, PO, 2026-10-19): o roteiro passa pela tela como o cliente a usa, e prova
**o mínimo**. O fluxo anda, a regra vale, e o que é recusado é recusado. **Não garante que a interface está ideal.** O
que o PO estranhar no caminho vira pedido.

## Pendentes (já no ar)

Pela ordem sugerida. A 1 vem primeiro porque grava a reserva que confere também a promoção da API
(`docs/RUNBOOK.md` §5): se ela não chegar ao painel, `vercel rollback --scope kurtmatheus-projects` volta à `4f41300`.

### 1. Uma reserva de passagem, do começo ao WhatsApp — 2.3, 2.4 e 2.5 (#75, #77) e o texto da 2.6 (#81)

| # | quem | faz | espera |
|---|---|---|---|
| 1 | Celular | "Reserve sua passagem" → **Passageiros**, 2 pessoas em rede, uma saída desta semana | o quadro da saída com o cais de embarque |
| 2 | | em "Seus dados", só o nome, sem o celular → **Continuar** | recusado: "Informe um celular com DDD, como (91) 98888-7777." |
| 3 | | olhar o passo | o campo "Celular com WhatsApp", a ajuda "É pelo WhatsApp deste celular que o atendimento confirma a reserva com você" e, antes do botão, "Usamos o nome e o celular só para esta reserva, e apagamos 14 dias depois da viagem.", com o link da política |
| 4 | | o celular → **Continuar** | a conferência em três blocos: **O que vai** ("2 pessoas em rede"), **A viagem** e **Em nome de** (com "Celular"); sem "Vale até" |
| 5 | | embaixo do botão | "Nada é pago agora. Ao confirmar, você recebe o código e fala com o atendimento pelo WhatsApp. A reserva vale até a saída." |
| 6 | | **Mudar** em "Em nome de" | volta a "Seus dados" **preenchido**; **Continuar** volta à conferência sem perder o resto |
| 7 | | **Mudar** em "O que vai", trocar para 3 pessoas, seguir até a conferência | "3 pessoas em rede"; nome e celular mantidos |
| 8 | | **Confirmar reserva** | a conclusão: o código com **Copiar** ao lado; logo abaixo, o quadro "Falta um passo: envie a reserva ao atendimento. É pelo WhatsApp que ela é confirmada.", o botão **Enviar pelo WhatsApp** e o número do atendimento; depois os três blocos, sem "Mudar" |
| 9 | | **Copiar**, colar numa nota | o código, como `NVG-…` |
| 10 | | **Enviar pelo WhatsApp** | abre a conversa com o atendimento, a mensagem pronta (abaixo). **Não precisa enviar** |
| 11 | Agente NAVEG | painel → Reservas | a reserva, com o código do passo 9, o nome e o celular: **é a conferência da promoção da API** |

A mensagem do passo 10 (2.6, E):

```
Olá! Gostaria de confirmar a reserva que fiz pelo site.

*Reserva:* NVG-…
*Trecho:* … → …
*Saída:* …
*Embarque:* …
*Passagem:* Rede · 3 pessoas
*Nome:* Teste PO

Aguardo a confirmação.
```

Sem "Vale até a partida.".

### 2. O veículo e a encomenda — 2.4 (C) e 2.6 (E)

| # | quem | faz | espera |
|---|---|---|---|
| 1 | Celular | **Veículo**: carro, com 3 pessoas em suíte, até a conferência | em "O que vai": "Carro, com 3 pessoas em suíte", e numa linha à parte "Inteira, meia ou gratuidade: no atendimento" |
| 2 | | confirmar → **Enviar pelo WhatsApp** | a mensagem com `*Veículo:*` e `*Acompanhantes:*` |
| 3 | Celular | **Mandar uma encomenda** (na seção "Envie sua encomenda") | a reserva abre já em Encomenda; o calendário acende só os próximos 7 dias |
| 4 | | 2 volumes, até a conferência, pulando quem recebe | os blocos "O que vai", "A viagem", "Quem manda" e "Quem recebe"; "Quem retira: A combinar com o atendimento" |
| 5 | | confirmar → **Enviar pelo WhatsApp** | a mensagem com `*Volumes:*`, `*Remetente:*` e, no fim, "Entrego no porto antes da saída. Aguardo a confirmação." |
| 6 | Agente NAVEG | painel → Reservas | as duas reservas |

### 3. Os erros — 2.6 (#81)

O erro de conexão se provoca com o **modo avião**, com a conferência já na tela.

| # | quem | faz | espera |
|---|---|---|---|
| 1 | Celular | uma reserva de passageiros até a conferência; ligar o **modo avião**; **Confirmar reserva** | num quadro **acima** do botão: "A reserva não foi enviada. A internet pode ter caído, ou o sistema está fora do ar por um instante. O que você escolheu continua aqui."; o botão passa a dizer **Tentar de novo**; embaixo, **Enviar pelo WhatsApp** |
| 2 | | desligar o modo avião; tocar em **Enviar pelo WhatsApp** | a conversa abre com "Olá! Tentei fazer esta reserva pelo site, mas ela não foi enviada. Podem registrá-la para mim?" e a reserva, **sem a linha do código**. Não precisa enviar |
| 3 | | voltar ao site; **Tentar de novo** | a reserva vai: a conclusão com o código, como no roteiro 1 |
| 4 | Agente NAVEG | painel → Reservas | a reserva do passo 3, **uma só** |

**Ficam com os testes automáticos**, porque o celular não os provoca sem mexer na API: envios demais ("Muitas reservas
deste aparelho em pouco tempo…"), a verificação contra robô, a saída que fecha com a conferência aberta ("Esta saída não
está mais aberta para reserva…") e as saídas que não carregam (as saídas carregam uma vez, quando a seção aparece).
Estão no `apps/agencia/test/totem.spec.tsx` e no `e2e/reserva.e2e.ts`.

### 4. O calendário de 90 dias e a saída suspensa — 1.3, com o KMP (#44 de lá)

É o que o KMP pôs em "As que virão" para o site. Usa a suspensão do **roteiro 4 do KMP**.

| # | quem | faz | espera |
|---|---|---|---|
| 1 | Celular | Passageiros → o calendário | os dias acendem até **90 dias** à frente |
| 2 | Supervisor MOCORONGO | KMP, roteiro 4, passo 2: suspender uma data da semana que vem | — |
| 3 | Celular | recarregar a página; o calendário | a data suspensa **não acende** |
| 4 | | uma reserva para daqui a uns 60 dias | grava |
| 5 | Agente NAVEG | painel → Reservas | a reserva de 60 dias, como qualquer outra |
| 6 | Supervisor MOCORONGO | KMP, roteiro 4, passo 5: **Desfazer** | no site, a data volta a acender |

### 5. O rodapé e os Termos de Uso (#78, #79)

| # | quem | faz | espera |
|---|---|---|---|
| 1 | Celular | o rodapé | o telefone (91) 99203-5322, o e-mail `contato@gruponaveg.com.br` e só o endereço de Belém: Terminal Hidroviário de Belém, Av. Marechal Hermes, 901, CEP 66010-000. Sem Macapá |
| 2 | | tocar no telefone e no e-mail | abre o WhatsApp (ou o discador) e o e-mail |
| 3 | | **Termos de Uso** | a página `/termos/`, com o aviso de rascunho até a revisão jurídica |

## As que virão

Escritas antes do código, para o PO conferir se é isso que espera ver. O roteiro definitivo vem no PR.

### A área do cliente — 3.1 a 4.2

Depois do domain (#83, #84), da API (naveg-api-vercel#30, #43, #44) e das telas. O roteiro sai das fichas da 3.1 à 4.2;
o mínimo: criar a conta, confirmar o e-mail, entrar e sair, trocar a senha esquecida, ver "Minha conta" e corrigir "Meus
dados", e o painel do KMP vendo a conta em Clientes.
