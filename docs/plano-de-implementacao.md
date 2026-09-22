# NAVEG — Agência Virtual · Plano de implementação (Fase 1)

**Produto:** single page da **NAVEG — Turismo e Logística**, com uma seção inteira dedicada ao **totem de
reserva**. O nome segue o que está impresso na marca; o briefing dizia "Navegação e Logística", e a divergência
foi resolvida em favor do material que o cliente já distribui. A razão social completa e o CNPJ ainda faltam,
e são pendência do passo 6 (rodapé e JSON-LD).
**Escopo da Fase 1:** front-end. Gerar **reservas** (não vendas, não emissão) e formar clientela antes da venda online.
**Fase 2 (fora deste plano):** venda de passagem online com cadastro e pagamento.

**Base de referência nesta máquina:**

| projeto | o que é | o que este plano herda dele |
|---|---|---|
| `AndroidStudioProjects/fluviapp-kmp` | Kotlin Multiplatform — domínio, dados (Firestore), UI Compose | O modelo real: `Passagem` selada, FSM `StatusPassagem`, `OcorrenciaViagem`, `Acomodacao`, cota de gratuidade, nomes das coleções |
| `VSCodeProjects/fluviapp` | monorepo web npm workspaces: `@fluviapp/domain`, `@fluviapp/design-system`, `@fluviapp/ui`, `apps/apresentacao` (Astro + ilhas React) | A arquitetura: domínio puro em TS, design system sem domínio, telas controladas sem estado, Astro estático + ilhas. E o `roteiroDaEmissao` — **o totem já é máquina de domínio lá** |

---

## Decisões de partida (travadas antes do passo 1)

| # | Decisão | Consequência |
|---|---|---|
| **DP1** | **Monorepo próprio**, com domínio **portado** (não importado) do fluviapp | Independência de release e de marca. Custo aceito: o subconjunto portado é mantido em sincronia manual — e por isso o porte é **mínimo** e tem teste de contrato |
| **DP2** | **Escrita real no Firestore, client-side**, protegida por Rules restritivas + App Check | A Fase 1 entrega clientela de verdade. O que protege o dado são as Rules, não o segredo da chave |
| **DP3** | **`RESERVADA` não entra na FSM da passagem.** Existe a coleção `reservas`, com tipo e ciclo próprios | Não toca `StatusPassagem` no KMP nem no TS, não toca as Rules de `passagens`. É a nota lateral do ADR-0026 do fluviapp aplicada: *o atendimento incompleto tem de ser outro tipo* |

**Por que DP3 é a decisão mais importante do plano.** `Passagem` é selada e coerente por construção: não existe `PassagemDePassageiro` sem titular, sem acomodação, sem status legível. Uma reserva feita por quem chega ao site é, por definição, **incompleta** — sem documento conferido, sem pagamento, sem funcionário emissor, sem agência atribuída. Admitir `RESERVADA` dentro da FSM obrigaria a tornar opcional tudo o que hoje é obrigatório, e isso desfaz por dentro a garantia que o app inteiro usa. A reserva é um **pedido**; a passagem é um **fato**. São dois tipos.

---

## A paleta, verificada antes de virar token

**As cores canônicas são as do arquivo oficial do logo**, não as aproximações do briefing. O pacote de marca
(`.../fluviapp/app/src/main/res/drawable/naveg-logos/`) declara e usa **`#FA8B17`** (laranja) e **`#103A5B`**
(azul-marinho); o briefing trazia `#FF6E31` e `#243763`. A escolha é para o wordmark entrar na página sem
retoque — dois laranjas quase iguais lado a lado no cabeçalho é a diferença que se nota. O marrom `#3A240E`
segue do briefing, e é dele que descem os neutros quentes.

Contraste calculado (WCAG 2.1):

| par | razão | veredito |
|---|---|---|
| `#103A5B` navy sobre `#FFFFFF` | **11,79:1** | AAA — texto de qualquer tamanho |
| `#3A240E` marrom sobre `#FFFFFF` | **14,60:1** | AAA |
| `#1B1006` marrom-tinta sobre `#FFFFFF` | **18,63:1** | AAA — é o texto de corpo |
| `#1B1006` marrom-tinta sobre `#FA8B17` | **7,70:1** | AAA — **é assim que se escreve em cima do laranja** |
| `#103A5B` navy sobre `#FA8B17` | **4,87:1** | AA — a única cor da marca que se lê sobre o laranja |
| `#FA8B17` laranja sobre `#FFFFFF` | **2,42:1** | ✗ **reprova para texto** |
| `#FFFFFF` branco sobre `#FA8B17` | 2,42:1 | ✗ **reprova** — o botão laranja com rótulo branco é a armadilha óbvia desta paleta |

