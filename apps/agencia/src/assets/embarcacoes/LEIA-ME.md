# Fotos das embarcações

Aqui fica a foto **original** de cada embarcação, do jeito que chegou: sem recortar, sem reduzir, sem converter.
O Astro gera no build os tamanhos e os formatos (AVIF e WebP) que cada lugar da página pede, e o recorte é regra
de CSS (`object-position`), não edição do arquivo. Trocar o enquadramento não pede foto nova.

## O que colocar

| arquivo | embarcação | onde aparece |
|---|---|---|
| `maria-ivanir.jpg` | F/B Maria Ivanir | fundo da capa (escolha do PO, 2026-10-08) |
| `regional.jpg` | F/B Regional | a vitrine, quando chegar |
| `maria-eduarda.jpg` | F/B Maria Eduarda | a vitrine, quando chegar |

O nome é o `id` da embarcação em `src/conteudo/embarcacoes.ts`, com a extensão que o arquivo tiver (`.jpg`,
`.jpeg`, `.png`, `.webp`).

**A vitrine só aparece a partir da segunda foto.** Com uma, ela já é o fundo da capa, e a vitrine repetiria a
mesma imagem logo abaixo.

## Formato

- **A maior resolução que houver.** Foto que passou pelo WhatsApp chega reduzida (a do Maria Ivanir tem
  1200×1600); se existir o original da câmera, ele é melhor.
- Qualquer proporção. O barco não precisa estar centralizado, mas o enquadramento da capa (`Capa.astro`,
  `object-position`) e o da vitrine (16:9, `object-fit: cover`) precisam saber onde ele está.

## Como ligar

Em `src/conteudo/embarcacoes.ts`, importar o arquivo e apontar a entrada da embarcação:

```ts
import fotoDoRegional from '../assets/embarcacoes/regional.jpg'
// …
imagem: fotoDoRegional,
alt: 'O ferry boat Regional atracado no porto de Belém, visto de bombordo.',
```

O `alt` **não é opcional quando há foto**: há um cenário que reprova foto sem texto alternativo. Ele descreve
o que se vê, e não repete o nome que já está na legenda ao lado.
