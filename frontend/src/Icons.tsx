import type { SVGProps } from 'react'

const P: Record<string, string> = {
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z',
  brush: 'M14 4l6 6-8 8H6v-6zM12 6l6 6',
  box: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1-4 4-6 8-6s7 2 8 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  image: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 16l5-5 5 5M13 14l2-2 5 5M15.5 8.5h.01',
  plus: 'M12 5v14M5 12h14',
  pen: 'M4 20l4-1 11-11-3-3L5 16zM14 7l3 3',
  eraser: 'M8 20h12M5 15l9-9 5 5-8 8H8z',
  picker: 'M14 4l6 6M17 7l-9 9-4 1 1-4 9-9M12 6l6 6',
  bucket: 'M5 11l7-7 7 7-7 7zM19 15s2 2.5 2 4a2 2 0 0 1-4 0c0-1.5 2-4 2-4z',
  wand: 'M4 20L15 9M17 3v4M15 5h4M20 9v2M19 10h2M10 3v2M9 4h2',
  mirror: 'M12 3v18M8 7L4 12l4 5zM16 7l4 5-4 5z',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  back: 'M15 5l-7 7 7 7',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  grid: 'M4 4h16v16H4zM4 10h16M4 15h16M10 4v16M15 4v16',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  check: 'M5 12l4 4 10-10',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  share: 'M8 12l8-5M8 12l8 5M6 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  crown: 'M4 18h16M5 15l-1-9 5 4 3-6 3 6 5-4-1 9z',
  draft: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
  star: 'M12 4l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.5-1.5L17 5l-3-1-1 2h-2l-1-2-3 1 .3 2L5.8 8.3 4 8l-1 3 2 1v0l-2 1 1 3 2-.3 1.5 1.5L7 19l3 1 1-2h2l1 2 3-1-.3-2 1.5-1.5 2 .5 1-3z',
  chevron: 'M9 5l7 7-7 7',
  cart: 'M3 4h2l2 11h11l2-8H6M9 20h.01M17 20h.01',
  minus: 'M5 12h14',
  swap: 'M7 7h12l-3-3M17 17H5l3 3',
  lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
  close: 'M6 6l12 12M18 6L6 18',
}

export function Icon({ name, size = 22, ...rest }: { name: keyof typeof P | string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d={P[name]} />
    </svg>
  )
}