**Regra que sai daí, e que virou cenário automatizado no passo 1:** o laranja é **superfície e acento, nunca
tinta de texto**. O botão primário é laranja **com rótulo marrom escuro**, não branco. Quando o laranja precisa
ser lido — link, número em evidência —, ele não é `#FA8B17`: é `--laranja-escuro` `#9A5207` (5,9:1 com branco,
4,7:1 com a areia mais escura). No tema escuro o papel é de `--laranja-claro` `#FDA84A` (8,4:1 com o fundo).

Tons escuros para bordas e texto, derivados do marrom: `#6B5443` (contorno de campo, 7,1:1), `#2A1A0A` (borda
forte) e `#1B1006` (texto de contraste máximo).

---

## Como ler os passos

Cada passo tem quatro blocos, e **os dois de análise são obrigatórios** — nenhum passo começa sem o anterior fechado nem sem o próximo entendido:

- **← Análise do passo anterior** — o que revalidar antes de tocar em código. Se falhar, volta-se, não se contorna.
- **Entrega** — artefatos concretos.
- **Aceite** — o que precisa ser verdade, verificável por comando ou por inspeção.
- **→ Análise do próximo passo** — o que este passo precisa ter deixado pronto para o seguinte não improvisar.

Ordem geral: **fundação → seções de exibição → domínio da reserva → seção totem → fronteira → handoff → mobile**.

---

# BLOCO A — Fundação

## Passo 0 — Esqueleto do monorepo e ADRs de abertura · ✅ concluído em 2026-09-22

**← Análise do passo anterior:** não há. O que se revalida é o ambiente: Node ≥22 (aqui: v22.14.0 ✔), npm 11 ✔.

**Entrega**
- `package.json` raiz com workspaces `packages/*` e `apps/*`, `type: module`, scripts `dev` / `build` / `test` / `typecheck` / `verify`.
- `tsconfig.base.json` com `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` — o mesmo rigor que faz o domínio do fluviapp ser confiável.
- `vitest.config.ts` na raiz.
- `docs/adr/ADR-0001-a-reserva-como-tipo-proprio.md` — registra DP3 com o trade-off escrito.
- `docs/adr/ADR-0002-a-escrita-client-side-e-o-que-a-protege.md` — registra DP2: Rules + App Check + auth anônima, e por que a chave pública não é segredo.
- `.gitignore`, `README.md`.

**Aceite**
- `npm install` limpo; `npm run typecheck` verde num monorepo ainda vazio.
- Os dois ADRs existem e dizem **o que foi recusado**, não só o que foi escolhido.

**→ Análise do próximo passo:** o passo 1 escreve CSS que nenhum componente ainda consome. Isso é de propósito — o vocabulário precisa existir antes de alguém inventar um `#FF6E31` solto no meio de um componente.

---

## Passo 1 — `packages/design-system`: a paleta NAVEG como duas camadas · ✅ concluído em 2026-09-22

**← Análise do passo anterior:** workspaces resolvendo, `typecheck` verde.

**Entregue**
- `src/tokens.css`, em duas camadas, com a fronteira **verificável**: todo semântico é um `var(...)`, todo
  primitivo é um valor literal. É essa régua que os cenários usam para saber quem é quem, sem convenção de nome.
  - **primitivos** — `--navy: #103a5b` e os cinco tons noturnos dele; `--laranja: #fa8b17`, `--laranja-escuro:
    #9a5207`, `--laranja-claro: #fda84a`; `--branco`, `--areia`, `--areia-2`, `--areia-dim`, `--cinza-borda`;
    `--marrom`, `--marrom-medio`, `--marrom-borda`, `--marrom-tinta`; tipografia, ritmo, `--alvo-toque: 56px`;
  - **semânticos** — `--bg`, `--bg-alt`, `--surface`, `--surface-2`, `--text`, `--text-body`,
    `--text-secondary`, `--border`, `--border-forte`, `--accent`, `--accent-superficie`,
    `--accent-contraste`, `--acao-bg`, `--acao-texto`, `--acao-bg-hover`, `--acao-texto-hover`,
    `--header-*`, `--foco`, `--sombra`. **Só estes** aparecem em componente.
- Tema escuro em duas passagens (`@media (prefers-color-scheme: dark)` guardado por
  `:root:not([data-theme='light'])` **e** `:root[data-theme='dark']`), recontrastado: o navy da marca vira a
  superfície do cartão e o laranja clareia para `--laranja-claro`.
- `src/base.css` — reset, tipografia fluida, `.faixa`/`.conteudo`, `.acao`, foco `:focus-visible`,
  `prefers-reduced-motion`, skip-link. **Zero valor de cor**: só tokens.
