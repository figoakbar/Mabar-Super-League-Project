/**
 * The stylized "IAGL" wordmark lifted from the official logo (cream lettering,
 * transparent background). Size it by height, e.g. className="h-[22px] w-auto".
 */
export function IaglWordmark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/iagl-wordmark.png"
      alt="IAGL"
      width={84}
      height={18}
      className={`w-auto object-contain ${className ?? ""}`}
    />
  );
}
