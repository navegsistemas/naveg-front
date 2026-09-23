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
| **`Documents/AndroidStudioProjects/fluviapp`** | **o aplicativo Android — a gestão comercial em produção**, e a fonte da verdade (revisão de 2026-09-22) | O domínio **atual**: 17 classes de veículo por natureza, o `roteiroDe` da emissão, o `Cliente` e a chave natural, `ViagemSemana` e a disponibilidade, a concessão por atuação, as Rules e os índices do projeto. É contra ele que o contrato confere |
| `AndroidStudioProjects/fluviapp-kmp` | Kotlin Multiplatform — **atrás do aplicativo** (sem `ClasseVeiculo`, `NaturezaVeiculo`, `TipoDocumento`) | O modelo real: `Passagem` selada, FSM `StatusPassagem`, `OcorrenciaViagem`, `Acomodacao`, cota de gratuidade, nomes das coleções |
| `VSCodeProjects/fluviapp` | monorepo web — **atrás do aplicativo** no domínio; referência de arquitetura: `@fluviapp/domain`, `@fluviapp/design-system`, `@fluviapp/ui`, `apps/apresentacao` (Astro + ilhas React) | A arquitetura: domínio puro em TS, design system sem domínio, telas controladas sem estado, Astro estático + ilhas. E o `roteiroDaEmissao` — **o totem já é máquina de domínio lá** |

---

## Decisões de partida (travadas antes do passo 1)

| # | Decisão | Consequência |
|---|---|---|
| **DP1** | **Monorepo próprio**, com domínio **portado** (não importado) do fluviapp | Independência de release e de marca. Custo aceito: o subconjunto portado é mantido em sincronia manual — e por isso o porte é **mínimo** e tem teste de contrato |
| **DP2** | ~~Escrita real no Firestore, **client-side**~~ → **invertida em 2026-09-22**: a agência tem servidor próprio (duas rotas na Vercel), e o navegador não fala com o Firestore | A Fase 1 entrega clientela de verdade. O que protege o dado é a conta de serviço ficar no servidor e o domínio validar lá — ver a **segunda emenda** do ADR-0002 |
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
- `docs/adr/ADR-0002-a-escrita-client-side-e-o-que-a-protege.md` — registra DP2: Rules + App Check + auth anônima, e por que a chave pública não é segredo. **Duas emendas em 2026-09-22**: a auth anônima abre as Rules do fluviapp, e a escrita deixa de ser client-side.
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

**← Análise do passo anterior:** tokens publicados por subcaminho (`@navegsistemas/design-system/tokens.css`), cenário de contraste verde.

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

## Passo 3 — Seção Capa (hero) · ✅ concluído em 2026-09-22

**← Análise do passo anterior:** `<Secao>` existe e a alternância de fundo é derivada, não escrita à mão.

**Dados recebidos do cliente:** travessia **Belém ⇄ Macapá** (nos dois sentidos), **15 anos** de operação, **3 ferry boats** — F/B Regional, F/B Maria Ivanir e F/B Maria Eduarda. Pedido adicional: **carrossel automático** na capa, exibindo as embarcações, com wireframe pronto para receber as fotos.

**Entregue**
- `conteudo/capa.ts` — título, lead, as duas ações e as credenciais. A **rota vem primeiro** porque é o filtro: quem não vai a Macapá não tem o que fazer no resto da página, e descobrir isso no terceiro item seria ler três vezes mais para chegar a um "não".
- `Capa.astro` — `<h1>`, lead, botão primário (laranja, rótulo marrom) → `#totem` e secundário → `#atendentes`. O secundário **não** aponta para o WhatsApp: o número é pendência do passo 10, e botão que leva a lugar nenhum é pior que botão que leva a menos.
- `Icone.astro` — desenha a geometria do design system. `rotulado` é decisão do chamador: ícone ao lado de texto é decoração (`aria-hidden`), ícone sozinho precisa de nome.
- `conteudo/embarcacoes.ts` — a flotilha **e** `quadrosDaVitrine`, que gera os `@keyframes` a partir da quantidade.
- `VitrineDeEmbarcacoes.astro` — o carrossel.
- `public/embarcacoes/LEIA-ME.md` — o que colocar, em que formato, e como ligar.
- `test/vitrine.spec.ts` — 10 cenários sobre a flotilha e os quadros.

**O carrossel, e as três decisões que ele exigiu**

1. **É CSS, não JavaScript.** Carrossel costuma ser a primeira coisa a furar o orçamento de 0 kB. Aqui o desfile é uma `@keyframes` sobre o trilho, e o laço sem emenda vem de uma **cópia do primeiro item no fim da fila**: o último quadro leva o trilho até ela, o ciclo reinicia em `0%` mostrando o original, e o salto é invisível porque os dois são idênticos. É o truque que dispensa o script que normalmente reposiciona o trilho. A cópia é `aria-hidden`.
2. **Os quadros são derivados.** Três itens têm percentuais `0%`, `33,33%`, `66,67%`. Escritos à mão, seguiriam iguais no dia do quarto barco — e o defeito não seria erro de build, seria o quarto slide **nunca aparecer**, numa página que continua bonita. `quadrosDaVitrine` os calcula, e tem cenário que cobre 1, 3, 4, 7 e 12 itens.
3. **A WCAG 2.2.2 pede um jeito de parar** qualquer movimento automático acima de 5s. É uma caixa de seleção nativa, fora da tela mas dentro da tabulação, com o rótulo como face — operável por teclado, anunciada por leitor de tela, sem uma linha de script. Pausar no `:hover` também acontece, mas **hover não é o mecanismo**: quem usa toque não tem hover. E `prefers-reduced-motion` troca o desfile por uma grade com as três à vista — congelar no primeiro slide esconderia duas.