- `src/marca/naveg-horizontal.svg` e `naveg-empilhado.svg` — vetores oficiais, copiados do pacote de marca.
- `src/icones.ts` — `SlugIcone` como união fechada + `DESENHOS: Record<SlugIcone, Desenho>`. Um slug sem
  desenho **não compila**. As marcas da Meta estão simplificadas e marcadas para troca pelos assets oficiais
  antes do lançamento.
- `test/cor.ts` — leitor de `tokens.css` (blocos, declarações, resolução de `var()`) e a razão de contraste
  WCAG 2.1, em vinte linhas e sem dependência nova.
- `test/contraste.spec.ts` — 51 cenários: a tabela da marca medida, mais 17 pares de texto (≥4,5:1) e 5 pares
  de contorno (≥3:1), **nos dois temas**.
- `test/tokens.spec.ts` — 10 cenários: as duas camadas existem; nenhum bloco de tema introduz literal; todo
  `var()` resolve; **o bloco escuro declara exatamente os semânticos do claro**; **as duas formas do tema
  escuro são idênticas**; nenhuma cor escrita à mão fora do `tokens.css`; e os ícones (slug↔desenho, `path`
  não vazio, rótulo presente).

**Aceite — verificado**
- `npm run verify` verde: `tsc --build` sem erro e **61 cenários passando**.
- **Mutação testada:** trocar `--acao-texto` para `var(--branco)` derruba dois cenários
  (`--acao-texto lê-se sobre --acao-bg` e `o laranja da marca nunca é a tinta`). O guarda morde.
- A varredura de cor pegou dois comentários de `base.css` que ainda citavam a paleta antiga — corrigidos.

**→ Análise do próximo passo:** o passo 2 monta a casca. Ela vai precisar de `--header-bg` e das alturas de navegação — se não estiverem nos tokens agora, nascem hardcoded lá e nunca mais saem.

---

## Passo 2 — `apps/agencia`: casca da single page · ✅ concluído em 2026-09-22

**← Análise do passo anterior:** tokens publicados por subcaminho (`@naveg/design-system/tokens.css`), cenário de contraste verde.

> **Ajuste feito na entrada deste passo.** `<meta name="theme-color">` precisa de cor literal, e o lint do passo 1 proíbe. A saída foi `src/marca.ts` — uma **segunda e última** casa para valor de cor, fechada por cenário que a amarra aos tokens. Sem esse cenário seria exatamente o problema que a regra existe para impedir; com ele, divergir é build vermelho.
>
> **Duas correções ao que este passo previa.** A integração do React **não** entrou: nada a usa até o passo 8, e declará-la agora acrescentaria dependência que o build não exercita — o mesmo raciocínio que o manifesto do KMP aplica às permissões. E **não há menu sanfona**: toda sanfona sem JavaScript é truque (`<details>` forçado por CSS, rótulo de checkbox), e truque de disclosure é onde teclado e leitor de tela quebram. Com quatro itens de uma palavra numa página só, a navegação quebra em linha e fica toda visível.

**Decisão técnica:** **Astro `output: 'static'` + ilhas React**, como `apps/apresentacao`. A página é um documento institucional — capa, atendentes, depoimentos e rodapé não mudam depois do build e não devem custar um runtime de componente. **Só o totem é uma ilha**, hidratada com `client:visible`: o JavaScript da reserva desce quando alguém rola até ela. Uma SPA inteira em React mandaria o bundle do totem para quem só quer o telefone da agência.

**Entregue**
- `astro.config.mjs` — `output: 'static'`, `vite.ssr.noExternal` dos pacotes do workspace. Sem React (ver acima).
- `src/layouts/Pagina.astro` — `<head>`, canonical, OG/Twitter, `theme-color`, JSON-LD `Organization` **só com o que se sabe** (endereço, CNPJ e perfis entram no passo 6: um JSON-LD com campo inventado afirma ao buscador o que não se confirma), `lang="pt-BR"`, skip-link como primeiro elemento do corpo.
- `src/componentes/Topo.astro` — logo, navegação derivada de `menuDaPagina()`, ação "Reservar agora". Anel de foco próprio (`--header-foco`), porque `--foco` não alcança 3:1 sobre navy. Não gruda no topo abaixo de 40rem, onde um cabeçalho de três linhas comeria a tela.
- `src/componentes/Secao.astro` — moldura única, `aria-labelledby` no `<h2>`, **alternância de fundo derivada do índice**.
- `src/componentes/Rodape.astro` — a âncora `#contato` e o aviso "reserva, não venda". O resto é passo 6.
- `src/componentes/Pendente.astro` — o andaime, que marca na página o conteúdo que falta e o passo que o traz. Uma seção vazia fica **visivelmente** vazia, em vez de parecer pronta e curta.
- `src/pages/index.astro` — só a **ordem**.
- `src/conteudo/site.ts` e `secoes.ts` — todo texto como dado tipado; menu e âncoras **derivados** da lista de seções.
- `test/secoes.spec.ts` — 10 cenários: ids únicos, o rodapé não colide, todo item do menu aponta para âncora existente, nenhum rótulo vazio, a capa fora do menu, o contato por último, sem repetição, e **um item por seção que pede menu**.

