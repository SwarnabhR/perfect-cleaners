export const metadata = {
  // Root layout template adds " | Perfect Cleaners"
  title: 'Cleaning Session',
};

// Worker-facing session page: always dark, independent of the site's theme toggle.
// background uses a hardcoded value because CSS vars resolve against the root
// html data-theme="light" and [data-theme="dark"] has no override rules.
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#0E0D0B' }}>
      {children}
    </div>
  );
}
