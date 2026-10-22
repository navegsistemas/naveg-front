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

Os roteiros 1 a 5 foram aceitos pelo PO em 2026-10-20, a 2.8 em 2026-10-21, e os 6 e 7 (o cartão da saída e o passo a
passo da encomenda) em 2026-10-22; as fichas guardam as datas. Os de
agora estão também na página "Rumo ao MVP" (`#aceite`), onde o PO marca Ok ou Falhou em cada passo.

### 8 · Uma reserva até o painel, depois das promoções de 2026-10-22

A conferência da API ([RUNBOOK](RUNBOOK.md), §5), depois da última promoção do dia (o cadastro e o e-mail, naveg-api-vercel#46
e #47; entrar e sair, #48 e #49). A homologação está no `0e100cc` desde 2026-10-22, com as quatro: o roteiro já pode ser
feito.

| # | quem | faça | espere |
|---|---|---|---|
| 1 | Celular | Faça uma reserva de passagem até o fim, com "Teste PO" e o seu celular | A conclusão com o código NVG-… e o botão "Enviar ao atendimento" |
| 2 | Celular | Toque em "Enviar ao atendimento" | O WhatsApp abre com a reserva escrita e o código |
| 3 | Agente NAVEG | Abra as reservas no painel do KMP | A reserva está lá, com o mesmo código |

### 9 · A foto em faixa no cartão da saída (#103) e o espaço das perguntas do totem (#104)

O PO reviu a C da 2.1 ao ver o cartão no ar, em 2026-10-22, e pediu espaço em volta do título das perguntas do totem.
Os dois entraram depois dos roteiros 6 e 7.

| # | quem | faça | espere |
|---|---|---|---|
| 1 | Celular | Toque em "Reservar agora" e vá até o calendário, num dia com o Maria Ivanir ou o Regional | Cada cartão começa com a foto em faixa, de ponta a ponta, com o nome da embarcação sobre ela; as horas vêm embaixo, e o cais, em letra menor, antes do botão |
| 2 | Celular | Troque de dia até achar o Maria Eduarda | Uma faixa baixa com o desenho de um barco e o nome, no lugar da foto |
| 3 | Celular | Olhe a chegada no cartão | "Chegada prevista" pode quebrar em duas linhas; a hora aparece inteira, sem corte |
| 4 | Celular | Volte às perguntas do totem ("Quantos volumes?", "Escolha o dia") | O título da pergunta com espaço em cima e embaixo, sem encostar no quadro do que já foi respondido, e nada fora do lugar |

## As que virão

Escritas antes do código, para o PO conferir se é isso que espera ver. O roteiro definitivo vem no PR.

### A área do cliente — 3.1 a 4.2

Depois do domain (#83, #84), da API (naveg-api-vercel#30, #43, #44) e das telas. O roteiro sai das fichas da 3.1 à 4.2;
o mínimo: criar a conta e receber o e-mail de `naoresponda@`, confirmar pelo link e já estar dentro, entrar e sair, as 5
tentativas, trocar a senha esquecida, ver "Minha conta" e corrigir "Meus dados", e o painel do KMP vendo a conta em
Clientes. A API do cadastro e do e-mail está no ar desde 2026-10-22; entrar e sair, em naveg-api-vercel#49.