**Aceite — verificado**
- `npm run build` gera `dist/` com **0 arquivo JavaScript**: 48 kB no total (HTML de 5,8 kB, uma folha de estilo, o SVG do logo). O único `<script>` é o JSON-LD, que não executa.
- `npm run verify` verde: `tsc --build`, `astro check` (11 arquivos, 0 erro / 0 aviso / 0 dica) e **72 cenários**.
- A varredura de cor do passo 1 segue verde com os cinco `.astro` novos — nenhum valor de cor fora das duas casas.
- **O cenário de contagem do menu foi escrito por cima de um susto real**: os outros cenários passariam com o menu incompleto, porque apontar só para âncoras válidas é necessário e não suficiente. Uma seção sumiria do menu em silêncio.

**→ Análise do próximo passo:** as seções 3–6 são conteúdo dentro desta casca. Se a moldura `<Secao>` não estiver resolvida aqui, cada seção vai inventar a sua — foi exatamente o que o ADR-0101 do fluviapp corrigiu ao derivar a alternância do índice em vez de repeti-la bloco a bloco.

---

# BLOCO B — As seções de exibição

## Passo 3 — Seção Capa (hero)

**← Análise do passo anterior:** `<Secao>` existe e a alternância de fundo é derivada, não escrita à mão.

**Entrega**
- Capa com proposta de valor, a travessia principal e **dois botões**: primário "Reservar passagem" (laranja, rótulo marrom — regra do passo 1) → `#totem`; secundário "Falar com atendente" → WhatsApp institucional.
- Marca NAVEG (wordmark SVG inline: escala sem borrar e aparece sem JS).
- Faixa de credibilidade: rotas atendidas, anos de operação, embarcações.
- Imagem do hero com `loading="eager"` + `fetchpriority="high"`; `width`/`height` declarados (sem layout shift).

**Aceite**
- LCP é o texto ou a imagem do hero, não um elemento tardio; CLS 0.
- Contraste do par botão/rótulo conferido pelo cenário do passo 1.

**→ Análise do próximo passo:** atendentes é a primeira lista de dados. Decidir **agora** se a lista é conteúdo estático em `conteudo/atendentes.ts` ou vem do Firestore. **Recomendação: estática na Fase 1** — são poucos, mudam devagar, e ler `funcionarios` publicamente exportaria a equipe inteira, o que é decisão de LGPD que ninguém pediu.

---

## Passo 4 — Seção Atendentes

**← Análise do passo anterior:** capa fechada; decisão "estático vs Firestore" tomada (estático).

**Entrega**
- `src/conteudo/atendentes.ts` — tipo `Atendente { nome, funcao, agencia, foto, whatsapp?, horario }`.
- Grade de cartões responsiva (`grid-template-columns: repeat(auto-fit, minmax(...))` — sem breakpoint escrito à mão).
- Cada cartão com ação **"Falar no WhatsApp"** usando o construtor de link do passo 10 (que ainda não existe — entra aqui como stub tipado, e o passo 10 o preenche).
- Fotos: `<picture>` com AVIF/WebP + fallback, `loading="lazy"`, `alt` descritivo.
- **LGPD:** só nome, função, agência, horário e canal de atendimento. Nenhum telefone pessoal em texto.

**Aceite**
- Grade não quebra em 320px nem em 1920px.
- Cenário que assere que todo atendente tem foto resolvida e `alt` não vazio.

**→ Análise do próximo passo:** depoimentos e redes. O ponto de atenção é que **feedback do usuário é entrada de dados** — se for formulário que escreve, cai no mesmo problema de segurança do totem e precisa esperar o passo 9. Se for vitrine de depoimentos já coletados, é estático e sai agora.

---

## Passo 5 — Seção Feedback + redes (Meta)

**← Análise do passo anterior:** padrão de cartão e de grade estabilizado no passo 4 — depoimento reusa, não reinventa.

**Entrega**
- **Vitrine de depoimentos** (estática, `conteudo/depoimentos.ts`): autor, cidade, travessia, nota, texto. Carrossel **opcional e acessível**: se houver, com botões reais, `aria-live` e operação por teclado; sem JS, vira lista rolável. Não é ilha React — é CSS scroll-snap.
- **Formulário de feedback**: fica **atrás do passo 9** (mesma fronteira Firestore do totem). Nesta etapa entram a marcação e a validação client-side; o envio é stub.
- **Links das redes Meta** — Facebook, Instagram e WhatsApp como canal: ícones do design system, `rel="noopener noreferrer"`, `aria-label` explícito ("NAVEG no Instagram, abre em nova aba"). **Sem embed oficial do Facebook/Instagram**: o SDK deles carrega rastreamento de terceiros e derruba o LCP. Link, não widget.