Nada de `aria-roledescription="carrossel"`: esse papel promete controles de slide que aqui não existem. O que existe é uma **lista de três itens, inteira no HTML**, que quem usa leitor de tela recebe sempre, sem depender da animação.

**Aceite — verificado**
- `npm run verify` verde: `tsc`, `astro check` (0 erro / 0 aviso / 0 dica) e **82 cenários**.
- **O orçamento se manteve: 0 arquivo JavaScript**, com o carrossel funcionando. `dist/` em 60 kB, `index.html` em 13,9 kB.
- LCP é o `<h1>`, que é texto — não há o que baixar antes de a primeira coisa aparecer. As fotos ficam abaixo da dobra e são `lazy`.
- Dois defeitos meus, pegos aqui: o gerador emitia `translateX(-0%)` (válido, feio, e `-0 !== 0` no cenário), e o `define:vars` do Astro carimbava `--vitrine-duracao` em **todo** elemento do componente — a variável foi para o atributo do único elemento que a consome.

**→ Análise do próximo passo:** atendentes é a primeira lista de dados. Decidir **agora** se a lista é conteúdo estático em `conteudo/atendentes.ts` ou vem do Firestore. **Recomendação: estática na Fase 1** — são poucos, mudam devagar, e ler `funcionarios` publicamente exportaria a equipe inteira, o que é decisão de LGPD que ninguém pediu.

---

## Passo 4 — Seção Atendimento · ✅ concluído em 2026-09-22

**← Análise do passo anterior:** capa fechada; decisão "estático vs Firestore" tomada (estático).

**Dados recebidos do cliente:** agência é a própria NAVEG (uma só); "Atendente" é a função; nome fica como placeholder; horário **24 h**; por ora **um atendente com um WhatsApp**, com potencial de expansão; e a seção deve argumentar que do outro lado há quem entende do negócio.

**Entregue**
- `conteudo/whatsapp.ts` — `normalizarTelefone` e `linkDeWhatsApp`, puros. **Antecipados do passo 10**, porque esta seção já precisa da metade que não depende da reserva. No passo 10 mudam de casa para `@navegsistemas/domain`; a assinatura não muda, porque o que a reserva acrescenta é o texto, não o mecanismo.
- `conteudo/atendimento.ts` — os três pontos do argumento e a lista de atendentes.
- `Atendimento.astro` — duas colunas: o argumento à esquerda, quem o cumpre à direita.
- `public/atendentes/LEIA-ME.md`.
- `test/atendimento.spec.ts` — 13 cenários.

**As quatro decisões**

1. **Duas colunas, e não uma grade de cartões.** Com **um** atendente, uma grade de três colunas pareceria quebrada — um cartão solto à esquerda e dois buracos. Aqui o cartão tem um lado inteiro, e a coluna vira grade `auto-fit` sozinha quando o segundo chegar. O layout de hoje não é o layout de amanhã diminuído; é o mesmo, com um item.
2. **`ATENDENTES` já é lista, com um elemento.** Podia ser um objeto. Não é: acrescentar o segundo passa a ser **uma entrada**, e não uma refatoração de componente no dia em que o time crescer.
3. **O campo `agencia` não existe.** Com uma agência só, ele diria "NAVEG" em todo cartão — informação que não distingue nada gasta a atenção de quem lê. Volta quando houver a segunda, e aí passa a distinguir.
4. **Nada foi preenchido com valor inventado.** Nome, foto e número aparecem como **wireframe**, na linguagem da vitrine. Nome de mentira numa página institucional é exatamente o que vai a produção porque parecia pronto. E onde não há número, **não há botão**: um botão que não abre conversa promete e falha na frente de quem precisava.

**O cenário que mais paga o próprio custo** é o do telefone. Um número anotado como as pessoas escrevem — `(91) 98888-7777` — colocado cru num `wa.me` **não dá erro em lugar nenhum**: dá um link que abre e não acha ninguém, na única página em que o cliente tentava falar com a empresa. `normalizarTelefone` aceita as seis formas usuais e **quebra o build** no que não resulta em `55` + DDD + 9 dígitos.

**Aceite — verificado**
- `npm run verify` verde: `tsc`, `astro check` (0/0/0) e **95 cenários**.
- **0 arquivo JavaScript** mantido. `dist/` em 72 kB, `index.html` em 17,4 kB.
- A grade não quebra em 320px nem em 1920px: o cartão é `minmax(13rem, 1fr)` e as colunas colapsam em 56rem.
- **LGPD:** só função, horário e canal. Nenhum dado pessoal além do nome, quando ele chegar.

**→ Análise do próximo passo:** depoimentos e redes. O ponto de atenção é que **feedback do usuário é entrada de dados** — se for formulário que escreve, cai no mesmo problema de segurança do totem e precisa esperar o passo 9. Se for vitrine de depoimentos já coletados, é estático e sai agora.

---

## Passo 5 — Seção Avaliações + redes (Meta) · ✅ concluído em 2026-09-22

**← Análise do passo anterior:** padrão de cartão e de grade estabilizado no passo 4 — a avaliação reusa, não reinventa.

**Decisão do cliente:** **só a vitrine, com wireframe.** O formulário de avaliação sai do escopo da Fase 1.

