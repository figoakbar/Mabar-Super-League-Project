export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07]">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-center text-sm text-[#9b8fc0]">
        © {new Date().getFullYear()} Mabar Super League. All rights reserved.
      </div>
    </footer>
  );
}
