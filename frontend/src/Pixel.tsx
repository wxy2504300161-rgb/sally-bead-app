import { bead, type Grid } from './data'

export function PixelArt({ grid, className = '', bg = true }: { grid: Grid; className?: string; bg?: boolean }) {
  const n = grid[0].length
  return (
    <div className={`grid aspect-square ${className}`} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {grid.flat().map((c, i) => (
        <div key={i} className="flex items-center justify-center">
          {c ? (
            <span className="block w-[86%] h-[86%] rounded-full" style={{ background: bead(c).hex, boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.12), inset 0 0 0 1px rgba(0,0,0,.05)' }} />
          ) : bg ? null : null}
        </div>
      ))}
    </div>
  )
}