**Entregue**
- `conteudo/depoimentos.ts` — o modelo de depoimento, a lista (**vazia**), os moldes e as redes.
- `Depoimentos.astro` — a vitrine, com molde em branco enquanto não há avaliação, e o bloco de redes.
- `test/depoimentos.spec.ts` — 8 cenários.

**As quatro decisões**

1. **A lista está vazia, e isso é o conteúdo.** Não há entrada de exemplo no arquivo, de propósito: depoimento inventado é a peça de conteúdo falso **mais fácil de deixar passar** — tem nome de gente, cidade de verdade, e ninguém no code review pergunta se aquela pessoa existe. Com a lista vazia, a página desenha três moldes em branco: a forma fica demonstrável e o texto falso **não existe no repositório**, então não tem como ir a produção.
2. **O molde é `aria-hidden`.** Para quem usa leitor de tela, três cartões vazios são ruído; o que importa ali é a frase que diz que ainda não há avaliações, e ela está no HTML.
3. **Sem formulário, e a razão é de segurança, não de escopo.** Coletar avaliação é **escrever dado**, e escrita pública cai na mesma fronteira do totem — Rules, App Check, revisão do passo 9 (ADR-0002). Deixá-lo para depois do totem faz o formulário **reaproveitar** a fronteira já montada e revisada, em vez de abrir uma segunda.
4. **Link, não widget.** Nada de embed oficial do Facebook/Instagram: o SDK deles carrega rastreamento de terceiros e derrubaria o orçamento de 0 kB. E o **WhatsApp não entra entre as redes** — ele é canal de atendimento, já tem botão e mensagem pronta na seção anterior; repeti-lo aqui daria dois caminhos para a mesma conversa, e o daqui iria sem contexto nenhum.

**Os dois cenários que protegem contra conteúdo que parece certo**

- **Nota fora da escala.** Nota 7 numa escala de 5 desenha sete estrelas sem erro nenhum, e a página passa a afirmar uma avaliação que a escala não comporta.
- **URL de rede no domínio errado.** Um link colado errado leva a página institucional da empresa para o perfil de outra pessoa, e ninguém confere clicando. O build confere: `https` obrigatório e o *hostname* tem de pertencer ao domínio daquela rede.

**Aceite — verificado**
- `npm run verify` verde: `tsc`, `astro check` (0/0/0) e **103 cenários**.
- **0 arquivo JavaScript** mantido. `dist/` em 84 kB, `index.html` em 25,7 kB.
- No HTML gerado: a frase de vitrine vazia, 3 moldes, 15 estrelas apagadas e 2 redes pendentes.
- Nenhuma requisição a domínio de terceiro no build.

**→ Análise do próximo passo:** o rodapé fecha a exibição. Depois dele o trabalho muda de natureza — sai de conteúdo e entra em domínio. É o ponto certo para uma revisão com o PO antes de gastar o esforço da reserva.

---

## Passo 6 — Rodapé e informações adicionais · ✅ concluído em 2026-09-22

**← Análise do passo anterior:** todas as seções de exibição publicadas e revisadas.

**Decisão do cliente:** **wireframe e placeholders** — os dados institucionais entram depois.

**Entregue**
- `conteudo/rodape.ts` — identificação, contato, endereços (Belém e Macapá), links legais e o canal do encarregado. **Todo campo é `string | null`, e nenhum foi preenchido com valor plausível.**
- `conteudo/cnpj.ts` — porte de `Cnpj.kt` do `fluviapp-kmp`: dígito verificador com os pesos cíclicos de 2 a 9, recusa de sequência repetida, formatação que serve também ao parcial.
- `conteudo/telefone.ts` — a normalização saiu de `whatsapp.ts` e virou módulo próprio, porque o rodapé pode trazer **fixo** e a regra do WhatsApp é estrita a celular. Duas cópias da regra do código do país é a duplicação que envelhece torta: uma passa a aceitar o que a outra recusa, e ninguém nota até o link não abrir.
- `Falta.astro` — o irmão menor do `Pendente`: aquele marca um bloco, este marca **um valor**. É texto de verdade no HTML, não `content:` de CSS — quem usa leitor de tela precisa saber que ali falta dado, não encontrar silêncio.
- `Rodape.astro` — cinco colunas (A empresa, Atendimento, Onde estamos, Navegação, Legal), a faixa do aviso, a base com assinatura, redes e "Voltar ao topo". `<address>` semântico, `tel:` e `mailto:` reais.
- `test/rodape.spec.ts` — 16 cenários.

**As três decisões**

1. **Nenhum campo foi preenchido "para ver como fica".** Um CNPJ plausível num rodapé institucional não é um lugar-tenente inofensivo: número de documento é exatamente o que ninguém confere, e a empresa passaria a publicar a identificação de outra. O rodapé desenha o lugar do campo e **diz que ele falta**.
2. **A LGPD entrou agora, não no lançamento do totem.** O totem vai tratar nome, documento, nascimento e telefone — isso põe a NAVEG na lei como controladora, com política de privacidade e canal do encarregado (art. 41) obrigatórios. Declará-los como pendência hoje é melhor do que descobri-los no dia em que já forem bloqueantes. Há cenário que impede a política de **sumir da lista**, porque sumir é como ela deixa de ser providenciada.
3. **As redes só aparecem no rodapé quando têm endereço.** Na seção de avaliações a pendência é mostrada, para ser preenchida; duas fileiras de chip tracejado na mesma página seriam a mesma cobrança feita duas vezes.

**Os cenários protegem valores que parecem certos quando estão errados**

