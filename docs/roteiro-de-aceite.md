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

O roteiro 13, o último da área do cliente (PO, 2026-10-23: "é melhor terminar os PRs da tela e montar os roteiros de
aceite destas"), e o 14, o quadro do cadastro. Estão também na página "Rumo ao MVP" (`#aceite`), onde o PO marca Ok ou
Falhou em cada passo.

Os roteiros 1 a 9 foram aceitos até 2026-10-22, e os 10 a 12 (o topo, criar a conta, entrar e sair) em 2026-10-23,
com observações que viraram pedidos nas fichas 3.1 e 3.5. As fichas guardam as datas.

**Antes de começar:** usar **um e-mail seu de verdade**, que se abre no celular: os e-mails saem de
`naoresponda@gruponaveg.com.br` (olhar também o spam). A prévia de um PR não serve: ela não fala com a API, e nenhum
e-mail sai.

### 13 · Esqueci a senha (3.4; #113)

| # | quem | faça | espere |
|---|---|---|---|
| 1 | Celular | Saia. Na tela de entrar, digite o seu e-mail e toque em "Esqueci a senha". | "Esqueci a senha", com o e-mail já preenchido. |
| 2 | Celular | "Mandar o link". | "Se houver uma conta com …, o link chega em instantes. Ele vale por 1 hora." E "Mandar de novo em 60 s". |
| 3 | Celular | Abra o seu e-mail. | "Troque sua senha na NAVEG", com "Trocar a senha". |
| 4 | Celular | "Trocar a senha", uma senha nova, "Salvar a senha nova". | "Senha trocada": dentro neste celular, e fora dos outros aparelhos. |
| 5 | Celular | Abra o seu e-mail de novo. | "Sua senha foi trocada", com a hora e o WhatsApp. |
| 6 | Celular | O link do passo 3 de novo. | "Este link não vale mais", com "Pedir um link novo". |
| 7 | Celular | Saia e entre com a senha nova. | "Minha conta". |

### 14 · O quadro quando a conta não é criada (3.1; #119)

O pedido do PO no aceite do roteiro 11, com o quadro que ele escolheu (2026-10-23). Rápido: nenhuma conta é criada.

| # | quem | faça | espere |
|---|---|---|---|
| 1 | Celular | Saia da conta. Em "Minha conta", "Criar conta", e toque em "Criar conta" com tudo vazio. | Os erros embaixo dos campos e, acima do botão, o quadro: "A conta ainda não foi criada. Confira os campos marcados acima." |
| 2 | Celular | Preencha os campos, menos a senha. | O quadro continua. |
| 3 | Celular | Digite uma senha de 8 ou mais caracteres. | O quadro some. Não toque em "Criar conta". |

## As que virão

Escritas antes do código, para o PO conferir se é isso que espera ver. O roteiro definitivo vem no PR.

### Minha conta e Meus dados — 4.1 e 4.2

Depois do aceite dos roteiros 10 a 13. O mínimo: "Olá" com o nome e o resumo dos dados, corrigir o nome e o celular,
trocar a senha com a atual, trocar o e-mail pelo link (com o aviso ao antigo), apagar a conta com a senha, e o painel do
KMP vendo a conta em Clientes. A API de tudo isso está no ar desde 2026-10-23 (naveg-api-vercel#53 a #56).
