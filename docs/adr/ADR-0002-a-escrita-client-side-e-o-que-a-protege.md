# ADR-0002 — A escrita client-side, e o que de fato a protege

**Status:** aceito
**Data:** 2026-09-22
**Contexto:** o totem grava reservas direto no Firestore, sem login e sem backend próprio
**Depende de:** ADR-0001 (a coleção `reservas` existe e é separada)

---

> ## ⚠ Emenda de 2026-09-22 — a camada 1 abre o que as outras não fecham
>
> **Achado na revisão contra o aplicativo fluviapp** (`firestore.rules` do projeto que a agência compartilha).
> Este ADR tratou a autenticação anônima como camada de proteção **da coleção `reservas`**. Ela não fica
> contida nela: nas Rules do fluviapp, a função que autoriza leitura é
>
> ```
> function autenticado() { return request.auth != null; }
> ```
>
> e **um usuário anônimo satisfaz `request.auth != null`**. Com ela, ficam legíveis a qualquer visitante que
> chame `signInAnonymously` com a chave pública do bundle:
>
> | coleção | regra de leitura hoje | o que expõe |
> |---|---|---|
> | `passagens` | `autenticado()` | todos os bilhetes, de todas as empresas: valores, lançamentos, ids de clientes |
> | `users` | `autenticado()` | perfis de acesso, papéis e vínculos |
> | `funcionarios` | `autenticado()` | o quadro de funcionários |
> | `viagens`, `rotas`, `portos`, `localidades`, `embarcacoes`, `empresas` | `autenticado()` | o catálogo comercial inteiro |
>
> `clientes` e `veiculos` estão protegidos (exigem papel de plataforma ou assinatura da agência). O resto não.
>
> **Consequência: a camada 1 não pode ser ligada no projeto do fluviapp como ele está.** Ativar o provedor
> anônimo no console é, sozinho, a abertura — antes de qualquer linha deste repositório ir a produção.
>
> **O que decidir, e quem decide** — é mudança do lado do fluviapp, e por isso fica registrada aqui como
> bloqueio do passo 9, não resolvida:
>
> 1. **`autenticado()` passa a excluir anônimos** — `request.auth != null && request.auth.token.firebase.sign_in_provider != 'anonymous'` —
>    e a regra de `reservas` usa uma função própria que os admite. É a menor mudança, mas toca em todas as
>    regras do fluviapp de uma vez, e precisa dos casos de emulador dele;
> 2. **o totem não autentica**, e a Rule de `reservas` dispensa `criadoPor` — perde-se o eixo de medição de
>    abuso, e o App Check vira a única camada de origem;
> 3. **projeto Firebase separado para a agência**, com a coleção `reservas` só — isola por construção, mas o
>    aplicativo passa a ler de dois projetos.
>
> E a leitura do catálogo pelo público (rotas, viagens) **não deve depender de autenticação anônima** pelo
> mesmo motivo. A alternativa que o plano já listava — o catálogo **gerado no build** a partir do fluviapp —
> passa a ser a recomendada: `@naveg/domain/catalogo` já lê os documentos como o aplicativo lê, e roda igual
> num script de build.

---

## Contexto

O totem é a única parte da agência virtual que **escreve**. A alternativa seria uma Cloud Function que valida e
grava, mas ela traz backend novo, deploy próprio e plano Blaze para entregar, na Fase 1, exatamente o mesmo
documento. A decisão foi gravar do cliente.

Isso coloca uma porta de escrita pública na internet, e a pergunta que este ADR responde é: **o que a fecha?**

## A decisão

Quatro camadas, e a ordem importa — cada uma cobre o que a anterior não cobre:

### 1. Autenticação anônima

A ilha faz `signInAnonymously` ao carregar. Ela não identifica ninguém — dá um `request.auth.uid` estável por
navegador, que serve a duas coisas: as Rules podem exigir que `criadoPor == request.auth.uid` (ninguém grava em
nome de outro), e o abuso ganha um eixo por onde ser medido.

