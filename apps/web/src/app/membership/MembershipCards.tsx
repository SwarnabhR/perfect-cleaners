'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

// ─── Plan data ────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id:       'essential',
    eyebrow:  'ESSENTIAL',
    price:    '₹2,500',
    tagline:  'Perfect for daily drivers that need a monthly reset.',
    popular:  false,
    features: [
      '1× Premium Wash per month',
      '1× Basic Interior wipe-down',
      '10% off additional services',
      'Priority booking slots',
    ],
  },
  {
    id:       'enthusiast',
    eyebrow:  'ENTHUSIAST',
    price:    '₹4,500',
    tagline:  'For vehicles that command a flawless presence.',
    popular:  true,
    features: [
      '2× Premium Wash per month',
      '1× Deep Interior Detailing',
      'Monthly spray wax application',
      '20% off Ceramic & PPF',
      'VIP emergency spot cleaning',
    ],
  },
  {
    id:       'obsessive',
    eyebrow:  'OBSESSIVE',
    price:    '₹8,000',
    tagline:  'The ultimate package for show cars and exotics.',
    popular:  false,
    features: [
      'Weekly Premium Wash',
      'Bi-weekly Deep Interior',
      'Quarterly Ceramic Boost',
      '30% off additional services',
      'Free pickup & delivery',
    ],
  },
] as const;

type TierId = typeof TIERS[number]['id'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MembershipCards() {
  const router            = useRouter();
  const { user }          = useCustomerAuth();
  const [authOpen, setAuthOpen]     = useState(false);
  const [pendingTier, setPendingTier] = useState<TierId | null>(null);
  const [saving, setSaving]         = useState<TierId | null>(null);

  async function selectTier(tierId: TierId) {
    if (!user) {
      setPendingTier(tierId);
      setAuthOpen(true);
      return;
    }
    await saveMembership(tierId, user.uid, user.phoneNumber ?? '');
  }

  async function saveMembership(tierId: TierId, uid: string, phone: string) {
    setSaving(tierId);
    try {
      await addDoc(collection(db, 'membershipInterests'), {
        userId:    uid,
        phone,
        tier:      tierId,
        status:    'pending',
        createdAt: serverTimestamp(),
      });
      router.push(`/book?plan=${tierId}`);
    } catch (err) {
      console.error('[Membership]', err);
      router.push(`/book?plan=${tierId}`);
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <AuthBottomSheet
        open={authOpen}
        onClose={() => { setAuthOpen(false); setPendingTier(null); }}
        heading="Sign in to select your membership plan."
        onSuccess={(uid) => {
          setAuthOpen(false);
          if (pendingTier) saveMembership(pendingTier, uid, '');
        }}
      />

      <div
        className="pc-membership-grid"
        style={{
          padding: 'var(--pc-space-6) var(--pc-screen-pad-lg) var(--pc-space-20)',
          maxWidth: 1100, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {TIERS.map(tier => (
          <Card
            key={tier.id}
            style={{
              padding: 'clamp(24px, 4vw, 40px)',
              border: `1px solid ${tier.popular ? 'rgba(91,111,82,0.55)' : 'var(--pc-line)'}`,
              display: 'flex', flexDirection: 'column',
              position: 'relative',
              boxShadow: tier.popular ? 'var(--pc-shadow-glow-sage)' : 'none',
            }}
          >
            {tier.popular && (
              <div style={{
                position: 'absolute', top: -13, left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--pc-sage)', color: 'var(--pc-sage-ink)',
                padding: '4px 14px', borderRadius: 999,
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.1em', whiteSpace: 'nowrap',
              }}>
                MOST POPULAR
              </div>
            )}

            <Eyebrow style={{
              marginBottom: 8, display: 'block',
              color: tier.popular ? 'var(--pc-sage-hi)' : undefined,
            }}>
              {tier.eyebrow}
            </Eyebrow>

            <div style={{
              fontFamily: 'var(--pc-serif)', fontSize: 'clamp(36px, 4vw, 48px)',
              color: 'var(--pc-fg)', lineHeight: 1, marginBottom: 6,
            }}>
              {tier.price}
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-3)', marginLeft: 6 }}>
                /mo
              </span>
            </div>

            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 14,
              color: 'var(--pc-fg-2)', marginBottom: 28, lineHeight: 1.5,
            }}>
              {tier.tagline}
            </p>

            <ul style={{
              listStyle: 'none', padding: 0, margin: '0 0 32px',
              display: 'flex', flexDirection: 'column', gap: 12, flex: 1,
            }}>
              {tier.features.map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Icon
                    name="check" size={14}
                    color={tier.popular ? 'var(--pc-sage-hi)' : 'var(--pc-fg-3)'}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', lineHeight: 1.4 }}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={saving === tier.id}
              onClick={() => selectTier(tier.id)}
              style={{
                display: 'block', width: '100%',
                padding: '13px 0', borderRadius: 999,
                background: tier.popular ? 'var(--pc-warm)' : 'transparent',
                color: tier.popular ? 'var(--pc-ink)' : 'var(--pc-fg)',
                border: tier.popular ? 'none' : '1px solid var(--pc-line-strong)',
                fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: tier.popular ? 600 : 500,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                cursor: saving === tier.id ? 'not-allowed' : 'pointer',
                opacity: saving === tier.id ? 0.6 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              {saving === tier.id ? 'Setting up…' : `Select ${tier.eyebrow.charAt(0) + tier.eyebrow.slice(1).toLowerCase()}`}
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
