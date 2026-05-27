import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import CTASection from '@/components/marketing/CTASection';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Expert advice, industry truths, and guides on maintaining your vehicle to the highest standard.',
};

const POSTS = [
  {
    id: 1,
    title:    'Why Ceramic Coating is an Investment, Not an Expense',
    date:     'May 20, 2026',
    category: 'Education',
    readTime: '5 min',
    img:      '/journal-coating.png',
  },
  {
    id: 2,
    title:    'The Truth About Dealership "Paint Protection"',
    date:     'May 12, 2026',
    category: 'Industry',
    readTime: '4 min',
    img:      '/journal-showroom.png',
  },
  {
    id: 3,
    title:    'How to Maintain Your Car After a Detail',
    date:     'May 05, 2026',
    category: 'Guides',
    readTime: '7 min',
    img:      '/journal-snow-foam.png',
  },
];

export default function JournalPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <SectionHeader
          badgeText="[THE JOURNAL]"
          title="Insights on Car Care."
          subtitle="Expert advice, industry truths, and guides on maintaining your vehicle to the highest standard."
        />

        <div style={{ padding: '24px var(--pc-screen-pad-lg) 80px', maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {POSTS.map(post => (
            <Link key={post.id} href="#" style={{ textDecoration: 'none' }}>
              <Card style={{ padding: 'clamp(20px, 4vw, 32px)', display: 'flex', gap: 'clamp(16px, 4vw, 32px)', alignItems: 'center', cursor: 'pointer' }}>
                {/* Fixed-size thumbnail — use explicit dimensions, not fill, for a known-size container */}
                <div style={{
                  width: 'clamp(100px, 20vw, 160px)',
                  height: 'clamp(100px, 20vw, 160px)',
                  background: 'var(--pc-card-hi)',
                  borderRadius: 12,
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: '1px solid var(--pc-line)',
                  position: 'relative',
                }}>
                  <Image
                    src={post.img}
                    alt={post.title}
                    fill
                    sizes="(max-width: 480px) 100px, 160px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-sage-hi)', textTransform: 'uppercase', letterSpacing: 'var(--pc-track-mono)' }}>
                      {post.category}
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: 2, background: 'var(--pc-fg-4)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>{post.date}</span>
                    <span style={{ width: 3, height: 3, borderRadius: 2, background: 'var(--pc-fg-4)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>{post.readTime} read</span>
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--pc-serif)',
                    fontSize: 'clamp(20px, 3vw, 32px)',
                    color: 'var(--pc-fg)',
                    marginBottom: 16,
                    lineHeight: 1.2,
                    letterSpacing: 'var(--pc-track-tight)',
                  }}>
                    {post.title}
                  </h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--pc-fg-2)', fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500 }}>
                    Read Article <Icon name="arrow-right" size={16} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
