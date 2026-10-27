/** Transición de página ligera (§4.5): fade + 8 px, respeta prefers-reduced-motion vía CSS. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
