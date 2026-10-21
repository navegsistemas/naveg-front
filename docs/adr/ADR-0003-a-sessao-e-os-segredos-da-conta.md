# ADR-0003 — A sessão e os segredos da conta do cliente

**Status:** aceito
**Data:** 2026-10-21
**Contexto:** a conta do cliente (7.4, naveg-api-vercel#30), com a API atrás do site, em `/api`
**Depende de:** ADR-0002 (o navegador não fala com o Firestore; tudo passa pela API)

---

## Contexto

O site passa a ter conta: a pessoa se cadastra, confirma o e-mail, entra, troca a senha e apaga a conta. As regras
de produto já estão decididas, na ficha "As regras da conta" do [roteiro de UI/UX](../roteiro-de-ui-ux.md): os
prazos, os limites e as frases. O contrato do que se grava é do KMP (ADR-0022 de lá) e chega pelo
`@navegsistemas/domain` 0.13.0: a conta em `contasDeCliente/{id}` e, ao lado, `contasDeCliente/{id}/segredos/`, que
só o servidor da agência lê e grava.

Faltava decidir, do lado do servidor:

1. se a API, atrás do site, ainda vê o endereço de quem acessa;
2. como o navegador prova, a cada pedido, que a pessoa entrou;
3. como a senha é guardada e conferida;
4. como são feitos os códigos dos links de confirmação e de troca de senha.

E uma pergunta do plano da venda online: como a API prova a conta para a plataforma.

## A medida: a API vê o endereço de quem acessa

A D4 (PO, 2026-10-20) pôs a API atrás do site: o navegador chama `/api`, e a Vercel repassa o pedido para o projeto
da API. O limite por endereço e o Turnstile dependem do endereço de quem acessa. Se a API passasse a ver o endereço
da Vercel, o limite de 20 envios valeria para todo mundo junto.

**Medido em 2026-10-21** (naveg-api-vercel#30, PR 2). Uma prévia do site repassava `/api` a uma prévia da API com uma
rota de eco. O celular do PO, na rede da operadora, abriu a rota pelo site e direto na API. Nos dois caminhos, o
`x-real-ip`, o `x-forwarded-for` e o `x-vercel-forwarded-for` chegaram iguais, com o endereço do celular, e o
`ipDaRequisicao` da API deu o mesmo. **O `ipDaRequisicao` não muda.**

Ficou sem medir: um `X-Forwarded-For` forjado por quem chama não pode passar pelo repasse. As prévias estão atrás do
login da Vercel, e o navegador não manda esse cabeçalho. **Confere-se no PR 4**, com o repasse de verdade, por um
cenário de fumaça.

## A decisão

### 1. A sessão é um cookie do site, assinado pela API

Ao entrar, a API responde com um cookie:

```
__Host-sessao=v1.<contaId>.<emitidaEm>.<geracao>.<assinatura>
Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000
```

- **`__Host-`**: o navegador só aceita o cookie com `Secure`, `Path=/` e sem `Domain`. Ele fica preso ao endereço
  exato do site, seja `gruponaveg.com.br`, seja o `*.vercel.app` da homologação. Como a API responde pelo `/api` do
  site, o cookie é do próprio site, e o iPhone não o descarta (o porquê da D4).
- **`HttpOnly`**: o JavaScript da página não lê o cookie. É o que a política de privacidade promete.
- **`SameSite=Lax`**: outro site não consegue fazer o navegador mandar o cookie num `POST`. A API confere também o
  `Origin` de todo pedido que muda alguma coisa, como já faz na reserva.
- **30 dias, renovados a cada uso** (3.3, A). A API devolve um cookie novo quando o atual tem mais de um dia, e não a
  cada pedido.
- **A assinatura** é um HMAC-SHA256 de tudo o que vem antes dela, com o segredo `SEGREDO_DA_SESSAO` da API. Quem
  muda um número do cookie perde a assinatura.
- **A `geracao`** é um número guardado nos segredos da conta. Para tirar a conta de todos os aparelhos, a API soma 1, e
  todo cookie da geração anterior deixa de valer. Isso acontece quando a pessoa troca a senha (3.4, C; 4.2, C), quando
  o painel pede `ENCERRAR_SESSOES` (fluviapp-kmp#71) e quando a conta é apagada.
- **Sair** (3.3, D) apaga o cookie daquele aparelho.

A cada pedido de quem entrou, a API confere a assinatura e o prazo, e lê duas coisas, em paralelo: a conta (para recusar a
desativada) e os segredos (para conferir a geração).

**Por que assinado, e não uma sessão guardada no Firestore:** a sessão guardada pede um documento por aparelho, uma
escrita a cada renovação e uma tarefa para limpar as vencidas. O cookie assinado não grava nada ao entrar. O que ele
não faz sozinho, tirar a conta dos aparelhos, a geração faz com um número.

**O que se perde:** sair num aparelho não invalida uma cópia do cookie tirada dele antes. Para isso existe o "tirar de
todos os aparelhos", pela troca de senha ou pelo painel.

### 2. A senha: scrypt, do próprio Node

A senha é guardada como um resumo **scrypt**, do `node:crypto`, sem biblioteca nova:

```
scrypt$15$8$3$<sal>$<resumo>
```

- os parâmetros são N = 2¹⁵, r = 8 e p = 3, uma das combinações que o OWASP recomenda para o scrypt. Com eles, conferir
  uma senha levou 230 ms nesta máquina (2026-10-21): imperceptível para quem entra, e caro para quem tenta milhões. O `sal` tem 16 bytes aleatórios, e o resumo, 64 bytes;
- **os parâmetros vão junto do resumo.** Para subir o custo depois, basta mudar o padrão: a senha antiga continua
  conferindo, e a API regrava o resumo com os parâmetros novos na próxima entrada certa;
- a comparação usa `timingSafeEqual`;
- **o e-mail sem conta também paga o scrypt**, contra um resumo fixo. Sem isso, a resposta rápida diria que o e-mail
  não tem conta, e a frase "E-mail ou senha não conferem" (3.3, B) não adiantaria.

**A senha comum ou vazada é recusada** (3.1, C) de dois jeitos:

1. **uma lista das senhas mais comuns**, dentro da API, sem rede;
2. **a base de senhas vazadas do Have I Been Pwned**, pela consulta por faixa: a API manda só os 5 primeiros
   caracteres do SHA-1 da senha e procura o resto na resposta. A senha, e mesmo o resumo inteiro dela, não saem da API.
   É gratuito e não tem chave. Se a consulta não responder em 2 segundos, vale só a lista.

**Por que não o Firebase Authentication**, como o rascunho da privacidade supunha: as contas do site ficariam no mesmo
cadastro de usuários do aplicativo, no `fluvi-app-dev` hoje e no projeto de produção depois, ao lado dos funcionários
e dos papéis. O contrato do KMP (ADR-0022) foi feito para o contrário: a conta é um documento da agência, e a senha
fica nos segredos dela. O rascunho foi corrigido junto desta ADR.

### 3. Os códigos dos links

Cada link (a confirmação do e-mail, 3.2; a troca de senha, 3.4) leva um **código aleatório de 32 bytes**, em
base64url. O e-mail leva o código; a API guarda **só o SHA-256 dele**, nos segredos da conta, com o prazo:

| link | onde fica | prazo | depois de usado |
|---|---|---|---|
| confirmação do e-mail | `segredos/confirmacao` | 24 horas | apagado |
| troca de senha | `segredos/trocaDeSenha` | 1 hora | apagado: vale uma vez só |

- **Um documento por tipo de link:** o link novo grava por cima, e o anterior deixa de valer (3.2, B; 3.4, A).
- **A troca de e-mail** (4.2, B) usa o mesmo `segredos/confirmacao`, com o e-mail novo junto. O e-mail da conta só
  muda quando o link é aberto.
- **O código vai depois do `#`** no endereço: `/conta/confirmar#<contaId>.<codigo>`. O que vem depois do `#` não
  chega ao servidor no pedido da página, nem aos logs da Vercel, nem ao `Referer`. A página lê o código e o manda à
  API num `POST`.
- Quem copiar o banco não consegue usar os links: lá está só o resumo.

### 4. Os segredos da conta

Tudo o que só o servidor lê fica em `contasDeCliente/{id}/segredos/`, como o contrato do KMP prevê:

| documento | o que guarda |
|---|---|
| `acesso` | o resumo da senha, a `geracao` da sessão e os erros seguidos de senha |
| `confirmacao` | o resumo do código, o prazo e, na troca de e-mail, o e-mail novo |
| `trocaDeSenha` | o resumo do código e o prazo |

- **As tentativas** (3.3, C): o quinto erro seguido grava `bloqueadaAte`, 15 minutos à frente, na própria conta, onde
  o painel a vê e pode liberar (`LIBERAR_TENTATIVAS`). A entrada certa zera a contagem. O limite por endereço de rede
  continua valendo por cima.
- **Apagar a conta** apaga os segredos no mesmo lote da conta e do índice do documento.

### 5. Como a API prova a conta para a plataforma

Não prova. A plataforma não lê a conta, só o resumo (`resumos/contasDeCliente`). A API grava com o token de serviço
da agência, com `agenciaId` na claim, como já faz na reserva. **Quem entrou é assunto da API**, conferido pelo cookie
da seção 1. Nenhuma regra do Firestore depende da sessão do cliente.

## O que foi recusado

- **Firebase Authentication**: ver a seção 2.
- **Uma sessão guardada no Firestore**: ver a seção 1.
- **Um token no `localStorage`**: o JavaScript da página o leria, e um script injetado também.
- **bcrypt ou Argon2**: pedem uma biblioteca nativa, que complica o build da Vercel. O scrypt já vem no Node e é
  tão aceito quanto eles.
- **Um código de 6 números no lugar do link**: decidido pelo PO na 3.2, A.

## Consequências

- **Um segredo novo na API**, o `SEGREDO_DA_SESSAO`, com 32 bytes aleatórios, um diferente por ambiente. A API aceita
  também o `SEGREDO_DA_SESSAO_ANTERIOR`, para a troca do segredo seguir a lição de sempre: colar o novo, refazer o
  build e só então tirar o antigo. Trocar o segredo sem o anterior tira todo mundo da conta, e é o remédio se ele
  vazar. **Quem grava o segredo no ambiente de produção da Vercel é o PO**, no PR 5 da #30.
- **A privacidade muda:** o site passa a ter um cookie próprio, o `__Host-sessao`, necessário ao serviço, por 30 dias
  renovados. Não há cookie de análise. A senha é guardada pela própria agência, e não pelo Google. O rascunho
  (`docs/rascunho-da-privacidade-da-conta-e-da-compra.md`) já diz isso.
- **Duas leituras do Firestore por pedido de quem entrou**, feitas em paralelo. É o custo de recusar na hora a
  conta desativada e a geração vencida.
- **O PR 4 confere o cabeçalho forjado**; o PR 7 (entrar e sair) é o primeiro a pôr o cookie no ar.
