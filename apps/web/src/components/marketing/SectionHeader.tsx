import Pill from '@/components/ui/Pill';
import { AvatarStack } from '@/components/ui/Avatar';
import React from 'react';

interface SectionHeaderProps {
  title?: React.ReactNode;
  badgeText?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export default function SectionHeader({
  title = "Every service your car will ever need.",
  badgeText = "1,500+ Cars Detailed",
  subtitle
}: SectionHeaderProps) {
  return (
    <div style={{ padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
      {badgeText && (
        <Pill sage style={{ alignSelf: 'flex-start', padding: 'var(--pc-space-2) var(--pc-space-4) var(--pc-space-2) var(--pc-space-2)' }}>
          {typeof badgeText === 'string' && badgeText.includes('Customers') ? <AvatarStack count={4} /> : null}
          <span style={{ marginLeft: 'var(--pc-space-2)', fontSize: 'var(--pc-text-xs)' }}>{badgeText}</span>
        </Pill>
      )}
      <div style={{
        fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-hero)', lineHeight: 1.05,
        color: 'var(--pc-fg)', letterSpacing: '-0.02em', maxWidth: 720,
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-lg)', color: 'var(--pc-fg-2)', lineHeight: 1.5, maxWidth: 720 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
