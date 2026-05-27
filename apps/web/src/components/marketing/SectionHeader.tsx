import Pill from '@/components/ui/Pill';
import { AvatarStack } from '@/components/ui/Avatar';
import React from 'react';

interface SectionHeaderProps {
  title?: React.ReactNode;
  badgeText?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export default function SectionHeader({
  title = "From a simple wash to comprehensive detailing",
  badgeText = "9K+ Satisfied Customers",
  subtitle
}: SectionHeaderProps) {
  return (
    <div style={{ padding: '80px 56px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {badgeText && (
        <Pill sage style={{ alignSelf: 'flex-start', padding: '6px 14px 6px 6px' }}>
          {typeof badgeText === 'string' && badgeText.includes('Customers') ? <AvatarStack count={4} /> : null}
          <span style={{ marginLeft: 6, fontSize: 12 }}>{badgeText}</span>
        </Pill>
      )}
      <div style={{
        fontFamily: 'var(--pc-serif)', fontSize: 48, lineHeight: 1.05,
        color: '#fff', letterSpacing: '-0.02em', maxWidth: 720,
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5, maxWidth: 720 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
