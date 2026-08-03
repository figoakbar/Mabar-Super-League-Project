// A template (not a layout) re-mounts on every navigation with a fresh key, so
// this wrapper is newly inserted each time you move between pages — which
// replays the fade below.
//
// Only the page's <main> fades; the header and footer stay still, so switching
// menus feels smooth instead of the whole screen blinking. The fade is
// opacity-only, which also can't break the sticky header.
//
// The animation is colocated here as a <style> (not in globals.css) on purpose:
// a component's styles are delivered with the component, so this keeps working
// even when a cached global stylesheet is serving stale rules.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-transition">
      <style
        // A stable href + precedence lets React hoist and de-duplicate this
        // style instead of re-inserting it on every navigation.
        href="page-transition-style"
        precedence="default"
      >{`
        @media (prefers-reduced-motion: no-preference) {
          .page-transition main { animation: page-content-in 240ms ease-out both; }
        }
        @keyframes page-content-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      {children}
    </div>
  );
}
