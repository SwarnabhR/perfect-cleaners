import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/ui/StatusBadge';

const BOOKINGS = [
  { id: '#PC-2058', customer: 'Aarav Mehta',    car: 'BMW 3 Series · Mineral Grey',     service: 'Premium Wash + Interior', worker: 'Rahul Sharma', date: '27 May', time: '10:30 AM', amount: '₹1,080', status: 'inprogress' },
  { id: '#PC-2057', customer: 'Priya Singh',     car: 'Honda City · Pearl White',         service: 'Exterior Wash',            worker: 'Asha Rao',     date: '27 May', time: '11:00 AM', amount: '₹450',   status: 'enroute'   },
  { id: '#PC-2056', customer: 'Vikram Patel',    car: 'Audi Q5 · Phantom Black',          service: 'Premium + Ceramic Coat',   worker: 'Unassigned',   date: '27 May', time: '2:00 PM',  amount: '₹2,800', status: 'assigned'  },
  { id: '#PC-2055', customer: 'Neha Kapoor',     car: 'Maruti Brezza · Silky Silver',     service: 'Interior Detailing',       worker: 'Manoj Kumar',  date: '27 May', time: '4:30 PM',  amount: '₹950',   status: 'assigned'  },
  { id: '#PC-2054', customer: 'Sameer Khan',     car: 'Tata Harrier · Calypso Red',       service: 'Exterior Wash',            worker: 'Sunil Bhar.',  date: '27 May', time: '6:15 PM',  amount: '₹450',   status: 'done'      },
  { id: '#PC-2053', customer: 'Ananya Verma',    car: 'Hyundai Creta · Typhoon Silver',   service: 'Premium Wash',             worker: 'Pradeep Menon',date: '26 May', time: '9:00 AM',  amount: '₹1,080', status: 'done'      },
  { id: '#PC-2052', customer: 'Raj Malhotra',    car: 'Mercedes C-Class · Obsidian Black',service: 'Elite Detail + PPF',       worker: 'Vikrant Bose', date: '26 May', time: '10:00 AM', amount: '₹8,400', status: 'done'      },
  { id: '#PC-2051', customer: 'Divya Nair',      car: 'Toyota Fortuner · White Pearl',    service: 'Exterior + Interior',      worker: 'Rahul Sharma', date: '26 May', time: '1:00 PM',  amount: '₹1,600', status: 'done'      },
  { id: '#PC-2050', customer: 'Karan Gupta',     car: 'Kia Seltos · Gravity Grey',        service: 'Exterior Wash',            worker: 'Asha Rao',     date: '26 May', time: '3:30 PM',  amount: '₹450',   status: 'done'      },
  { id: '#PC-2049', customer: 'Meera Iyer',      car: 'Mahindra XUV700 · Red Rage',       service: 'Interior Detailing',       worker: 'Pradeep Menon',date: '25 May', time: '11:30 AM', amount: '₹950',   status: 'done'      },
  { id: '#PC-2048', customer: 'Arjun Reddy',     car: 'BMW X5 · Arctic Grey',             service: 'Premium + Coat',           worker: 'Vikrant Bose', date: '25 May', time: '9:00 AM',  amount: '₹2,800', status: 'cancelled' },
];

const COLS = ['BOOKING', 'CUSTOMER', 'CAR', 'SERVICE', 'WORKER', 'DATE & TIME', 'AMOUNT', 'STATUS', ''];
const COLS_TEMPLATE = '90px 1.2fr 1.4fr 1.4fr 1fr 110px 90px 130px 40px';

const STATS = [
  { label: 'TOTAL TODAY', value: '47', icon: 'calendar' },
  { label: 'IN PROGRESS', value: '11', icon: 'clock' },
  { label: 'COMPLETED', value: '32', icon: 'check-circle' },
  { label: 'CANCELLED', value: '4', icon: 'x-circle' },
];

export default function BookingsPage() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow>[BOOKINGS] · 27 MAY 2026</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 38, color: '#fff', letterSpacing: '-0.02em', marginTop: 8 }}>
            All bookings.
          </div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          New Booking
        </button>
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

      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['All', 'Assigned', 'En Route', 'In Progress', 'Done', 'Cancelled'].map((t, i) => (
          <span key={t} style={{
            padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: i === 0 ? 'var(--pc-warm)' : 'transparent',
            color: i === 0 ? 'var(--pc-ink)' : 'var(--pc-fg-2)',
            border: i === 0 ? 'none' : '1px solid var(--pc-line)',
          }}>{t}</span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            borderRadius: 8, padding: '7px 12px',
          }}>
            <Icon name="search" size={13} color="var(--pc-fg-3)" />
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>Search bookings...</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            borderRadius: 8, padding: '7px 12px',
          }}>
            <Icon name="calendar" size={13} color="var(--pc-fg-3)" />
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-2)', letterSpacing: '0.06em' }}>27 MAY 2026</span>
            <Icon name="chevron-down" size={12} color="var(--pc-fg-3)" />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: COLS_TEMPLATE,
          padding: '10px 18px', borderBottom: '1px solid var(--pc-line)', gap: 12,
        }}>
          {COLS.map(h => (
            <div key={h} style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {/* Rows */}
        {BOOKINGS.map((b, i) => (
          <div key={b.id} style={{
            display: 'grid', gridTemplateColumns: COLS_TEMPLATE,
            padding: '13px 18px', gap: 12, alignItems: 'center',
            borderBottom: i < BOOKINGS.length - 1 ? '1px solid var(--pc-line)' : 'none',
            cursor: 'pointer',
          }}>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)', letterSpacing: '0.04em' }}>{b.id}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={b.customer} size={26} />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff' }}>{b.customer}</span>
            </div>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{b.car}</span>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: '#fff' }}>{b.service}</span>
            <span style={{
              fontFamily: 'var(--pc-sans)', fontSize: 12,
              color: b.worker === 'Unassigned' ? 'var(--pc-warning)' : 'var(--pc-fg-2)',
            }}>{b.worker}</span>
            <div>
              <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>{b.time}</div>
              <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.06em' }}>{b.date.toUpperCase()}</div>
            </div>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: '#fff' }}>{b.amount}</span>
            <StatusBadge status={b.status} />
            <Icon name="more-horizontal" size={14} color="var(--pc-fg-3)" />
          </div>
        ))}
      </Card>
    </div>
  );
}