CNPJ com um dígito trocado, sequência repetida (que **passa** na conta dos verificadores e é o que alguém digita para vencer um campo obrigatório), telefone que o discador não abre, e-mail sem arroba, link legal apontando para o nada. Nenhum deles quebra a página — todos quebram a confiança de quem tentou usar.

**Aceite — verificado**
- `npm run verify` verde: `tsc`, `astro check` (0/0/0) e **119 cenários**.
- **0 arquivo JavaScript** mantido. `dist/` em 88 kB, `index.html` em 28,5 kB.
- No HTML gerado: as 9 pendências do rodapé como texto, e o **único bloco pendente restante é o "Passo 8"** — o totem.
- 🏁 **Marco: a página institucional está completa e publicável, sem uma linha de Firebase.**

**→ Análise do próximo passo:** o passo 7 é domínio puro, sem tela. É o passo que decide se o totem vai ser confiável — e é onde o tempo deve ser gasto.

---

# BLOCO C — O totem

## Passo 7 — `packages/domain`: o domínio da reserva (sem tela, sem Firebase) · ✅ concluído em 2026-09-22, revisado contra o aplicativo

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

> **Revisão de 2026-09-22 — o que mudou em relação ao texto abaixo.** O porte foi conferido contra o
> **aplicativo** fluviapp (17 classes de veículo por natureza, roteiro natureza → classe), e a reserva perdeu
> toda identificação: **o totem não exige documento** — sem `passageiros`, sem nascimento, sem responsável,
> sem placa. Ela guarda a passagem pedida (com `quantidadePessoas`) e o `cliente` (nome, telefone opcional),
> e vale até a partida. O que segue é o plano como foi escrito; o código é a versão revista.

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

## Passo 8 — Seção Totem (a ilha React) · ✅ concluído em 2026-09-22

> **Como ficou.** `packages/ui` (componentes controlados), `packages/dados` (as portas, os adaptadores em
> memória e `enviarReserva`, que gera o código, monta e grava, com nova tentativa na colisão), e
> `apps/agencia/src/ilhas/` — `Totem.tsx` (o estado e a orquestração, com as dependências injetadas) e
> `TotemDaAgencia.tsx` (a ilha, que constrói as dependências). O catálogo é o de demonstração, que se anuncia na
> tela. Os cenários do aceite estão em `apps/agencia/test/totem.spec.tsx`; a ilha custa 10,8 kB gzip, mais
> 67 kB do runtime do React (ver o orçamento no README). `conteudo/cnpj.ts` foi consolidado no domínio, e
> `conteudo/telefone.ts` passou a decidir o código do país pelo comprimento.

**← Análise do passo anterior:** o domínio foi revisado contra o aplicativo (2026-09-22). As opções chegam **dentro do nó**; `travessiasOfertadas` entrega cada saída com o `ContextoDaReserva` pronto; `montarReserva` fecha o pedido e tira a validade da partida. A ilha não tem regra nenhuma a escrever — se aparecer um `if` sobre acomodação, natureza ou casco num componente, a regra está faltando no domínio.

**Entrega**
- `packages/ui` — componentes **controlados**, sem estado de aplicação:
  - `ListaDeTravessias` — as saídas de `travessiasOfertadas`, com os rótulos que vêm prontos. Filtrar por origem, destino ou dia é recorte **sobre opções que o domínio entregou**, não montagem de opção;
  - `EscolhaEmCartoes` — serve a categoria, a acomodação, o tipo, o subtipo de gratuidade, a quantidade, **a natureza e a classe** do veículo;
  - `CampoDeCilindrada` — só aparece no nó `CILINDRADA` (a moto);
  - `FormularioDoCliente` — nome obrigatório, telefone **opcional** e dito como opcional na tela;
  - `Conferencia` (telefone por `formatarWhatsapp`), `IndicadorDePasso` ("passo 3 de 6", que **cresce**), `ReservaConcluida`.
- **Nenhum campo de documento, nascimento, placa ou responsável** (decisão de 2026-09-22): o totem recolhe a passagem pedida e o cliente; a identificação é do atendimento pessoal.
- `apps/agencia/src/ilhas/Totem.tsx` — o único `client:visible` da página. Guarda a travessia escolhida e as `RespostasDaReserva` em `useState`; desenha `roteiroDaReserva(...).atual`; **voltar é `voltar()`**, sem pilha paralela.
- **A porta de escrita já nasce aqui**: `ReservaRepositorio` (em `packages/dados`, sem Firebase ainda) com uma implementação em memória. Confirmar = `gerarCodigoDaReserva` → `montarReserva` → `repositorio.criar`, com nova tentativa se o código colidir. O passo 10 só troca o adaptador.
- **A fonte do catálogo** é uma interface que devolve `CatalogoDoFluviapp`. Aqui, uma implementação de **molde declarado** (em `test/` ou num arquivo que se anuncie como tal), pela régua dos depoimentos: nome de porto real com horário inventado é conteúdo falso com cara de pronto.
- **O relógio é o do rio**: `agora` e `criadoEm` vêm de `InstanteLocal.emFuso(new Date(), FUSO_DA_OPERACAO)`, com `FUSO_DA_OPERACAO = 'America/Belem'` (decisão de 2026-09-22). Quando Manaus entrar, o fuso passa a ser do porto de origem.
- **A oferta é recalculada** ao abrir o totem, ao voltar à lista e a cada minuto parado nela: uma saída pode partir com a tela aberta. Se partir durante o preenchimento, `montarReserva` devolve `VALIDADE`, e a conclusão diz "esta saída já partiu" e volta à lista — sem perder as respostas que ainda valem para outra saída.
- Ergonomia de totem: alvos ≥56px, um passo por vez, sem scroll dentro do passo, `inputmode` correto, e **timeout de inatividade que zera respostas e travessia** — o dado do próximo cliente não nasce com o do anterior.
- Aviso permanente no topo da seção: **reserva, não venda** — e que ela vale até a partida.
- Modo quiosque: `id="totem"` na seção e `/totem` como página cheia.
- `apps/agencia` passa a depender de `@navegsistemas/domain`: consolidar `conteudo/cnpj.ts` em `TipoDocumento.validar('CNPJ', …)` e `conteudo/telefone.ts` em `normalizarWhatsapp` (que decide pelo comprimento e não erra o DDD 55).

