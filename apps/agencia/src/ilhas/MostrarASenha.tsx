/**
 * **O olho no fim do campo da senha** — no lugar do botão "Mostrar" ao lado (PO, 2026-10-23, no aceite do roteiro 10:
 * "o botão mostrar deve ser um trailing icon de olho no final do campo"). O mesmo no entrar, no criar a conta e na
 * senha nova.
 *
 * O nome do botão não muda ("Mostrar a senha"); quem diz se está mostrando é o `aria-pressed`, que o leitor de tela
 * anuncia. Trocar o nome junto com o estado faria o leitor dizer "Esconder, pressionado". O desenho troca: o olho
 * aberto mostra, o riscado esconde.
 *
 * O desenho vem do design system, como o `Icone.astro` o monta: aqui é ilha, e o `.astro` não entra no React.
 */
import { DESENHOS, LADO_DO_ICONE } from '@navegsistemas/design-system'

export default function MostrarASenha({ mostrando, aoTrocar }: { readonly mostrando: boolean; readonly aoTrocar: () => void }) {
  const desenho = DESENHOS[mostrando ? 'olho-fechado' : 'olho']
  return (
    <button
      type="button"
      className="conta-olho"
      aria-label="Mostrar a senha"
      title={mostrando ? 'Esconder a senha' : 'Mostrar a senha'}
      aria-pressed={mostrando}
      onClick={aoTrocar}
    >
      <svg
        width={22}
        height={22}
        viewBox={`0 0 ${LADO_DO_ICONE} ${LADO_DO_ICONE}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {desenho.caminhos.map((caminho) => (
          <path key={caminho} d={caminho} />
        ))}
      </svg>
    </button>
  )
}
