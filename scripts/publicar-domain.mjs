/**
 * **Publica o `@naveg/domain` no GitHub Packages.**
 *
 * O pacote é consumido de dois jeitos que pedem coisas diferentes:
 *
 * - **dentro do monorepo**, por symlink de workspace, como **TypeScript-fonte** (`exports` → `src/index.ts`).
 *   É o que faz o Astro e o Vite compilarem o domínio junto com o app, sem passo de build no meio;
 * - **de fora** (o `naveg-api`), como **JavaScript compilado com tipos** (`exports` → `dist/src/index.js`).
 *   Node não executa `.ts`.
 *
 * O `publishConfig` do npm promete resolver isso sozinho, sobrescrevendo `exports` na publicação. **Não
 * resolve** — conferido nesta versão do npm: o manifesto do tarball sai com o `exports` de desenvolvimento.
 * Publicar assim entregaria um pacote que quebra na primeira importação, e só no servidor.
 *
 * Então o manifesto de publicação é montado aqui, explicitamente, a partir do de desenvolvimento — versão,
 * descrição e repositório vêm de lá, e só o que muda entre os dois é escrito aqui. O pacote é publicado de um
 * diretório de preparo, para que nada no monorepo precise mudar de forma para o publish acontecer.
 *
 * Uso:
 *   node scripts/publicar-domain.mjs            # publica
 *   node scripts/publicar-domain.mjs --ensaio   # monta e empacota, sem publicar
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)))
const PACOTE = join(RAIZ, 'packages', 'domain')
const PREPARO = join(PACOTE, '.publicacao')
const ENSAIO = process.argv.includes('--ensaio')

function rodar(comando, argumentos, cwd) {
  execFileSync(comando, argumentos, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
}

/* 1 · O domínio compila antes de qualquer coisa. Um `dist` velho publicado é pior do que nenhum: o consumidor
      recebe uma versão nova com código antigo dentro. */
rodar('npx', ['tsc', '--build', '--force', 'packages/domain'], RAIZ)

/* 2 · O manifesto de publicação, derivado do de desenvolvimento. */
const desenvolvimento = JSON.parse(readFileSync(join(PACOTE, 'package.json'), 'utf8'))
const publicado = {
  name: desenvolvimento.name,
  version: desenvolvimento.version,
  type: 'module',
  description: desenvolvimento.description,
  license: desenvolvimento.license,
  repository: desenvolvimento.repository,
  /* A diferença inteira entre os dois manifestos são estas quatro linhas. */
  exports: { '.': { types: './dist/src/index.d.ts', import: './dist/src/index.js' } },
  types: './dist/src/index.d.ts',
  main: './dist/src/index.js',
  files: ['dist/src'],
  publishConfig: { registry: 'https://npm.pkg.github.com', access: 'restricted' },
  dependencies: desenvolvimento.dependencies ?? {},
}

rmSync(PREPARO, { recursive: true, force: true })
mkdirSync(PREPARO, { recursive: true })
writeFileSync(join(PREPARO, 'package.json'), `${JSON.stringify(publicado, null, 2)}\n`)
cpSync(join(PACOTE, 'dist', 'src'), join(PREPARO, 'dist', 'src'), { recursive: true })
cpSync(join(RAIZ, 'README.md'), join(PREPARO, 'README.md'))

/* 3 · Publica (ou empacota, no ensaio) a partir do preparo. */
rodar('npm', [ENSAIO ? 'pack' : 'publish'], PREPARO)

console.log(
  ENSAIO
    ? `\nEnsaio pronto em ${PREPARO} — confira o .tgz e o package.json antes de publicar de verdade.`
    : `\n${publicado.name}@${publicado.version} publicado.`,
)
