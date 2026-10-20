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

**Nenhuma.** Os cinco roteiros do que está no ar foram aceitos pelo PO em 2026-10-20: a reserva de passagem até o
WhatsApp (com a reserva gravada que conferiu a promoção da API), o veículo e a encomenda, os erros (o modo avião
depois do #87), os 90 dias com a saída suspensa, e o rodapé com os Termos de Uso. As fichas guardam a data.

## As que virão

Escritas antes do código, para o PO conferir se é isso que espera ver. O roteiro definitivo vem no PR.

### A área do cliente — 3.1 a 4.2

Depois do domain (#83, #84), da API (naveg-api-vercel#30, #43, #44) e das telas. O roteiro sai das fichas da 3.1 à 4.2;
o mínimo: criar a conta, confirmar o e-mail, entrar e sair, trocar a senha esquecida, ver "Minha conta" e corrigir "Meus
dados", e o painel do KMP vendo a conta em Clientes.
