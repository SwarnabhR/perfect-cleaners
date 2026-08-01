export const metadata = {
  // Root layout template adds " | Perfect Cleaners"
  title: 'Cleaning Session',
};

// Worker-facing session page: always dark, independent of the site's theme
// toggle. `pc-force-dark` (globals.css) re-declares the dark token set so
// var(--pc-*) resolves correctly here no matter what data-theme is on <html>.
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pc-force-dark" style={{ minHeight: '100dvh', background: 'var(--pc-ink)' }}>
      {children}
    </div>
  );
}
