/**
 * The IAGL logo mark — the official "A" + headset-gamer logo, recolored to the
 * site's gold theme, with a transparent background (the dark gamer silhouette
 * shows through on the dark UI). object-contain preserves its aspect inside
 * whatever square box the caller sizes it to.
 */
export function IaglMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/iagl-mark.png"
      alt="IAGL"
      className={`object-contain ${className ?? ""}`}
    />
  );
}
