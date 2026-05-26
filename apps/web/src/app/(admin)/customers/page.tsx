import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';

const CUSTOMERS = [
  { name: 'Aarav Mehta',     phone: '+91 98765 43210', area: 'Indirapuram',    cars: 2, bookings: 14, spend: '₹18,240', lastBooking: '27 May', tier: 'Elite'    },
  { name: 'Priya Singh',     phone: '+91 98111 22333', area: 'Vaishali',       cars: 1, bookings: 9,  spend: '₹7,200',  lastBooking: '27 May', tier: 'Premium'  },
  { name: 'Raj Malhotra',    phone: '+91 99882 11000', area: 'Kaushambi',      cars: 3, bookings: 22, spend: '₹52,800', lastBooking: '26 May', tier: 'Elite'    },
  { name: 'Divya Nair',      phone: '+91 91234 56789', area: 'Kavi Nagar',     cars: 1, bookings: 7,  spend: '₹6,400',  lastBooking: '26 May', tier: 'Premium'  },
  { name: 'Vikram Patel',    phone: '+91 97654 32100', area: 'Raj Nagar Ext.', cars: 2, bookings: 5,  spend: '₹11,200', lastBooking: '27 May', tier: 'Premium'  },
  { name: 'Neha Kapoor',     phone: '+91 93456 78901', area: 'Vasundhara',     cars: 1, bookings: 3,  spend: '₹2,850',  lastBooking: '27 May', tier: 'Standard' },
  { name: 'Sameer Khan',     phone: '+91 96543 21098', area: 'Indirapuram',    cars: 1, bookings: 8,  spend: '₹4,600',  lastBooking: '27 May', tier: 'Standard' },
  { name: 'Ananya Verma',    phone: '+91 99001 12345', area: 'Vaishali',       cars: 2, bookings: 11, spend: '₹12,900', lastBooking: '26 May', tier: 'Premium'  },
  { name: 'Karan Gupta',     phone: '+91 98776 54321', area: 'Crossings Rep.', cars: 1, bookings: 6,  spend: '₹3,200',  lastBooking: '26 May', tier: 'Standard' },
  { name: 'Meera Iyer',      phone: '+91 91111 22222', area: 'Indirapuram',    cars: 1, bookings: 4,  spend: '₹4,200',  lastBooking: '25 May', tier: 'Standard' },
  { name: 'Arjun Reddy',     phone: '+91 94455 66778', area: 'Vasundhara',     cars: 2, bookings: 2,  spend: '₹5,600',  lastBooking: '25 May', tier: 'Premium'  },
  { name: 'Shreya Joshi',    phone: '+91 87654 32109', area: 'Raj Nagar Ext.', cars: 1, bookings: 1,  spend: '₹450',    lastBooking: '24 May', tier: 'Standard' },
];

const TIER_COLORS: Record<string, string> = {
  Elite:    '#D9A441',
  Premium:  '#5B6F52',
  Standard: '#6A8EAE',
};

const STATS = [
  { label: 'TOTAL CUSTOMERS', value: '9,241', icon: 'users' },
  { label: 'NEW THIS WEEK', value: '+84', icon: 'user-plus' },
  { label: 'ELITE TIER', value: '312', icon: 'star' },
  { label: 'RETENTION RATE', value: '73%', icon: 'repeat' },
];

const COLS = ['CUSTOMER', 'AREA', 'CARS', 'BOOKINGS', 'TOTAL SPEND', 'LAST BOOKING', 'TIER', ''];
const COLS_TEMPLATE = '1.4fr 140px 60px 90px 110px 120px 110px 40px';

export default function CustomersPage() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow>[CUSTOMERS] · 9,241 REGISTERED</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 38, color: '#fff', letterSpacing: '-0.02em', marginTop: 8 }}>
            Your clientele.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)', borderRadius: 999,
            padding: '10px 18px', cursor: 'pointer',
            fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', fontWeight: 500,
          }}>
            <Icon name="download" size={13} color="var(--pc-fg-2)" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATS.map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={icon} size={16} color="var(--pc-fg-2)" />
            </div>
            <div>
              <Eyebrow>{label}</Eyebrow>
              <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 26, color: '#fff', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['All', 'Elite', 'Premium', 'Standard'].map((t, i) => (
          <span key={t} style={{
            padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: i === 0 ? 'var(--pc-warm)' : 'transparent',
            color: i === 0 ? 'var(--pc-ink)' : 'var(--pc-fg-2)',
            border: i === 0 ? 'none' : '1px solid var(--pc-line)',
          }}>{t}</span>
        ))}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
          borderRadius: 8, padding: '7px 12px',
        }}>
          <Icon name="search" size={13} color="var(--pc-fg-3)" />
          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>Search customers...</span>
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: COLS_TEMPLATE,
          padding: '10px 18px', borderBottom: '1px solid var(--pc-line)', gap: 12,
        }}>
          {COLS.map(h => (
            <div key={h} style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {CUSTOMERS.map((c, i) => (
          <div key={c.name} style={{
            display: 'grid', gridTemplateColumns: COLS_TEMPLATE,
            padding: '13px 18px', gap: 12, alignItems: 'center',
            borderBottom: i < CUSTOMERS.length - 1 ? '1px solid var(--pc-line)' : 'none',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={c.name} size={30} />
              <div>
                <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff', fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.04em' }}>{c.phone}</div>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: '0.04em' }}>{c.area}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>{c.cars}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>{c.bookings}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: '#fff' }}>{c.spend}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>{c.lastBooking.toUpperCase()}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: TIER_COLORS[c.tier], flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{c.tier}</span>
            </span>
            <Icon name="more-horizontal" size={14} color="var(--pc-fg-3)" />
          </div>
        ))}
      </Card>
    </div>
  );
}
