'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { PendingApproval, CustomerSocietyRecord } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import { notifyApproval } from '@/lib/notification';

type LiveApproval = PendingApproval & { id: string };

interface ApprovalForm {
  paymentMethod: string;
  paymentNotes: string;
}

const BLANK_FORM: ApprovalForm = {
  paymentMethod: 'phone',
  paymentNotes: '',
};

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)',
  fontSize: 9.5,
  color: 'var(--pc-fg-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  boxSizing: 'border-box',
  background: 'var(--pc-card)',
  border: '1px solid var(--pc-line)',
  borderRadius: 8,
  color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)',
  fontSize: 14,
  outline: 'none',
};

export default function PendingApprovalsPage() {
  const [approvals, setApprovals] = useState<LiveApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [form, setForm] = useState<ApprovalForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'pendingApprovals'), where('status', '==', 'pending')),
      snap => {
        setApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveApproval)));
        setLoading(false);
      },
      err => {
        console.warn('[PendingApprovals]', err.message);
        setLoading(false);
      }
    );
  }, []);

  function openApprovalForm(approval: LiveApproval) {
    setApprovingId(approval.id);
    setForm(BLANK_FORM);
  }

  function closeApprovalForm() {
    setApprovingId(null);
    setForm(BLANK_FORM);
  }

  async function handleApprove(approval: LiveApproval) {
    if (!form.paymentMethod.trim() || saving) return;
    setSaving(true);

    try {
      // Generate a new customerId if not existing
      const customerId = approval.customerId || `customer_${approval.id}`;

      // 1. Create CustomerSocietyRecord
      const recordId = `${customerId}_${approval.societyId}_${approval.tower}`;
      await setDoc(doc(db, 'customerSocietyRecords', recordId), {
        customerId,
        societyId: approval.societyId,
        societyName: approval.societyName,
        tower: approval.tower,
        cars: [
          {
            plate: approval.carPlate,
            make: approval.carMake,
            model: approval.carModel,
          },
        ],
        preferredCleaningTime: approval.preferredCleaningTime,
        signupSource: 'self_signup',
        status: 'active',
        monthlyFee: 500, // Will be fetched from societyBillingConfig
        nextBillingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        paymentStatus: 'verified',
        paymentMethod: form.paymentMethod,
        paymentNotes: form.paymentNotes,
        skipDates: [],
        rescheduledSlots: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as any);

      // 2. Update PendingApproval to approved
      await setDoc(
        doc(db, 'pendingApprovals', approval.id),
        {
          status: 'approved',
          approvedAt: serverTimestamp(),
          approvedBy: 'admin', // TODO: Get actual admin UID
        },
        { merge: true }
      );

      // 3. Send SMS notification to customer
      const nextWeekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      await notifyApproval(
        approval.customerPhone,
        approval.customerName,
        approval.societyName,
        approval.tower,
        'Mon, Wed, Fri · 9:00 AM', // TODO: Fetch from societyBillingConfig
        nextWeekDate
      );

      closeApprovalForm();
    } catch (err: any) {
      console.error('[PendingApprovals] approve failed:', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReject(id: string, reason: string) {
    try {
      await setDoc(
        doc(db, 'pendingApprovals', id),
        {
          status: 'rejected',
          rejectionReason: reason,
        },
        { merge: true }
      );
    } catch (err: any) {
      console.error('[PendingApprovals] reject failed:', err.message);
    }
  }

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CUSTOMERS</Eyebrow>
        <h1 className="admin-page-title">Pending Approvals</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', margin: '8px 0 0' }}>
          Review new signup requests and verify customer details before approval
        </p>
      </div>

      {/* Stats */}
      <div className="kpi-grid-3">
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--pc-card-hi)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="hourglass" size={18} color="var(--pc-warning)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : approvals.length}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              AWAITING APPROVAL
            </p>
          </div>
        </Card>

        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--pc-card-hi)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="phone" size={18} color="var(--pc-info)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              —
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              CALL & VERIFY
            </p>
          </div>
        </Card>

        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--pc-card-hi)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="user-plus" size={18} color="var(--pc-sage)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              —
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              APPROVE
            </p>
          </div>
        </Card>
      </div>

      {/* List */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            Loading…
          </div>
        ) : approvals.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              No pending approvals
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              All signup requests have been reviewed.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
            {approvals.map(approval => (
              <div
                key={approval.id}
                style={{
                  background: 'var(--pc-card)',
                  border: '1px solid var(--pc-line)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                      {approval.customerName}
                    </p>
                    <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0, letterSpacing: '0.04em' }}>
                      +91 {approval.customerPhone.replace('+91', '').replace(/\D/g, '').slice(0, 5)} {approval.customerPhone.replace('+91', '').replace(/\D/g, '').slice(5)}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      background: 'color-mix(in srgb, var(--pc-warning) 12%, transparent)',
                      fontFamily: 'var(--pc-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--pc-warning)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Pending
                  </span>
                </div>

                {/* Details Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <p style={monoLabel}>Society</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: 0 }}>
                      {approval.societyName}
                    </p>
                  </div>
                  <div>
                    <p style={monoLabel}>Tower</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: 0 }}>
                      {approval.tower}
                    </p>
                  </div>
                  <div>
                    <p style={monoLabel}>Car Plate</p>
                    <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg)', margin: 0 }}>
                      {approval.carPlate}
                    </p>
                  </div>
                  <div>
                    <p style={monoLabel}>Car Model</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: 0 }}>
                      {approval.carMake} {approval.carModel}
                    </p>
                  </div>
                  <div>
                    <p style={monoLabel}>Preferred Time</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: 0 }}>
                      {String(approval.preferredCleaningTime).padStart(2, '0')}:00 AM
                    </p>
                  </div>
                  <div>
                    <p style={monoLabel}>Submitted</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: 0 }}>
                      {new Date(approval.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => openApprovalForm(approval)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 8,
                      background: 'var(--pc-sage)',
                      border: 'none',
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--pc-sage-ink)',
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(approval.id, 'Not qualified')}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 8,
                      background: 'transparent',
                      border: '1px solid var(--pc-danger)',
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 13,
                      color: 'var(--pc-danger)',
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Approval Modal */}
      {approvingId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={closeApprovalForm}
        >
          <div
            style={{
              background: 'var(--pc-card)',
              borderRadius: 16,
              border: '1px solid var(--pc-line)',
              padding: 'clamp(16px,5vw,28px)',
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: 'var(--pc-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--pc-fg)',
                margin: '0 0 20px',
              }}
            >
              Approve Signup
            </h2>

            <div style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: 0 }}>
                <strong style={{ color: 'var(--pc-fg)' }}>Before approving, verify:</strong>
                <br />
                ☐ Called customer to confirm details<br />
                ☐ Verified car registration & address<br />
                ☐ Discussed monthly fee & payment method<br />
                ☐ Recorded payment details below
              </p>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={monoLabel}>Payment Method</p>
                <select
                  value={form.paymentMethod}
                  onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                  } as React.CSSProperties}
                >
                  <option value="phone">Phone Payment</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <p style={monoLabel}>Payment Notes</p>
                <textarea
                  value={form.paymentNotes}
                  onChange={e => setForm({ ...form, paymentNotes: e.target.value })}
                  placeholder="e.g., Will pay via WhatsApp Pay, call on Sundays"
                  style={{
                    ...inputStyle,
                    minHeight: 80,
                    fontFamily: 'var(--pc-sans)',
                    resize: 'vertical',
                  } as React.CSSProperties}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={async () => {
                    const approval = approvals.find(a => a.id === approvingId);
                    if (approval) {
                      await handleApprove(approval);
                    }
                  }}
                  disabled={saving || !form.paymentMethod}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 999,
                    background: 'var(--pc-sage)',
                    border: 'none',
                    fontFamily: 'var(--pc-sans)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--pc-sage-ink)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Approving…' : 'Approve & Add'}
                </button>
                <button
                  type="button"
                  onClick={closeApprovalForm}
                  style={{
                    padding: '11px 20px',
                    borderRadius: 999,
                    background: 'transparent',
                    border: '1px solid currentColor',
                    fontFamily: 'var(--pc-sans)',
                    fontSize: 13,
                    color: 'var(--pc-fg-3)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