**Aceite**
- Fluxo completo só por teclado; `aria-live` anuncia a troca de passo.
- Cenários `@testing-library/react`: gratuidade acrescenta o subtipo; suíte pergunta a quantidade e rede não; lancha faz "Veículo" **não existir**; navio **não pergunta a classe**; moto pergunta a cilindrada; o cliente fecha sem telefone; voltar apaga a resposta certa; timeout limpa tudo; saída que parte com a tela aberta é recusada com a mensagem certa.
- Bundle da ilha medido e registrado no README (referência: o totem do fluviapp web custa 15 kB / 5,4 kB comprimido).

**→ Análise do próximo passo:** até aqui nada sai do navegador. O passo 9 publica o catálogo e o 10 abre a escrita, sem autenticação (decisão da emenda do ADR-0002).

---

# BLOCO D — A API da agência e o handoff

> **Revisão de 2026-09-22 (segunda).** Este bloco foi reescrito duas vezes no mesmo dia. A primeira, depois da
> revisão contra o aplicativo; a segunda, depois da decisão de **a agência ter servidor próprio** — ver a
> [segunda emenda do ADR-0002](adr/ADR-0002-a-escrita-client-side-e-o-que-a-protege.md), que inverte a DP2.
>
> **O navegador não fala mais com o Firestore.** Duas rotas num **projeto separado**, a
> [`naveg-api-vercel`](../../naveg-api-vercel) (Hono na Vercel), leem e gravam com uma conta de serviço:
>
> ```
> navegador → GET  /api/catalogo   → Firestore (leitura)
> navegador → POST /api/reservas   → Firestore (escrita)
> ```
>
> Com isso somem do plano: a autenticação anônima, o App Check, a regra pública de `create` no `firestore.rules`
> do fluviapp, o catálogo gerado no build e o rebuild diário. Some também o SDK do Firebase do bundle.
>
> **A API é repositório próprio** (decisão de 2026-09-22), e daí duas consequências para este plano: o
> `apps/agencia` **continua inteiramente estático** — sem adaptador, sem rota sob demanda — e aparece **CORS**,
> que não existiria se a API fosse do mesmo domínio. O `@navegsistemas/domain` passa a ser **publicado** no GitHub
> Packages para que os dois repositórios usem a mesma regra; ver "Publicando o `@navegsistemas/domain`" no README.
>
> **O que sobra do lado do fluviapp** é uma mudança pequena e do feitio das que já existem lá: o **aplicativo**
> precisa ler `reservas` e marcá-las `CONVERTIDA` (passo 12). Nada público.
>
> **O que aparece**, e é o que o passo 10 tem de resolver de verdade: sem App Check, o endpoint aberto precisa
> de desafio e de limite por IP.

## Passo 9 — A API do catálogo ✅

> **Feito em 2026-09-23.** Os nomes abaixo são os do plano; os arquivos de verdade são `src/rotas/catalogo.ts`,
> `src/firestore/catalogo-firestore.ts` e `src/firestore/conexao.ts` na API, e `packages/domain/src/catalogo/recorte.ts`
> e `serializacao.ts` aqui (`@navegsistemas/domain` 0.2.0). Duas diferenças do que estava escrito: o **recorte** virou
> função do domínio (`recortarPelaConcessao`), porque é regra, e a API não é dona de regra; e a faixa de demonstração
> do `Totem` deixou de ser booleano — com a API, as saídas são reais e só o envio é de mentira, e a faixa diz isso.
> **Visto contra o `fluvi-app-dev` de verdade** no mesmo dia: a API no ar devolve as duas viagens cadastradas, e o
> caminho do totem (`catalogoHttp` → `travessiasOfertadas`) as oferta.

**← Análise do passo anterior:** o totem funciona inteiro contra o catálogo de demonstração e a porta em memória. Revalidar que `ilhas/TotemDaAgencia.tsx` é **o único** arquivo que precisa mudar para trocar as fontes — se outro precisar, a fronteira do passo 8 vazou.

