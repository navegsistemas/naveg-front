# Fotos das embarcações

A vitrine da capa desenha um **wireframe** para toda embarcação sem foto, e o wireframe mostra o nome do
arquivo que ele espera. Quando a foto chegar, é só colocá-la aqui e apontar a entrada em
`src/conteudo/embarcacoes.ts`.

## O que colocar

| arquivo esperado | embarcação |
|---|---|
| `regional.webp` | F/B Regional |
| `maria-ivanir.webp` | F/B Maria Ivanir |
| `maria-eduarda.webp` | F/B Maria Eduarda |

O nome sai do `id` da embarcação — mudar o `id` muda o arquivo esperado, e o wireframe passa a pedir o nome
novo.

## Formato

- **Proporção 16:9.** A moldura recorta com `object-fit: cover`, então o que sair do quadro é a borda; o barco
  deve estar centralizado.
- **1280×720** basta. A vitrine nunca passa de ~700px de largura em tela cheia, e o dobro cobre telas densas.
- **WebP** (ou AVIF, trocando a extensão nos dois lugares). JPEG funciona e pesa mais.
- Até ~150 kB por foto. Elas são `loading="lazy"`, então não afetam o LCP, mas somam três.

## Como ligar

Em `src/conteudo/embarcacoes.ts`, na entrada da embarcação:

```ts
imagem: 'regional.webp',
alt: 'O ferry boat Regional atracado no porto de Belém, visto de bombordo.',
```

O `alt` **não é opcional quando há foto** — há um cenário que reprova foto sem texto alternativo. Ele descreve
o que se vê, não repete o nome que já está na legenda ao lado.