**Aceite**
- `axe` sem violação na seção; carrossel operável só com teclado.
- Nenhuma requisição a domínio de terceiro no build (cenário que varre o `dist/`).

**→ Análise do próximo passo:** o rodapé fecha a exibição. Depois dele o trabalho muda de natureza — sai de conteúdo e entra em domínio. É o ponto certo para uma revisão com o PO antes de gastar o esforço da reserva.

---

## Passo 6 — Rodapé e informações adicionais

**← Análise do passo anterior:** todas as seções de exibição publicadas e revisadas.

**Entrega**
- Colunas: **Institucional** (razão social, CNPJ, endereço das agências), **Atendimento** (telefones, horário, WhatsApp), **Navegação** (âncoras), **Legal** (Política de Privacidade, Termos, LGPD e encarregado).
- `<address>` semântico; `tel:` e `mailto:` reais.
- Aviso obrigatório da Fase 1, em destaque: **"Este canal gera reserva, não venda. A emissão da passagem é feita pelo atendimento."** Essa frase precisa aparecer em três lugares — rodapé, topo do totem e mensagem do WhatsApp. É a expectativa que evita reclamação.
- Selo de acessibilidade e link "Voltar ao topo".

**Aceite**
- Lighthouse mobile: Acessibilidade ≥95, SEO ≥95, Performance ≥90.
- Marco: **a página institucional está completa e publicável sem o totem.**

**→ Análise do próximo passo:** o passo 7 é domínio puro, sem tela. É o passo que decide se o totem vai ser confiável — e é onde o tempo deve ser gasto.

---

# BLOCO C — O totem

## Passo 7 — `packages/domain`: o domínio da reserva (sem tela, sem Firebase)

**← Análise do passo anterior:** exibição fechada. Revalidar que nenhuma seção precisou de React — se precisou, a decisão do passo 2 merece revisão antes de seguir.

**O porte mínimo** do `@fluviapp/domain`, mantendo **os mesmos valores canônicos** (é o que faz o documento gravado aqui ser legível lá):

```
primitivos/fronteira.ts      deValor, casoImpossivel, rotuloDoNome
primitivos/calendario.ts     DataCalendario (ISO yyyy-MM-dd, ordena lexicograficamente)
primitivos/dia-semana.ts     DiaSemana
passagem/categoria-passagem  PASSAGEIRO | VEICULO
passagem/acomodacao          REDE(1) | SUITE(3) | CAMAROTE(3) + tiposPermitidos + temEscolhaDeTipo
passagem/tipo-passagem       INTEIRA | MEIA | GRATUIDADE
passagem/tipo-gratuidade     IDOSO | PCD | CRIANCA_ATE_5 | PASSE_FEDERAL
passagem/classe-veiculo      + exigeModelo / exigeCilindrada
documento/tipo-documento     + validação por tipo
viagem/tipo-embarcacao       + levaVeiculo / classesAdmitidas
viagem/ocorrencia-viagem     (viagemId, data)
viagem/hora-do-dia           formatarHora
```

**O que é novo** — e é a peça central:

- **`reserva/reserva.ts`** — o tipo `Reserva`, próprio, **que não é `Passagem`**:
  ```
  Reserva { codigo, ocorrencia, categoria, contato, status, origem, criadoEm, expiraEm, passagemId? }
  ReservaDePassageiro { acomodacao, tipo, gratuidade?, passageiros[] }
  ReservaDeVeiculo    { classe, veiculo, responsavel? }
  ```
  `passageiros` guarda **nome + documento + nascimento**, não `clienteId` — na Fase 1 não há pool de clientes acessível ao público, e inventar id no cliente criaria referência quebrada. O app resolve o pool na emissão.

- **`reserva/status-reserva.ts`** — FSM **própria e pequena**: `RESERVADA → CONVERTIDA | EXPIRADA | CANCELADA`, as três terminais. A web **só escreve `RESERVADA`**; toda transição é do app autenticado.

- **`reserva/roteiro-da-reserva.ts`** — adaptação declarada do `roteiroDaEmissao`. Duas diferenças, e as duas são de domínio:
  - **sem o passo `PAGAMENTO`** — não se vende aqui, então não há lançamento nem `pagamentoConcluido`;
  - **com o passo `CONTATO`** (nome + WhatsApp de quem reserva), antes da conferência — é a razão de existir da Fase 1: formar clientela. É o único passo que o roteiro da emissão não tem e este tem.

  Todo o resto é consequência das mesmas regras: veículo só aparece se o casco leva; tipo tarifário só onde a acomodação dá escolha; subtipo de gratuidade porque gratuidade sem subtipo não se escreve; um passo por acompanhante.

