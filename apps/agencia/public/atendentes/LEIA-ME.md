# Fotos dos atendentes

O cartão desenha um **retrato vazio** para todo atendente sem foto. Quando a foto chegar, coloque-a aqui e
aponte a entrada em `src/conteudo/atendimento.ts`.

## Formato

- **Quadrada (1:1).** O retrato é um círculo, e o recorte é `object-fit: cover` — o rosto precisa estar
  centralizado ou a máscara corta a testa.
- **320×320** basta; o retrato tem 96px em tela.
- **WebP**, até ~40 kB.

## Como ligar

```ts
{
  id: 'atendimento-naveg',
  nome: 'Nome de quem atende',
  funcao: 'Atendente',
  horario: '24 horas, todos os dias',
  whatsapp: '(91) 98888-7777',
  foto: 'atendimento-naveg.webp',
  alt: 'Retrato de <nome>, atendente da NAVEG.',
}
```

Três coisas que o build cobra, e não a página:

- **o `alt` é obrigatório quando há foto** — há cenário que reprova foto sem texto alternativo;
- **o número é validado** — `(91) 98888-7777`, `+55 91 98888-7777` ou `91988887777` funcionam igual, mas
  qualquer coisa que não resulte em `55` + DDD + 9 dígitos **quebra o build**. É de propósito: número errado não
  dá erro em lugar nenhum, dá um link que abre e não acha ninguém;
- **enquanto `whatsapp` for `null`**, o cartão mostra "Número pendente" em vez de um botão. Botão que não abre
  conversa promete e falha na frente de quem precisava.

## Mais de um atendente

É só acrescentar entradas em `ATENDENTES`. A grade é `auto-fit`: com um, ele ocupa a coluna; com dois ou mais,
ela se reparte sozinha. Nenhum componente muda.

Quando houver **mais de uma agência**, o campo `agencia` volta ao modelo e ao cartão — hoje ele não existe
porque diria "NAVEG" em todos, e informação que não distingue nada gasta a atenção de quem lê.
