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

**Aceitos pelo PO em 2026-10-20**, e por isso fora daqui: o roteiro 1 (a reserva de passagem até o WhatsApp, com a
reserva gravada que conferiu a promoção da API), o 2 (o veículo e a encomenda), o 4 (os 90 dias e a saída suspensa)
e o 5 (o rodapé e os Termos de Uso). As fichas guardam a data. Do roteiro 3, os passos 2 a 4 passaram; **falta o 1**,
que falhou e foi corrigido no #87.

### 3. Os erros — 2.6 (#81), o passo 1 de novo depois do #87

O erro de conexão se provoca com o **modo avião**, com a conferência já na tela. **Recarregar a página antes**, para
vir o site com o #87. Em 2026-10-20, o passo 1 deu "A verificação contra robô não passou": sem rede, o script do
Turnstile não carregava, e o site culpava o robô. Os passos 2 a 4 passaram, mas valem de novo, porque seguem o 1.

| # | quem | faz | espera |
|---|---|---|---|
| 1 | Celular | uma reserva de passageiros até a conferência; ligar o **modo avião**; **Confirmar reserva** | num quadro **acima** do botão: "A reserva não foi enviada. A internet pode ter caído, ou o sistema está fora do ar por um instante. O que você escolheu continua aqui."; o botão passa a dizer **Tentar de novo**; embaixo, **Enviar pelo WhatsApp** |
| 2 | | desligar o modo avião; tocar em **Enviar pelo WhatsApp** | a conversa abre com "Olá! Tentei fazer esta reserva pelo site, mas ela não foi enviada. Podem registrá-la para mim?" e a reserva, **sem a linha do código**. Não precisa enviar |
| 3 | | voltar ao site; **Tentar de novo** | a reserva vai: a conclusão com o código `NVG-…` e o **Enviar pelo WhatsApp** |
| 4 | Agente NAVEG | painel → Reservas | a reserva do passo 3, **uma só** |

**Ficam com os testes automáticos**, porque o celular não os provoca sem mexer na API: envios demais ("Muitas reservas
deste aparelho em pouco tempo…"), a verificação contra robô, a saída que fecha com a conferência aberta ("Esta saída não
está mais aberta para reserva…") e as saídas que não carregam (as saídas carregam uma vez, quando a seção aparece).
Estão no `apps/agencia/test/totem.spec.tsx` e no `e2e/reserva.e2e.ts`.

## As que virão

Escritas antes do código, para o PO conferir se é isso que espera ver. O roteiro definitivo vem no PR.

### A área do cliente — 3.1 a 4.2

Depois do domain (#83, #84), da API (naveg-api-vercel#30, #43, #44) e das telas. O roteiro sai das fichas da 3.1 à 4.2;
o mínimo: criar a conta, confirmar o e-mail, entrar e sair, trocar a senha esquecida, ver "Minha conta" e corrigir "Meus
dados", e o painel do KMP vendo a conta em Clientes.