- **`reserva/codigo-da-reserva.ts`** — gerador do código humano `NVG-XXXXXX`, base32 Crockford (sem I/L/O/U — não se confunde ao ditar no telefone). **Não é sequencial**: contador sequencial exige transação com leitura, e leitura é justamente o que as Rules vão negar ao público. O código **é o id do documento**, e colisão vira `create` negado pela regra → nova tentativa. Fail-closed por construção.

- **`reserva/documento.ts`** — o codec `ReservaDocumento ⇄ Reserva`, com a mesma disciplina do `PassagemDocumento`: campos de consulta no topo (`status`, `viagemId`, `data`, `agenciaId`), sub-objeto **ausente ou inteiro**, e `paraDominio()` que **recusa** o que não reconhece em vez de inventar padrão.

**Aceite — aqui o esforço de teste se concentra**
- Cenários vitest sobre: a sequência do roteiro em cada ramo (rede/suíte/camarote × inteira/meia/gratuidade × 1–3 pessoas; veículo por classe); `respondido` por nó; o codec ida-e-volta; as recusas do codec; o gerador de código (alfabeto, tamanho, ausência de caracteres ambíguos).
- **Cenário de contrato com o KMP:** uma tabela que confere que `Acomodacao`, `TipoPassagem`, `TipoGratuidade`, `CategoriaPassagem`, `TipoDocumento` e `ClasseVeiculo` têm exatamente os mesmos valores canônicos dos enums Kotlin. É o que transforma a divergência do porte manual em build vermelho, em vez de dado ilegível em produção.
- **Zero import de React, Astro ou Firebase** neste pacote (cenário estrutural).

**→ Análise do próximo passo:** o passo 8 desenha o roteiro. Se qualquer opção de qualquer passo puder ser montada na tela, a garantia se perde — as opções têm de chegar **dentro do nó**, como no fluviapp. Conferir isso antes de abrir o primeiro `.tsx`.

---

## Passo 8 — Seção Totem (a ilha React)

**← Análise do passo anterior:** roteiro coberto por cenários; nenhum `opcoes` montado fora do domínio.

**Entrega**
- `packages/ui` — componentes **controlados**, sem estado de aplicação: `PassoDaReserva`, `EscolhaEmCartoes`, `FormularioDePassageiro`, `FormularioDeVeiculo`, `FormularioDeContato`, `Conferencia`, `IndicadorDePasso` ("passo 3 de 7", que **cresce** conforme o caminho), `ReservaConcluida`.
- `apps/agencia/src/ilhas/Totem.tsx` — o único `client:visible` da página. Guarda `RespostasDaReserva` em `useState`, chama `roteiroDaReserva`, desenha o nó em foco. **Voltar apaga a resposta do nó anterior**, derivado do roteiro e sem pilha paralela — dois registros da mesma coisa divergem.
- **Escolha da travessia** antes do primeiro passo: origem → destino → data → horário. A fonte entra no passo 9; aqui o totem depende de uma interface `CatalogoDeViagens`, com implementação de exemplo.
- Ergonomia de totem, que é o que diferencia esta seção do resto da página: alvos de toque ≥56px, um passo por vez, sem scroll dentro do passo, `inputmode` correto em campo numérico, e **timeout de inatividade que zera o formulário** — é um terminal público, e o dado do próximo cliente não pode nascer preenchido com o do anterior.
- Aviso permanente no topo da seção: **reserva, não venda**.
- Modo quiosque: a seção tem `id="totem"` e também responde em `/totem` como página cheia, para rodar num terminal físico sem o resto da página.

**Aceite**
- Fluxo completo navegável só por teclado; `aria-live` anuncia a troca de passo.
- Cenários `@testing-library/react`: gratuidade acrescenta o passo do subtipo; suíte para 3 acrescenta dois passos; casco lancha faz "Veículo" **não existir** como opção (não desabilitada); voltar apaga a resposta certa; timeout limpa tudo.
- Bundle da ilha medido e registrado no README (referência: o totem do fluviapp custa 15 kB / 5,4 kB comprimido).

**→ Análise do próximo passo:** até aqui nada saiu do navegador. O passo 9 abre a primeira porta de escrita pública do sistema — é o passo de maior risco do plano e o único que exige revisão de segurança antes do deploy.

---

# BLOCO D — Fronteira e handoff

## Passo 9 — Fronteira Firestore: Rules, App Check e escrita

**← Análise do passo anterior:** o totem fecha o fluxo inteiro em memória e produz uma `Reserva` coerente.

