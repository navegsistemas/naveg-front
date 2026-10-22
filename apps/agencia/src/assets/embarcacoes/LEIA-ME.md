# Fotos das embarcações

Aqui fica a foto **original** de cada embarcação, do jeito que chegou: sem recortar, sem reduzir, sem converter.
O Astro gera no build os tamanhos e os formatos (AVIF e WebP) que cada lugar da página pede, e o recorte é regra
de CSS (`object-position`), não edição do arquivo. Trocar o enquadramento não pede foto nova.

## O que colocar — o nome diz para onde a foto vai

O nome do arquivo é o `id` da embarcação em `src/conteudo/embarcacoes.ts`, com um sufixo que diz o uso (PO,
2026-10-15), e a extensão que o arquivo tiver (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`):

| nome | onde aparece |
|---|---|
| `<id>-apresentacao` | a vitrine "Nossa flotilha", em 16:9: **deitada**, com o navio inteiro |
| `<id>-capa` | o fundo da capa, que no celular é em pé |
| `<id>` | os dois, quando uma foto só serve |

Uma foto só nem sempre serve: a do Maria Ivanir em pé, recortada na vitrine, perdia metade do navio.

| arquivo | embarcação | onde aparece |
|---|---|---|
| `maria-ivanir-capa.jpg` | F/B Maria Ivanir | fundo da capa (escolha do PO, 2026-10-08) |
| `maria-ivanir-apresentacao.jpg` | F/B Maria Ivanir | a vitrine (2026-10-15) |
| `regional.jpeg` | F/B Regional | a vitrine, a miniatura do cartão da saída (2026-10-22) e o cartão do Veículo da reserva (2026-10-15), até chegar a foto própria dele |
| `maria-eduarda-apresentacao.jpg` | F/B Maria Eduarda | a vitrine e a miniatura do cartão da saída, quando chegar (até lá, o cartão desenha um barco) |
| `cartao-do-veiculo.jpg` | nenhuma: um veículo embarcando | o cartão do Veículo em "O que vai embarcar?", quando chegar (PO, 2026-10-22); até lá, a do Regional |

A **miniatura do cartão da saída** (UI 2.1) é a foto da vitrine (`<id>-apresentacao`), em 72px. A página a casa com
a embarcação do catálogo pelo nome, e não pelo `id`.

**A vitrine só aparece a partir da segunda foto.** Com uma, ela já é o fundo da capa, e a vitrine repetiria a
mesma imagem logo abaixo.

## Formato

- **A maior resolução que houver.** Foto que passou pelo WhatsApp chega reduzida (a do Maria Ivanir tem
  1200×1600); se existir o original da câmera, ele é melhor.
- Qualquer proporção. O barco não precisa estar centralizado, mas o enquadramento da capa (`Capa.astro`,
  `object-position`) e o da vitrine (16:9, `object-fit: cover`) precisam saber onde ele está.

## Como ligar

Pôr o arquivo aqui, com o nome certo, já basta: `embarcacoes.ts` acha a foto pelo nome. O que falta é o
**texto alternativo** da foto da vitrine, na entrada da embarcação:

```ts
alt: 'O ferry boat Regional atracado no porto de Belém, visto de bombordo.',
```

O `alt` **não é opcional quando há foto**: há um cenário que reprova foto sem texto alternativo. Ele descreve
o que se vê, e não repete o nome que já está na legenda ao lado. A da capa não leva: ali a foto é fundo, e o
texto por cima é que diz o que importa.
