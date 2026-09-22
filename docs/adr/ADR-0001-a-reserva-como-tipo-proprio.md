# ADR-0001 — A reserva é um tipo próprio, não um estado da passagem

**Status:** aceito
**Data:** 2026-09-22
**Contexto:** abertura da agência virtual da NAVEG (Fase 1)
**Fontes:** `fluviapp-kmp` — `domain/passagem/Passagem.kt`, `domain/passagem/StatusPassagem.kt` (ADR-0012, ADR-0018 D17, ADR-0023 D1, ADR-0024 D11) e a nota lateral do ADR-0026

---

## Contexto

A agência virtual precisa de um estado que hoje não existe: alguém pede uma travessia pelo site, e esse pedido
tem de chegar ao atendimento para virar passagem. O pedido inicial foi descrito como *"o status RESERVADA não
existe na aplicação e passa a existir com essa aplicação client side"*.

Lido ao pé da letra, isso é um valor novo em `StatusPassagem`, antes de `A_EMITIR`.

## O que o modelo existente garante, e que está em jogo

`Passagem` é um tipo **selado e coerente por construção** (ADR-0023 D1). Não se escreve
`PassagemDePassageiro` sem `acomodacao`, sem `tipo`, sem pelo menos um cliente, sem `MetadadosPassagem`
completos — e os metadados exigem `funcionarioId`, `agenciaId` e um `status` legível. O codec
(`PassagemDocumento.paraDominio`) **recusa** o documento que não atende a isso: ele não vira passagem
degradada, não vira nada.

Essa dureza foi comprada por uma razão registrada: antes dela a passagem era *uma* coisa com blocos opcionais,
49 campos planos onde o veículo "existia" quando a placa não estava vazia. O custo eram estados ilegais
representáveis e regra espalhada por tela.

## A decisão

**A reserva é a coleção `reservas`, com tipo `Reserva` e uma FSM própria.** `StatusPassagem` não muda.

```
Reserva: RESERVADA → CONVERTIDA | EXPIRADA | CANCELADA        (as três terminais)
Passagem: A_EMITIR → EMITIDA → EMBARCADA ;  CANCELADA         (inalterada)
```

A web **só escreve `RESERVADA`**. Toda transição é do app autenticado. Quando o atendente emite, nasce uma
`Passagem` em `A_EMITIR` — pelo caminho normal, com funcionário e agência inferidos do vínculo ativo — e a
reserva recebe `CONVERTIDA` e o `passagemId`.

## Por quê

**Uma reserva pública é incompleta por definição.** Não tem documento conferido, não tem pagamento, não tem
funcionário emissor, não tem agência atribuída. Encaixá-la na FSM da passagem obrigaria a tornar opcional tudo
o que hoje é obrigatório — e isso não enfraquece um pouco o agregado, desfaz por dentro a garantia que o app
inteiro usa. A nota lateral do ADR-0026 já havia previsto exatamente este caso: *"a passagem incompleta terá de
ser **outro tipo**: admitir nulos aqui para servir ao incompleto desfaria este D1 por dentro"*.

**A reserva é um pedido; a passagem é um fato.** Elas respondem a perguntas diferentes. A passagem responde
*"quem viajou, pagando quanto, emitida por quem"*. A reserva responde *"quem pediu, e o atendimento já
tratou?"*. Um tipo que respondesse às duas seria ambíguo nas duas.

**As Rules ficam separáveis.** `passagens` nunca precisa admitir escrita anônima. É a diferença entre abrir
uma porta nova e afrouxar a fechadura da porta que já existe.

**A numeração não colide.** O `numero` da passagem é por ocorrência e registra fatos (ADR-0018 D10); o código
da reserva é um identificador de atendimento. Misturá-los faria a sequência de bilhetes ganhar buracos por
pedidos que nunca viraram viagem.

## O que foi recusado

**`RESERVADA` como estado inicial da FSM.** Uma coleção só, consulta única, nenhum tipo novo. Recusado pelo
custo acima — e por um custo prático: mexer em `StatusPassagem` significa mexer no Kotlin, no TypeScript, nas
Rules e em todo `when` exaustivo que hoje trata quatro casos.

**Reserva como `Passagem` com campos opcionais.** É a mesma recusa, por outro caminho.

**Um documento `rascunho` dentro de `passagens`.** Mantém a coleção única e evita tipo novo, mas mistura
documentos de forma diferente na mesma coleção — e as consultas de ocupação e de receita passariam a precisar
filtrar o que não é passagem. Discriminador já existe ali (`categoria`) e serve a sub-domínios da mesma coisa;
reserva não é sub-domínio de passagem.

## Consequências

- O app mobile ganha uma tela nova: abrir a reserva e emitir a partir dela. É o consumidor do deeplink.
- O porte do domínio para a web fica **menor** do que seria: a reserva não precisa de `Lancamento`, de
  `Dinheiro` nem de `MetadadosPassagem`.
- Reserva sem tratamento envelhece. `expiraEm` é campo do documento, e expirar é responsabilidade do app ou de
  uma rotina — não da web, que não tem permissão de atualizar nada.
- `passageiros` guarda **nome + documento + nascimento**, não `clienteId`: na Fase 1 não há pool de clientes
  acessível ao público, e inventar um id no cliente criaria referência quebrada. O pool se resolve na emissão,
  que é onde ele já se resolve hoje.
