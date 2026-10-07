# Rascunho — a política de privacidade da conta e da compra

**Situação:** rascunho, **fora do ar**. Escrito na 13.4 (2026-10-07), pela U7 do
[plano da venda online](plano-da-venda-online.md): a política do site de hoje está publicada em
[`/privacidade`](../apps/agencia/src/pages/privacidade.astro), e este rascunho vai **junto com ela para uma revisão
jurídica só**. Cada parte entra na página no dia em que o site passar a fazer o que ela descreve — a conta com a
7.4, a compra com a 7.6 —, mudando a versão e a data. Antes disso, nada daqui é prometido no ar.

**O build não deixa esquecer:** toda página precisa declarar que parte da política a cobre (`COBERTURA_DA_POLITICA`,
em `scripts/conferir-build.mjs`), e a política precisa ter essa parte (`data-cobre="conta"` ou `"compra"`). Sem
isso, as páginas da conta ou da compra não passam no CI.

Os trechos entre colchetes são o que ainda depende de decisão (do PO, do contador ou do jurídico).

---

## A. Entra com a 7.4 — a conta do cliente

### Quais dados, e para quê

- **E-mail e senha**, para criar a conta e entrar. A senha não é guardada por nós: quem a guarda, cifrada, é o
  serviço de autenticação [o Firebase Authentication, do Google — confirmar na ADR-0003].
- **Nome completo e documento (tipo e número)** de quem viaja, e a **data de nascimento** — a Capitania dos
  Portos exige a lista de passageiros com eles, e a conferência na doca também. Diferente do totem público, o
  documento é digitado no aparelho do próprio cliente, logado.
- **Telefone**, para o atendimento falar com você sobre a viagem.
- **O histórico das suas reservas e compras**, para você ver em "Meus pedidos".

**Base legal:** a execução do contrato de transporte (art. 7º, V); para o documento e a data de nascimento,
também o cumprimento de obrigação legal ou regulatória (art. 7º, II) — [o jurídico confirma a norma da
Autoridade Marítima que exige a lista].

### A sessão

Para você continuar logado, o site guarda um **cookie de sessão**, necessário ao serviço, que o JavaScript da
página não lê [a forma e a duração vêm da ADR-0003]. A seção "o site não usa cookies próprios" da versão de hoje
muda: passa a dizer que usa **só esse**, e nenhum de análise ou publicidade.

### Apagar a conta (O7)

Você pode apagar a sua conta em "Meus dados". Apagar a conta **tira os seus dados de cadastro**; as passagens já
emitidas **ficam**, porque a lei exige guardá-las [prazo: o do bilhete e o fiscal — o contador e o jurídico
confirmam; em geral, 5 anos].

### Por quanto tempo

- Os dados da conta: enquanto ela existir.
- [Conta sem uso: apagar depois de quanto tempo? — decisão do PO.]
- As passagens e as compras: pelo prazo que a lei exige para elas, mesmo depois de apagada a conta.

---

## B. Entra com a 7.6 — a compra

### Quais dados, e para quê

- **O pedido:** a viagem, quem viaja, o valor.
- **O pagamento** é feito pelo **Mercado Pago**. Os dados do cartão são digitados em campos **do próprio
  Mercado Pago**, dentro da nossa página, e **não passam pelo nosso site nem pelos nossos servidores**. Recebemos
  do Mercado Pago só o resultado — aprovado, recusado, estornado — e o identificador do pagamento.
- **No PIX**, o código "copia e cola" é gerado pelo Mercado Pago para o seu pedido.

**Base legal:** a execução do contrato (art. 7º, V) e o cumprimento de obrigação legal — fiscal (art. 7º, II).

### Com quem é compartilhado (acrescenta à lista de hoje)

- **Mercado Pago**, que processa o pagamento e segue a política de privacidade dele.
- [Emissão de nota fiscal, se houver: o emissor — decisão do contador.]

### Segurança (acrescenta)

- Nenhum dado pessoal nos registros do sistema — nem e-mail, nem documento, nem o código do PIX.
- As respostas de "esqueci a senha" não revelam se um e-mail tem conta.

---

## C. O que muda no texto de hoje quando estas partes entrarem

| item da página | muda para |
|---|---|
| 2. "não tem cadastro nem senha, não usa cookies próprios" | tem conta, e usa só o cookie de sessão |
| 2. "gera reservas, não vende passagens" | gera reservas **e** vende passagens; a reserva continua existindo, sem pagamento |
| 2. "nenhum documento de identidade" | nenhum documento **no totem**; na conta, o documento que a Capitania exige |
| 4. com quem compartilha | + Mercado Pago (e o emissor de nota, se houver) |
| 5. por quanto tempo | + os prazos da conta e da compra |

## D. Para a revisão jurídica, junto com a versão de hoje

1. **O tipo de gratuidade** na reserva de hoje: "pessoa com deficiência" é dado sensível (art. 5º, II). A base
   proposta é o cumprimento de obrigação legal (art. 11, II, "a") — a gratuidade é direito previsto em lei.
2. **Agente de pequeno porte:** o controlador é MEI (Resolução CD/ANPD nº 2/2022) — confirmar o que isso dispensa
   e o que não, e manter o encarregado indicado mesmo assim (decisão do PO).
3. **A transferência internacional** (art. 33) — Google, Vercel, Cloudflare, Upstash e Mercado Pago.
4. **O prazo de resposta** ao titular: a página de hoje promete 15 dias.
5. **A empresa de navegação** que recebe os dados quando a reserva vira passagem: controladora conjunta ou
   operadora? Muda o que a política diz dela.