**Entrega — na `naveg-api-vercel`**
- `src/rotas/catalogo.ts` — `GET /catalogo`, devolve o `CatalogoDoFluviapp` **já recortado pela concessão** da NAVEG: só as viagens de rota ativa que a atuação cobre, e só os portos, localidades e embarcações que elas citam. Minimização: o pool das outras empresas não sai do servidor.
- `src/firestore/CatalogoFirestore.ts` — o adaptador de leitura: lê as seis coleções com o Admin SDK e decodifica com `@navegsistemas/domain` (`viagemDoDocumento` e companhia, que já leem como o aplicativo lê). O endpoint é fino: chama a porta, serializa, responde.
- **A fronteira de serialização**, em `@navegsistemas/domain/catalogo`: `catalogoParaJson` / `catalogoDoJson`. A concessão é `ReadonlySet`, que não sobrevive a `JSON.stringify` — e um `Set` que chega como `{}` vazio faz o totem não ofertar nada, em silêncio. O par tem cenário de ida e volta.
**Entrega — no `naveg-front`**
- `packages/dados` ganha `catalogoHttp(url)`, implementando a `FonteDoCatalogo` que o totem já consome. `TotemDaAgencia.tsx` troca `catalogoFixo(CATALOGO_DE_DEMONSTRACAO)` por ele — e é a única linha de ilha que muda. A URL da API entra como `PUBLIC_URL_DA_API` (pública de propósito: é um endereço, não um segredo).
- O `@navegsistemas/domain` publicado, para a API consumir a mesma regra.
- **Cache na borda**: `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`. O catálogo muda quando alguém cadastra uma viagem, não a cada pedido; um minuto de cache derruba a leitura do Firestore a quase nada e mantém a lista fresca. **A disponibilidade continua sendo calculada no navegador**, a cada minuto, sobre o catálogo em mãos — por isso o cache não faz saída vencida aparecer.
- **O catálogo de demonstração fica**, como recurso de desenvolvimento e dos cenários. *Emenda de 2026-09-23:* ele deixou de ser o padrão — o padrão é a API, para o site publicado não mostrar saídas fictícias por esquecimento — e passou a ser pedido por `PUBLIC_URL_DA_API=demonstracao`.

**Configuração**
- `FIREBASE_CONTA_DE_LEITURA` (JSON da conta `naveg-api-leitura`, **só leitura**: papel *Cloud Datastore Viewer*), `FIREBASE_PROJECT_ID` (`fluvi-app-dev` — tudo é dev por enquanto, decisão de 2026-09-23), `NAVEG_EMPRESA_ID`. Variáveis de ambiente da Vercel, **sem** prefixo `PUBLIC_`. O roteiro de criação das contas está no README da `naveg-api-vercel`.
- Funções **Node**, não edge: o Admin SDK depende de APIs de Node. A inicialização é memorizada por instância, para não repetir a cada invocação fria.

**Aceite**
- Cenários do endpoint com uma porta de leitura falsa: o que a concessão não cobre não sai; rota inativa não sai; viagem com embarcação que não resolve não sai; sem `NAVEG_EMPRESA_ID` o endpoint responde 500 e **não** responde um catálogo vazio, que seria um totem sem saídas com cara de funcionando.
- Cenário de ida e volta de `catalogoParaJson`/`catalogoDoJson`, com a concessão sobrevivendo.
- `dist/` sem nenhuma credencial (varredura no CI) e sem o SDK do Firebase.

**→ Análise do próximo passo:** com a leitura resolvida por conta de serviço, a escrita é o mesmo caminho na direção oposta — e é o passo que decide quem pode gravar.

---

## Passo 10 — A API da reserva

**← Análise do passo anterior:** o totem mostra saídas reais, e nenhuma credencial chegou ao navegador.

**Entrega**
- `apps/agencia/src/pages/api/reservas.ts` — `POST`, e o corpo é **só** o que o cliente pode afirmar:
  ```json
  { "viagemId": "...", "data": "2026-10-14", "respostas": { … }, "desafio": "token do Turnstile" }
  ```
  **O servidor não confia em mais nada.** A embarcação, a partida, o código e o instante são derivados ali:
  1. valida o desafio;
  2. carrega o catálogo (o mesmo caminho do passo 9, com o mesmo cache **e a mesma conta de leitura** — a de escrita só aparece no `create` do item 5) e procura a travessia `viagemId@data` **entre as ofertadas agora**. Não achou — inativa, fora da concessão, já partida — é `409`, e a mensagem é a que o totem já sabe mostrar;
  3. `montarReserva(respostas, contexto, { codigo: gerarCodigoDaReserva(), criadoEm: InstanteLocal.emFuso(new Date(), FUSO_DA_OPERACAO) })`;
  4. `INCOERENTE` vira `422` com as pendências **tipadas** — o totem já tem texto para cada uma;
  5. `paraDocumento` e `create` com o Admin SDK. Documento existente derruba a gravação (`ALREADY_EXISTS`): gera outro código e monta de novo, até cinco vezes. É o `enviarReserva` que já existe, com a porta do Firestore no lugar da de memória.
- Na `naveg-api-vercel`, `src/firestore/ReservaFirestore.ts` — a `ReservaRepositorio` de verdade: `create` que devolve `CODIGO_EM_USO` no `ALREADY_EXISTS`. O caso de uso (`enviarReserva`) é o mesmo do totem: **decidido em 2026-09-23**, ele e a porta `ReservaRepositorio` moram no `@navegsistemas/domain`, o único pacote publicado.
- No front, `packages/dados` ganha `reservaHttp(url)`: implementa a mesma porta, mandando o `POST` e traduzindo `409`/`422` nos casos que o totem já trata. **O `Totem.tsx` não muda.**
- **O desafio**: Cloudflare Turnstile no passo de conferência. A chave pública é do bundle; a secreta, do servidor. Sem desafio válido, `403`.
- **O limite por IP**: contador em Upstash Redis (plano gratuito), por janela curta. Passou do teto, `429`. É o substituto do App Check, e é o único lugar onde a API é mais frágil do que a porta do Firestore com App Check ligado — por isso ele é entrega, e não "depois".
- **A origem**: o endpoint recusa `Origin` que não seja o domínio da agência. Não é segurança sozinho; é o que tira o tráfego trivial de cima do limite.
- **O que o endpoint responde**, e é o que o totem mostra: `201` com `{ codigo }`.