**Entrega**
- `packages/dados` — `ReservaRepositorio` (porta) + `ReservaFirestoreRepositorio` (adaptador, Firebase Web SDK modular, importando só o que usa). O totem depende da **porta**; os cenários usam uma implementação em memória.
- **Auth anônima** ao carregar a ilha: dá um `request.auth.uid` para as Rules amarrarem e para carimbar `criadoPor`.
- **App Check com reCAPTCHA Enterprise**, obrigatório para `reservas` — é a resposta atual para escrita pública sem login. Sem ele, a coleção é um formulário aberto na internet.
- **Firestore Rules**, o núcleo da proteção:
  ```
  match /reservas/{codigo} {
    allow create: if request.auth != null
                  && request.resource.data.status == 'RESERVADA'
                  && request.resource.data.origem == 'TOTEM_WEB'
                  && request.resource.data.criadoPor == request.auth.uid
                  && request.resource.data.keys().hasOnly([ ...campos previstos... ])
                  && request.resource.data.data.matches('^\\d{4}-\\d{2}-\\d{2}$')
                  && request.resource.data.passageiros.size() <= 3;
    allow read, update, delete: if false;   // o público nunca lê, nunca altera
  }
  ```
  Leitura e transição (`CONVERTIDA`, gravar `passagemId`) ficam em regra separada, exigindo funcionário autenticado — é o app mobile que as usa.
- **Catálogo público** (`rotas`, `portos`, `viagens`, `embarcacoes` com `ativo == true`): `allow read: if true`, porque horário de travessia é informação pública. **Decisão a ratificar com o analista** — é a única ampliação de leitura que este plano propõe. Alternativa: JSON gerado no build, que não fica obsoleto se o deploy for frequente.
- **Índices compostos** declarados em `firestore.indexes.json` para `(status, data)` e `(agenciaId, data)`.

**Aceite**
- **Cenários de Rules com `@firebase/rules-unit-testing` no emulador** — os mais importantes do plano inteiro: público não lê; público não atualiza; `create` com status diferente de `RESERVADA` é negado; campo extra é negado; `criadoPor` forjado é negado; código já existente é negado (a colisão).
- Escrita real ponta a ponta contra o emulador.
- **Revisão de segurança antes do deploy.** Este passo não vai a produção sem ela.

**→ Análise do próximo passo:** com a reserva gravada e o código na mão, falta entregá-la a um humano. O passo 10 é curto e é o que o cliente percebe como o produto.

---

## Passo 10 — Handoff para o WhatsApp

**← Análise do passo anterior:** gravação confirmada; o código devolvido é o id real do documento.

**Entrega**
- `packages/domain/reserva/link-de-atendimento.ts` — **função pura**, testável sem navegador:
  ```
  https://wa.me/55DDDNNNNNNNNN?text=<encodeURIComponent(mensagem)>
  ```
  `wa.me` é a forma atual e oficial; `api.whatsapp.com/send` é legada. Número em E.164 sem `+`, sem espaço, sem traço.
- A mensagem, montada a partir do domínio, curta e com o código na primeira linha:
  ```
  Reserva NVG-7K3QP2
  Manaus -> Parintins · ter, 14/10 · 18:00
  Rede · 1 pessoa · Maria Souza
  Abrir no app: https://agencia.naveg.com.br/r/NVG-7K3QP2
  ```
- Tela de conclusão com: código **em destaque e copiável**, botão "Enviar ao atendimento" (`target="_blank"`, `rel="noopener"`), **e o código em texto** — o redirecionamento pode falhar (bloqueador de pop-up, desktop sem WhatsApp) e o cliente não pode sair de mãos vazias.
- Quiosque: no totem físico o redirecionamento não faz sentido. Ali a conclusão mostra o **QR do link** — a pessoa aponta o celular e cai na conversa já preenchida.

**Aceite**
- Cenários sobre o construtor: acentos e caracteres especiais escapados; quebra de linha preservada; número normalizado; a mensagem sempre contém o código.
- E2E Playwright **assere o `href`**, sem navegar para fora.

**→ Análise do próximo passo:** o link `/r/{codigo}` da mensagem precisa abrir o app. Isso é trabalho no KMP, e é o único passo fora deste repositório.

---

## Passo 11 — Deeplink: o atendente cai direto na reserva

**← Análise do passo anterior:** a mensagem carrega uma URL estável e única por reserva.

**Levantamento feito no KMP:** `androidApp/src/main/AndroidManifest.xml` tem **apenas** o `intent-filter` de `MAIN/LAUNCHER`. **Não existe deeplink hoje, em nenhuma forma** — nem esquema próprio, nem App Link. Tudo abaixo é construção nova.

**Recomendação — a forma atual é Android App Links, não esquema customizado.** Esquema próprio (`fluviapp://`) não é verificado, qualquer app pode registrar o mesmo e — decisivo aqui — o navegador interno do WhatsApp frequentemente o ignora. App Links são `https://` verificados pelo domínio: abrem o app sem diálogo de escolha e, sem o app instalado, abrem a página web. O mesmo link serve aos dois casos, que é exatamente o que o atendimento precisa.

