'use client';
import { Fragment, useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Customer, Booking } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LiveCustomer = Customer & { id: string };
type LiveBooking  = Booking  & { id: string };
type SavedAddress = {
  id: string;
  flatNo?: string;
  tower?: string;
  societyName?: string;
  garageNo?: string;
  primary?: boolean;
};

type MaybeTs = { toDate?(): Date } | Date | string | number | null | undefined;
function formatJoined(ts: MaybeTs): string {
  if (!ts) return '—';
  const d = (ts as { toDate?(): Date }).toDate
    ? (ts as { toDate(): Date }).toDate()
    : new Date(ts as string | number | Date);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function CustomersPage() {
  const [customers,     setCustomers]     = useState<LiveCustomer[]>([]);
  const [bookings,      setBookings]      = useState<LiveBooking[]>([]);
  const [search,        setSearch]        = useState('');
  const [societyFilter, setSocietyFilter] = useState('All');
  const [loading,       setLoading]       = useState(true);
  const [addressCustomerId, setAddressCustomerId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressIds, setSelectedAddressIds] = useState<Set<string>>(new Set());
  const [addressError, setAddressError] = useState('');
  const [addressNotice, setAddressNotice] = useState('');
  const [deletingAddresses, setDeletingAddresses] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'customers'), orderBy('createdAt', 'desc'), limit(200)),
      snap => { setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveCustomer))); setLoading(false); },
      err  => { console.warn('[Customers]', err.message); setLoading(false); },
    );
  }, []);

  useEffect(() => {
    if (!addressCustomerId) {
      setAddresses([]);
      setSelectedAddressIds(new Set());
      return;
    }
    setAddressesLoading(true);
    setAddressError('');
    return onSnapshot(
      collection(db, 'customers', addressCustomerId, 'addresses'),
      snap => {
        setAddresses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedAddress)));
        setSelectedAddressIds(current => new Set([...current].filter(id => snap.docs.some(d => d.id === id))));
        setAddressesLoading(false);
      },
      err => {
        console.warn('[Customer addresses]', err.message);
        setAddressError('Could not load this customer’s addresses. Check your admin access and try again.');
        setAddressesLoading(false);
      },
    );
  }, [addressCustomerId]);

  function toggleAddressSelection(id: string) {
    setSelectedAddressIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function deleteAddressesForCustomer(customerId: string, targets: SavedAddress[], allAddresses: SavedAddress[]) {
    if (!targets.length || deletingAddresses) return;
    const countLabel = `${targets.length} address${targets.length === 1 ? '' : 'es'}`;
    if (!window.confirm(`Delete ${countLabel}? This cannot be undone.`)) return;

    setDeletingAddresses(true);
    setAddressError('');
    setAddressNotice('');
    const removedIds = new Set<string>();
    try {
      const results = await Promise.allSettled(targets.map(address =>
        deleteDoc(doc(db, 'customers', customerId, 'addresses', address.id)),
      ));
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') removedIds.add(targets[index].id);
      });

      const primaryWasRemoved = targets.some(address => address.primary && removedIds.has(address.id));
      if (primaryWasRemoved) {
        const replacement = allAddresses.find(address => !removedIds.has(address.id) && !targets.some(target => target.id === address.id));
        if (replacement) {
          try {
            await updateDoc(doc(db, 'customers', customerId, 'addresses', replacement.id), { primary: true });
          } catch {
            setAddressError('Addresses were deleted, but the remaining address could not be set as primary.');
          }
        }
      }

      setSelectedAddressIds(current => new Set([...current].filter(id => !removedIds.has(id))));
      if (removedIds.size === targets.length) setAddressNotice(`Deleted ${removedIds.size} address${removedIds.size === 1 ? '' : 'es'}.`);
      else if (removedIds.size > 0) setAddressNotice(`Deleted ${removedIds.size} of ${targets.length} selected addresses.`);
      if (removedIds.size < targets.length) setAddressError('Some addresses could not be deleted. Check your admin access and try again.');
    } catch (err) {
      console.error('[Customer addresses] Delete failed', err);
      setAddressError('Could not delete the selected addresses. Check your admin access and try again.');
    } finally {
      setDeletingAddresses(false);
    }
  }

  async function deleteSelectedAddresses() {
    if (!addressCustomerId || selectedAddressIds.size === 0) return;
    await deleteAddressesForCustomer(
      addressCustomerId,
      addresses.filter(address => selectedAddressIds.has(address.id)),
      addresses,
    );
  }

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'bookings'), limit(500)),
      snap => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBooking))),
    );
  }, []);

  // Per-customer stats derived from bookings
  const statsMap = bookings.reduce<Record<string, { jobs: number; spent: number }>>((acc, b) => {
    const cid = b.customerId;
    if (!cid) return acc;
    if (!acc[cid]) acc[cid] = { jobs: 0, spent: 0 };
    acc[cid].jobs += 1;
    if (b.paymentStatus === 'paid') acc[cid].spent += b.priceBreakdown?.total ?? 0;
    return acc;
  }, {});

  const enriched = customers
    .filter(c => c.role !== 'worker')
    .map(c => {
      const stats = statsMap[c.id] ?? { jobs: 0, spent: 0 };
      return { ...c, ...stats };
    });

  // Unique society names + per-society counts derived from customers
  const societyCounts = enriched.reduce<Record<string, number>>((acc, c) => {
    const name = c.societyName;
    if (name) acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const societyOptions = Object.entries(societyCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const filtered = enriched.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchSociety = societyFilter === 'All' || c.societyName === societyFilter;
    return matchSearch && matchSociety;
  });

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeIds = new Set(
    bookings
      .filter(b => {
        const ts = b.createdAt as MaybeTs;
        const t = (ts as { toDate?(): Date })?.toDate
          ? (ts as { toDate(): Date }).toDate().getTime()
          : new Date(ts as string | number | Date).getTime();
        return t > thirtyDaysAgo;
      })
      .map(b => b.customerId),
  );

  const totalOutstanding = customers.reduce((s, c) => s + (c.outstandingBalance ?? 0), 0);

  const kpis = [
    { label: 'Total Customers', value: loading ? '—' : enriched.length.toLocaleString(), icon: 'users' },
    { label: 'Active (30d)',    value: loading ? '—' : activeIds.size.toLocaleString(), icon: 'user-check' },
    { label: 'Outstanding',     value: loading ? '—' : totalOutstanding > 0 ? `₹${totalOutstanding.toLocaleString('en-IN')}` : '₹0', icon: 'indian-rupee' },
    { label: 'Avg Lifetime',    value: loading ? '—' : enriched.length
        ? `₹${Math.round(enriched.reduce((s, c) => s + c.spent, 0) / enriched.length).toLocaleString('en-IN')}`
        : '₹0', icon: 'trending-up' },
  ];

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CRM</Eyebrow>
          <h1 className="admin-page-title">Customers</h1>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid-4">
        {kpis.map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Row 1: search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone…"
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, boxSizing: 'border-box',
                background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
                fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Row 2: society filter */}
        {societyOptions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4, flexShrink: 0 }}>Society</span>
            <button type="button" onClick={() => setSocietyFilter('All')} style={{
              padding: '5px 12px', borderRadius: 999, border: '1px solid',
              borderColor: societyFilter === 'All' ? 'var(--pc-sage)' : 'var(--pc-line)',
              background:  societyFilter === 'All' ? 'var(--pc-sage)' : 'transparent',
              color:       societyFilter === 'All' ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer',
            }}>All</button>
            {societyOptions.map(({ name, count }) => (
              <button type="button" key={name} onClick={() => setSocietyFilter(name)} style={{
                padding: '5px 12px', borderRadius: 999, border: '1px solid',
                borderColor: societyFilter === name ? 'var(--pc-sage)' : 'var(--pc-line)',
                background:  societyFilter === name ? 'var(--pc-sage)' : 'transparent',
                color:       societyFilter === name ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {name}
                <span style={{
                  padding: '1px 6px', borderRadius: 999,
                  background: societyFilter === name ? 'color-mix(in srgb, var(--pc-sage-ink) 25%, transparent)' : 'var(--pc-card-hi)',
                  fontFamily: 'var(--pc-mono)', fontSize: 10,
                  color: societyFilter === name ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)',
                }}>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No customers found.</div>
        ) : (
          <div className="table-scroll-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['Customer', 'Society', 'Phone', 'Vehicles', 'Jobs', 'Total Spent', 'Outstanding', 'Joined', 'Addresses'].map(h => (
                  <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <Fragment key={c.id}>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  <td style={{ padding: '13px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                          {c.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 500 }}>{c.name || '—'}</p>
                        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0 }}>{c.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    {c.societyName ? (
                      <div>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: '0 0 1px' }}>{c.societyName}</p>
                        {c.unitNumber && <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: 0, letterSpacing: '0.04em' }}>{c.unitNumber}</p>}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--pc-fg-4)', fontFamily: 'var(--pc-sans)', fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                    {c.phone || '—'}
                  </td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                    {c.vehicles?.length
                      ? c.vehicles.map(v => `${v.make} ${v.model}`).join(', ')
                      : <span style={{ color: 'var(--pc-fg-4)' }}>None</span>}
                  </td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{c.jobs}</td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>
                    {c.spent > 0 ? `₹${c.spent.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    {(c.outstandingBalance ?? 0) > 0 ? (
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                        color: 'var(--pc-danger)', background: 'color-mix(in srgb, var(--pc-danger) 10%, transparent)',
                        padding: '2px 8px', borderRadius: 4 }}>
                        ₹{(c.outstandingBalance ?? 0).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                    {formatJoined(c.createdAt)}
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAddresses([]);
                        setAddressCustomerId(current => current === c.id ? null : c.id);
                        setSelectedAddressIds(new Set());
                        setAddressNotice('');
                      }}
                      aria-expanded={addressCustomerId === c.id}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--pc-line)', background: addressCustomerId === c.id ? 'var(--pc-card-hi)' : 'transparent', color: 'var(--pc-fg-2)', fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {addressCustomerId === c.id ? 'Hide' : 'Manage'}
                    </button>
                  </td>
                </tr>
                {addressCustomerId === c.id && (
                  <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                    <td colSpan={9} style={{ padding: '16px 18px', background: 'var(--pc-card-hi)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                        <div>
                          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>Saved addresses for {c.name || c.phone || 'customer'}</p>
                          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: '3px 0 0' }}>Deleting a saved address does not change addresses on existing bookings.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {addresses.length > 0 && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={addresses.length > 0 && addresses.every(address => selectedAddressIds.has(address.id))}
                                onChange={event => setSelectedAddressIds(event.target.checked ? new Set(addresses.map(address => address.id)) : new Set())}
                                aria-label="Select all addresses"
                              />
                              Select all
                            </label>
                          )}
                          <button
                            type="button"
                            onClick={deleteSelectedAddresses}
                            disabled={selectedAddressIds.size === 0 || deletingAddresses}
                            style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid color-mix(in srgb, var(--pc-danger) 45%, var(--pc-line))', background: 'transparent', color: 'var(--pc-danger)', fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: selectedAddressIds.size === 0 || deletingAddresses ? 'not-allowed' : 'pointer', opacity: selectedAddressIds.size === 0 || deletingAddresses ? 0.5 : 1 }}
                          >
                            {deletingAddresses ? 'Deleting…' : `Delete selected${selectedAddressIds.size ? ` (${selectedAddressIds.size})` : ''}`}
                          </button>
                        </div>
                      </div>

                      {addressError && <p role="alert" style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-danger)', margin: '0 0 10px' }}>{addressError}</p>}
                      {addressNotice && <p role="status" style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-sage-hi)', margin: '0 0 10px' }}>{addressNotice}</p>}
                      {addressesLoading ? (
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>Loading addresses…</p>
                      ) : addresses.length === 0 ? (
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>No saved addresses.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {addresses.map(address => (
                            <div key={address.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--pc-line)', background: 'var(--pc-card)' }}>
                              <input type="checkbox" checked={selectedAddressIds.has(address.id)} onChange={() => toggleAddressSelection(address.id)} aria-label={`Select address ${address.flatNo || address.id}`} />
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>
                                  Flat {address.flatNo || '—'}{address.tower ? `, ${address.tower}` : ''}{address.garageNo ? ` · Garage ${address.garageNo}` : ''}
                                </span>
                                <span style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', marginTop: 2 }}>{address.societyName || 'Society not specified'}</span>
                              </span>
                              {address.primary && <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-info)', letterSpacing: '0.06em' }}>PRIMARY</span>}
                              <button
                                type="button"
                                onClick={() => void deleteAddressesForCustomer(c.id, [address], addresses)}
                                disabled={deletingAddresses}
                                style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid var(--pc-line)', background: 'transparent', color: 'var(--pc-danger)', fontFamily: 'var(--pc-sans)', fontSize: 11, cursor: deletingAddresses ? 'not-allowed' : 'pointer' }}
                              >Delete</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </div>
  );
}