**Do lado do fluviapp** (contribuição ao repositório deles, testada na suíte de lá)
```
match /reservas/{codigo} {
  allow read:   if autenticado();                       // o aplicativo lista e abre
  allow update: if autenticado() && ehConversao();      // CONVERTIDA + passagemId, nada mais
  allow create, delete: if false;                       // quem cria é a API, com conta de serviço
}
```
Mais os índices `(status, data)` e `(agenciaId, data)` no `firestore.indexes.json` deles. **Nenhuma regra pública**, nenhum App Check, nenhum provedor anônimo.

**Aceite**
- Cenários do endpoint, com portas falsas: corpo sem desafio é `403`; travessia que não está ofertada é `409`; respostas incoerentes são `422` com a pendência certa; o feliz devolve `201` e grava **o documento** (passa pelo codec); código em uso gera outro; o `criadoEm` e o `codigo` do corpo, se alguém os mandar, são **ignorados**.
- Cenário de segurança: nenhuma resposta do endpoint devolve dado de outra reserva, e o erro não vaza mensagem do Firestore.
- Escrita ponta a ponta contra o **emulador** do Firestore, com as Rules do fluviapp carregadas, provando que a conta de serviço grava e que um cliente anônimo não lê.
- **Revisão de segurança antes do deploy.** Este passo não vai a produção sem ela.

**→ Análise do próximo passo:** a reserva está gravada e o código na mão; falta entregá-la a um humano.

---

## Passo 11 — Handoff para o WhatsApp

**← Análise do passo anterior:** gravação confirmada; o código devolvido é o id real do documento.

**Entrega**
- `packages/domain/reserva/link-de-atendimento.ts` — função pura: `https://wa.me/<E.164 sem +>?text=<encodeURIComponent(mensagem)>`. O número da NAVEG passa por `normalizarWhatsapp`, e `apps/agencia/src/conteudo/whatsapp.ts` deixa de existir.
- A mensagem, montada do domínio e dos rótulos da travessia, com o código na primeira linha:
  ```
  Reserva NVG-7K3QP2
  Terminal Hidroviário → Porto de Camará · Qua, 14/10 · 21:30
  Rede · 1 pessoa · Maria Souza
  Vale até a partida.
  Abrir no app: https://<domínio>/r/NVG-7K3QP2
  ```
  Reserva de veículo leva a classe no lugar da acomodação ("Carro", "Moto · 160 cc"). O nome é o do cliente; nenhum documento vai na mensagem.
- Tela de conclusão com o código **em destaque e copiável**, o botão "Enviar ao atendimento" e o código em texto — o redirecionamento pode falhar e o cliente não sai de mãos vazias. No quiosque, o **QR do link**.

**Aceite**
- Cenários sobre o construtor: acentos e `&` escapados; quebra de linha preservada; número normalizado; a mensagem sempre contém o código.
- E2E assere o `href`, sem navegar para fora.

**→ Análise do próximo passo:** o link `/r/{codigo}` precisa abrir o aplicativo — e a reserva precisa virar passagem lá.

---

## Passo 12 — No aplicativo: a reserva vira passagem

**← Análise do passo anterior:** a mensagem carrega uma URL estável e única por reserva.

Todo este passo é no repositório do fluviapp, exceto o `assetlinks.json` e a página `/r/[codigo]`.

**Entrega — no fluviapp**
- **O leitor de `reservas/`**: porte Kotlin do codec, com as mesmas recusas. O contrato ganha a direção inversa: `@navegsistemas/domain` publica **documentos-exemplo** gerados por `paraDocumento` (um por forma: rede, suíte para três, gratuidade, moto com cilindrada, rebocado, cliente com e sem telefone), e um teste Kotlin os lê. Se um lado mudar uma chave, o outro fica vermelho.
- **As Rules de `reservas`** entram aqui se não tiverem entrado no passo 10: leitura para funcionário autenticado, `update` só para a conversão, `create` e `delete` negados (quem cria é a API da agência, com conta de serviço).
- **Tela "Reservas"**: as `RESERVADA` por viagem e data. A expiração é **derivada na leitura** — `expiraEm ≤ agora` aparece como expirada sem que ninguém grave nada. Enquanto a validade for a partida, a lista do dia se limpa sozinha, e gravar `EXPIRADA` fica para uma rotina, se um dia for preciso.
- **"Emitir a partir desta reserva"**: abre o roteiro de emissão **pré-preenchido** com o que define a passagem — acomodação, tipo, subtipo, quantidade de pessoas (que vira o número de formulários `DadosDoCliente`), natureza e classe, cilindrada. **A identificação é feita ali, no atendimento**: documento e nascimento de cada pessoa, placa do veículo — pelo caminho normal do balcão (`clientes/{chaveNatural}`, `veiculos/{placa}`). O nome e o telefone do cliente da reserva pré-preenchem o titular. A cota de gratuidade é conferida ali, como em qualquer emissão. Na mesma escrita, a reserva recebe `CONVERTIDA` e o `passagemId`.
- **Deeplink (Android App Links)**: o `applicationId` é **`br.com.fluviapp`** (o plano original dizia `br.com.fluviapp.android`, que é outro app). O manifest hoje só tem o `intent-filter` do launcher. Acrescentar o de `https://<domínio>/r/`, com `autoVerify`, `singleTask`, e o tratamento em `onCreate` **e** `onNewIntent`.

**Entrega — aqui**
- `public/.well-known/assetlinks.json` com o SHA-256 de release **e** de upload; `apple-app-site-association` se o iOS entrar.
- Página `/r/[codigo]` — mostra o código e instrui o atendente. É o que abre no desktop.

