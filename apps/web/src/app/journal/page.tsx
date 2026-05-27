import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

const POSTS = [
  { id: 1, title: 'Why Ceramic Coating is an Investment, Not an Expense', date: 'May 20, 2026', category: 'Education', readTime: '5 min' },
  { id: 2, title: 'The Truth About Dealership "Paint Protection"', date: 'May 12, 2026', category: 'Industry', readTime: '4 min' },
  { id: 3, title: 'How to Maintain Your Car After a Detail', date: 'May 05, 2026', category: 'Guides', readTime: '7 min' },
  { id: 4, title: 'Summer Heat & Paint Damage: What You Need to Know', date: 'Apr 28, 2026', category: 'Education', readTime: '5 min' },
];

export default function JournalPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, padding: '120px 56px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 80 }}>
          <Eyebrow>[THE JOURNAL]</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 72, color: 'var(--pc-fg)', margin: '16px 0 24px', lineHeight: 1.1 }}>
            Insights on Car Care.
          </h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>
            Expert advice, industry truths, and guides on maintaining your vehicle to the highest standard.
          </p>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {POSTS.map(post => (
            <Link key={post.id} href="#" style={{ textDecoration: 'none' }}>
              <Card style={{ padding: 32, display: 'flex', gap: 32, alignItems: 'center', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: 160, height: 160, background: 'var(--pc-card-hi)', borderRadius: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-sage)', textTransform: 'uppercase' }}>{post.category}</span>
                    <span style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--pc-fg-4)' }} />
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>{post.date}</span>
                    <span style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--pc-fg-4)' }} />
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>{post.readTime} read</span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginBottom: 16, lineHeight: 1.2 }}>{post.title}</h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500 }}>
                    Read Article <Icon name="arrow-right" size={16} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
