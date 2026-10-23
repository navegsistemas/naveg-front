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

Os roteiros 10 a 13, da área do cliente (PO, 2026-10-23: "é melhor terminar os PRs da tela e montar os roteiros de
aceite destas"). Estão também na página "Rumo ao MVP" (`#aceite`), onde o PO marca Ok ou Falhou em cada passo.

Os roteiros 1 a 9 foram aceitos até 2026-10-22, e as fichas guardam as datas.

**Antes de começar:** juntar o #114 (as revisões da 3.1) e o #115 ("Minha conta" no topo). Usar **um e-mail seu de
verdade**, que se abre no celular: os e-mails saem de `naoresponda@gruponaveg.com.br` (olhar também o spam). A prévia
de um PR não serve: ela não fala com a API, e nenhum e-mail sai.

### 10 · "Minha conta" no topo (3.5; #115)

| # | quem | faça | espere |
|---|---|---|---|
| 1 | Celular | Abra o site e toque no menu. | "Minha conta" no fim da lista, com o desenho de uma pessoa, separado das seções por um fio. |
| 2 | Celular | Toque em "Minha conta". | A página da conta com "Entrar na sua conta" (ou a conta, se já tiver entrado). |
| 3 | Celular | Abra o site no computador, ou no celular deitado. | As seções junto do logo; "Minha conta" no fim da linha, encostado no "Reservar agora". |

### 11 · Criar a conta e confirmar o e-mail (3.1 e 3.2; #110, #111, #114)

| # | quem | faça | espere |
|---|---|---|---|
| 1 | Celular | Em "Minha conta", toque em "Criar conta". | Os dois grupos; o nome, o e-mail e o celular na largura toda, um embaixo do outro. Sem documento: ele vem na compra. |
| 2 | Celular | Toque na data de nascimento. | O calendário do celular; não se escolhe um dia depois de hoje. |
| 3 | Celular | "Criar conta" com tudo vazio. | Um erro embaixo de cada campo, e o cursor no nome. |
| 4 | Celular | Um nascimento de menos de 18 anos. | "A conta é para maiores de 18 anos. Menores viajam com a passagem comprada por um responsável." |
| 5 | Celular | Os seus dados, um e-mail seu e a senha 12345678; a verificação contra robô; "Criar conta". | Embaixo da senha: "Esta senha é muito comum. Escolha outra." |
| 6 | Celular | Uma senha sua, de 8 ou mais; "Criar conta". | "Confira seu e-mail", com o seu e-mail, e "Reenviar em 60 s" contando. |
| 7 | Celular | Abra o seu e-mail. | "Confirme seu e-mail na NAVEG", de `naoresponda@`, com "Confirmar e-mail". |
| 8 | Celular | Toque em "Confirmar e-mail". | "E-mail confirmado": a conta pronta, e você já dentro dela. |
| 9 | Celular | Abra o mesmo link de novo. | "Este e-mail já está confirmado". |

### 12 · Entrar e sair (3.3; #112)

| # | quem | faça | espere |
|---|---|---|---|
| 1 | Celular | Toque em "Minha conta". | "Minha conta" (o link do roteiro 11 já deixou você dentro), com "Sair" no fim. |
| 2 | Celular | "Sair". | "Você saiu da sua conta neste aparelho", e a tela de entrar. |
| 3 | Celular | O seu e-mail e uma senha errada. | "E-mail ou senha não conferem. Confira e tente de novo." O e-mail continua. |
| 4 | Celular | Um e-mail sem conta, e qualquer senha. | A mesma frase do passo 3. |
| 5 | Celular | O seu e-mail e a senha certa. | "Minha conta". |
| 6 | Celular | Recarregue a página. | Continua em "Minha conta", sem pedir a senha (14 dias neste celular). |

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

## As que virão

Escritas antes do código, para o PO conferir se é isso que espera ver. O roteiro definitivo vem no PR.

### Minha conta e Meus dados — 4.1 e 4.2

Depois do aceite dos roteiros 10 a 13. O mínimo: "Olá" com o nome e o resumo dos dados, corrigir o nome e o celular,
trocar a senha com a atual, trocar o e-mail pelo link (com o aviso ao antigo), apagar a conta com a senha, e o painel do
KMP vendo a conta em Clientes. A API de tudo isso está no ar desde 2026-10-23 (naveg-api-vercel#53 a #56).