**O que ela não faz:** impedir que alguém gere mil uids. É por isso que ela não é a camada principal.

### 2. App Check com reCAPTCHA Enterprise

É a camada que responde *"esta requisição veio do nosso site, num navegador de gente?"*. Sem ela, a coleção é
um formulário aberto — a chave de API do Firebase está no bundle, e tem de estar.

**O que ela não faz:** validar o conteúdo. App Check atesta a origem, não o dado.

### 3. Firestore Rules — `create` apenas, com a forma fechada

É a camada que decide o que pode ser gravado, e é **a única que o servidor sempre executa**:

- `allow create` e nada mais. `read`, `update` e `delete` são `false` para o público;
- `keys().hasOnly([...])` — campo fora da lista previsto derruba a gravação. Sem isso, a coleção vira depósito
  de qualquer coisa que caiba em 1 MiB;
- `status == 'RESERVADA'` e `origem == 'TOTEM_WEB'` — a web não escreve outro estado, então a regra recusa o
  que ela não teria como produzir legitimamente;
- `criadoPor == request.auth.uid`;
- forma dos valores: `data` casando `^\d{4}-\d{2}-\d{2}$`, listas com tamanho máximo, strings com comprimento
  máximo.

Leitura e transição (`CONVERTIDA`, gravar `passagemId`) ficam em regra separada, exigindo funcionário
autenticado. É o app mobile que as usa.

### 4. O código como id do documento

O código humano `NVG-XXXXXX` **é** o id. Como a regra só permite `create`, gravar sobre um documento existente
é um `update` — negado. Colisão de código vira gravação recusada, e o cliente tenta outro.

Isso substitui o contador sequencial, que exigiria transação **com leitura** — e leitura é justamente o que as
Rules negam ao público. A propriedade cai de graça, e é fail-closed: o caminho do erro é a recusa, não a
sobrescrita silenciosa de uma reserva alheia.

## Sobre a chave de API não ser segredo

A configuração do Firebase (`apiKey`, `projectId`, `appId`) vai no bundle e é pública. **Isso não é uma falha
de configuração e não tem como ser diferente** — qualquer APK publicado expõe os mesmos valores, como o próprio
`firebase.properties.example` do `fluviapp-kmp` registra. Ela identifica *qual projeto*, não *quem pode o quê*.
O que protege os dados são as Rules.

O arquivo de configuração fica fora do versionamento pela razão que o `google-services.json` fica: um
repositório que carrega a identidade de produção convida um build de teste a escrever nela.

## O que foi recusado

**Cloud Function HTTPS callable.** Mais seguro contra abuso e centralizaria a numeração. Recusado para a
Fase 1 pelo custo de backend, deploy e billing — e porque as quatro camadas acima cobrem o risco real, que é
lixo em volume, não vazamento (o público nunca lê nada).

**Escrita sem autenticação nenhuma.** Tiraria o eixo `criadoPor` e deixaria as Rules sem nada para amarrar.

**Contador sequencial para o código.** Exige leitura, e leitura é o que não se concede.

**Confiar na validação do formulário.** Validação de tela é ergonomia. Quem grava é o SDK, e o SDK obedece a
quem chama — inclusive um console aberto na página.

## Consequências

- **Os cenários de Rules no emulador (`@firebase/rules-unit-testing`) são o teste mais importante do projeto.**
  Eles são a única verificação de que a porta está fechada, e rodam no CI.
- O passo do totem não vai a produção sem revisão de segurança.
- App Check pode bloquear gente legítima (navegador antigo, extensão agressiva). O runbook precisa dizer como
  diagnosticar isso sem a saída fácil de desligar a camada.
- O catálogo público (`rotas`, `portos`, `viagens`, `embarcacoes` ativos) exige ampliar a **leitura** dessas
  quatro coleções. É a única ampliação que este projeto propõe, e depende de ratificação do analista.