**Entrega — no `naveg-front`**
- `public/.well-known/assetlinks.json` com `package_name` e o SHA-256 do certificado de assinatura — o de **release** *e* o de **upload**, se houver Play App Signing. Esquecer o de upload é o erro clássico que faz a verificação passar em teste e falhar em produção. Servido em `https`, `content-type: application/json`, **sem redirecionamento**.
- Página de fallback `/r/[codigo]` — mostra o código e instrui o atendente. É o que abre no desktop.
- iOS (o módulo `iosApp` já existe no KMP): `public/.well-known/apple-app-site-association` para Universal Links, no mesmo caminho `/r/*`.

**Entrega — no `fluviapp-kmp`**
- No manifest, `android:launchMode="singleTask"` na `AtividadePrincipal` e:
  ```xml
  <intent-filter android:autoVerify="true">
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https" android:host="agencia.naveg.com.br" android:pathPrefix="/r/" />
  </intent-filter>
  ```
- Tratamento do intent em `AtividadePrincipal` — `intent.data` na criação **e** `onNewIntent`; sem o segundo, o app já aberto ignora o link. Dali para um novo `Destino` em `ui/navegacao/Destino.kt` → tela que carrega a reserva pelo código e oferece **"Emitir passagem a partir desta reserva"**, que é onde a `Reserva` vira `Passagem` e nasce em `A_EMITIR`.
- Hedge para o navegador interno do WhatsApp, caso a verificação não resolva: link `intent://` com `S.browser_fallback_url`, servido pela página `/r/`.

**Aceite**
- `adb shell pm get-app-links br.com.fluviapp.android` → `verified` para o domínio.
- `adb shell am start -a android.intent.action.VIEW -d "https://agencia.naveg.com.br/r/NVG-7K3QP2"` abre a reserva, com o app fechado **e** com o app já aberto.
- Sem o app instalado, o mesmo link abre a página web.

**→ Análise do próximo passo:** o circuito está fechado. O que resta é provar que ele se sustenta.

---

## Passo 12 — Endurecimento: acessibilidade, performance e E2E

**← Análise do passo anterior:** fluxo completo — reserva → Firestore → WhatsApp → app — funcionando ponta a ponta.

**Entrega**
- **Playwright**: jornada completa em Chromium e WebKit, mobile e desktop; navegação só por teclado; a página institucional **sem JavaScript** continua legível e com todos os contatos alcançáveis.
- **`@axe-core/playwright`** por seção, no CI.
- Orçamento de performance no CI: JS total da página institucional = 0; ilha do totem com teto declarado.
- CSP, `Permissions-Policy`, `Referrer-Policy`; `preconnect` só para o domínio do Firestore.
- Meta: OG image, `sitemap.xml`, `robots.txt`.
- `docs/RUNBOOK.md`: o que fazer quando o App Check bloquear reservas legítimas, como girar o certificado sem quebrar App Links, como expirar reservas antigas.

**Aceite**
- CI verde: `typecheck`, `test`, `test:rules`, `e2e`, `axe`, orçamento de bundle.
- Lighthouse mobile ≥90 nas quatro categorias.

---

## Resumo da ordem

```
A · Fundação     0 monorepo+ADRs -> 1 design system -> 2 casca Astro
B · Exibição     3 capa -> 4 atendentes -> 5 feedback+redes -> 6 rodapé     <- publicável aqui
C · Totem        7 domínio da reserva -> 8 ilha do totem
D · Fronteira    9 Rules+App Check -> 10 WhatsApp -> 11 deeplink -> 12 endurecimento
```

**Marco de valor antecipado:** ao fim do passo 6 a página institucional é publicável e útil, sem nenhuma linha de Firebase. O totem entra por cima, sem reforma — porque a casca já foi desenhada para recebê-lo como ilha.

## Riscos registrados

| risco | onde aparece | mitigação |
|---|---|---|
| Domínio portado divergir do KMP | passo 7 | Cenário de contrato sobre os valores canônicos dos enums — divergência vira build vermelho |
| Escrita pública abusada | passo 9 | App Check + auth anônima + Rules `create`-only com forma fechada + revisão de segurança obrigatória |
| App Links não verificarem | passo 11 | SHA-256 de release **e** de upload no assetlinks; fallback `intent://`; página web sempre funcional |
| Laranja reprovando contraste | passo 1 | Cenário de contraste sobre os tokens; laranja é superfície, nunca tinta de texto pequeno |
| Reserva virar expectativa de venda | passos 6, 8, 10 | A frase "reserva, não venda" nos três pontos: rodapé, topo do totem, mensagem do WhatsApp |
| Dado do cliente anterior vazar no totem físico | passo 8 | Timeout de inatividade que zera o formulário |