**Aceite**
- `adb shell pm get-app-links br.com.fluviapp` → `verified`.
- O link abre a reserva com o app fechado e com o app aberto; sem o app, abre a página.
- Emitir a partir de uma reserva produz uma passagem `A_EMITIR` com os clientes do pool e deixa a reserva `CONVERTIDA`.

---

## Passo 13 — Endurecimento: acessibilidade, performance e E2E

**← Análise do passo anterior:** o circuito está fechado — reserva → Firestore → WhatsApp → aplicativo → passagem.

**Entrega**
- Playwright: jornada completa em Chromium e WebKit, mobile e desktop; só teclado; a página institucional **sem JavaScript** continua legível.
- `@axe-core/playwright` por seção, no CI.
- Orçamento de performance no CI: JS da página institucional = 0; ilha do totem com teto declarado.
- CSP, `Permissions-Policy`, `Referrer-Policy`. Sem `preconnect` para o Firestore: quem fala com ele é o servidor.
- **Cenários da API** no CI (os dos passos 9 e 10, com portas falsas) e um contra o **emulador** do Firestore; varredura do `dist/` por credencial.
- **O CI clona o fluviapp** para rodar a camada 2 do contrato — sem isso, os 21 cenários que leem o Kotlin ficam pulados para sempre no CI, que é o mesmo que não existirem.
- Meta: OG image, `sitemap.xml`, `robots.txt`.
- `docs/RUNBOOK.md`: App Check bloqueando reservas legítimas; girar o certificado sem quebrar App Links; rebuild do catálogo fora de hora.

**Aceite**
- CI verde: `typecheck`, `test` (com o contrato **executado**, não pulado), `e2e`, `axe`, orçamento de bundle.
- Lighthouse mobile ≥90 nas quatro categorias.

---

## Resumo da ordem

```
A · Fundação     0 monorepo+ADRs -> 1 design system -> 2 casca Astro
B · Exibição     3 capa -> 4 atendentes -> 5 feedback+redes -> 6 rodapé     <- publicável aqui
C · Totem        7 domínio e catálogo -> 8 ilha do totem (catálogo de molde, porta em memória)
D · A API        9 GET /api/catalogo -> 10 POST /api/reservas [Turnstile + limite por IP]
                 -> 11 WhatsApp -> 12 no aplicativo: reserva vira passagem + deeplink -> 13 endurecimento
```

**Marco de valor antecipado:** ao fim do passo 6 a página institucional é publicável e útil, sem nenhuma linha de Firebase. O totem entra por cima, sem reforma — porque a casca já foi desenhada para recebê-lo como ilha.

**Caminho crítico:** a conta de serviço de leitura e o `NAVEG_EMPRESA_ID` (passo 9); o projeto na Vercel com os segredos (passos 9 e 10); a regra de leitura de `reservas` no repositório do fluviapp, que o **aplicativo** precisa (passo 12). Nada disso bloqueia o totem, que já roda contra o catálogo de demonstração.

## Riscos registrados

| risco | onde aparece | mitigação |
|---|---|---|
| Domínio portado divergir do aplicativo | passo 7 | Contrato contra o Kotlin do **aplicativo** sobre valores **e significados** (natureza, carga, ocupação) e chaves dos documentos; o CI clona o fluviapp (passo 13) |
| Auth anônima abrir as Rules do fluviapp | passos 9–10 | Resolvido pela segunda emenda do ADR-0002: o navegador não fala com o Firestore, e nenhum provedor é ligado |
| Totem recolher dado pessoal demais | passo 8 | Decidido: nenhum documento, nascimento ou placa — só a passagem, o nome e um telefone opcional |
| ~~Enforcement do App Check derrubar o aplicativo~~ | — | Não se aplica: não há cliente público no Firestore para atestar |
| Endpoint público abusado (o que o App Check faria) | passo 10 | Turnstile no envio, limite por IP, checagem de origem, e a forma fechada que o domínio já garante |
| Conta de serviço vazar | passos 9–10 | Segredo de runtime na Vercel, nunca `PUBLIC_`; varredura do `dist/` no CI; papel só de leitura no endpoint do catálogo |
| A API cair e levar o totem junto | passos 9–10 | O catálogo tem cache na borda; a página institucional é estática e não depende da API |
| Catálogo desatualizado | passos 9–10 | Leitura ao vivo com 60s de cache; e o `POST` reconfere a travessia contra o catálogo antes de gravar |
| Horário errado por fuso do visitante | passos 8, 10 | `InstanteLocal.emFuso` com o fuso da operação; nunca o relógio do navegador |
| Escrita pública abusada | passo 10 | A escrita é do servidor: o público manda respostas, não documento. Turnstile, limite por IP e revisão de segurança obrigatória |
| Reserva e aplicativo lerem chaves diferentes | passo 12 | Documentos-exemplo gerados aqui e lidos por teste Kotlin lá |
| App Links não verificarem | passo 12 | `applicationId` correto (`br.com.fluviapp`); SHA-256 de release **e** de upload; fallback `intent://`; página web sempre funcional |
| Laranja reprovando contraste | passo 1 | Cenário de contraste sobre os tokens; laranja é superfície, nunca tinta de texto pequeno |
| Reserva virar expectativa de venda | passos 6, 8, 11 | "Reserva, não venda" no rodapé, no topo do totem e na mensagem do WhatsApp |
| Dado do cliente anterior vazar no totem físico | passo 8 | Timeout de inatividade que zera respostas e travessia |
