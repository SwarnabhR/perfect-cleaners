import Pill from '@/components/ui/Pill';
import { AvatarStack } from '@/components/ui/Avatar';

export default function SectionHeader() {
  return (
    <div style={{ padding: '80px 56px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Pill sage style={{ alignSelf: 'flex-start', padding: '6px 14px 6px 6px' }}>
        <AvatarStack count={4} />
        <span style={{ marginLeft: 6, fontSize: 12 }}>9K+ Satisfied Customers</span>
      </Pill>
      <div style={{
        fontFamily: 'var(--pc-serif)', fontSize: 48, lineHeight: 1.05,
        color: '#fff', letterSpacing: '-0.02em', maxWidth: 720,
      }}>
        From a simple wash to comprehensive detailing
      </div>
    </div>
  );
}
