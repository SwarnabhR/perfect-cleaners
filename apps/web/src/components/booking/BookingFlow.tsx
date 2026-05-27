'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Image from 'next/image';
import { submitBooking } from '@/lib/firebase/booking';

const SERVICES = [
  { id: 's1', name: 'Exterior Wash', price: 800 },
  { id: 's2', name: 'Premium Wash', price: 1200 },
  { id: 's3', name: 'Interior Detail', price: 2500 },
  { id: 's4', name: 'Ceramic Coating', price: 15000 },
];

const DATES = [
  { id: 'd1', label: 'Mon 28' },
  { id: 'd2', label: 'Tue 29' },
  { id: 'd3', label: 'Wed 30' },
  { id: 'd4', label: 'Thu 31' },
];

const TIMES = ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];

const CITIES = ['Delhi', 'Noida', 'Gurgaon', 'Ghaziabad'];
const BRANDS = ['Audi', 'BMW', 'Kia', 'Mercedes', 'Tata', 'Toyota', 'Hyundai', 'Honda', 'Maruti Suzuki', 'Mahindra'];

export default function BookingFlow() {
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedDate, setSelectedDate] = useState(DATES[0].label);
  const [selectedTime, setSelectedTime] = useState(TIMES[0]);
  
  const [city, setCity] = useState(CITIES[0]);
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [brand, setBrand] = useState(BRANDS[0]);
  const [model, setModel] = useState('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const platformFee = 50;
  const total = selectedService.price + platformFee;

  const handleBooking = async () => {
    if (!address || !pincode || !model || !name || !phone) {
      setError('Please fill in all details.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      // Create a dummy Date for scheduledAt (in a real app, parse selectedDate + selectedTime)
      const scheduledAt = new Date(); 
      
      await submitBooking({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        scheduledAt,
        city,
        pincode,
        addressLine1: address,
        vehicleMake: brand,
        vehicleModel: model,
        customerName: name,
        customerPhone: phone,
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to book service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '120px 24px' }}>
        <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 36, color: 'var(--pc-fg)', marginBottom: 24 }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--pc-fg-2)', marginBottom: 32 }}>We have received your booking and will contact you shortly.</p>
        <button onClick={() => window.location.reload()} style={{
          padding: '16px 32px', borderRadius: 999, background: 'var(--pc-warm)', color: 'var(--pc-ink)',
          fontFamily: 'var(--pc-sans)', fontWeight: 600, border: 'none', cursor: 'pointer'
        }}>Book Another</button>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: 16, borderRadius: 8, border: '1px solid var(--pc-line)',
    background: 'var(--pc-card)', color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 64, flexWrap: 'wrap' }}>
      {/* Left: Form */}
      <div style={{ flex: '1 1 500px' }}>
        <Eyebrow>[BOOK A SERVICE]</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 48, color: 'var(--pc-fg)', margin: '8px 0 32px' }}>
          Schedule Your Detail.
        </h1>
        
        <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 40, border: '1px solid var(--pc-line)' }}>
          <Image src="/booking-preview.png" alt="Booking app preview" fill style={{ objectFit: 'cover' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {/* Step 1 */}
          <section>
            <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg)', marginBottom: 16 }}>1. Select Service</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {SERVICES.map((s) => {
                const isActive = selectedService.id === s.id;
                return (
                  <button key={s.id} onClick={() => setSelectedService(s)} style={{
                    padding: 16, borderRadius: 12, border: `1px solid ${isActive ? 'var(--pc-sage)' : 'var(--pc-line)'}`,
                    background: isActive ? 'var(--pc-sage-lo)' : 'var(--pc-card)',
                    color: isActive ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                    fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left'
                  }}>
                    {s.name} <span style={{ float: 'right' }}>₹{s.price}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2 */}
          <section>
            <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg)', marginBottom: 16 }}>2. Select Date & Time</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              {DATES.map((d) => {
                const isActive = selectedDate === d.label;
                return (
                  <button key={d.id} onClick={() => setSelectedDate(d.label)} style={{
                    flex: '1 1 80px', padding: '12px 0', borderRadius: 8, border: `1px solid ${isActive ? 'var(--pc-sage)' : 'var(--pc-line)'}`,
                    background: isActive ? 'var(--pc-sage-lo)' : 'var(--pc-card)',
                    color: isActive ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                    fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer'
                  }}>{d.label}</button>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
              {TIMES.map((t) => {
                const isActive = selectedTime === t;
                return (
                  <button key={t} onClick={() => setSelectedTime(t)} style={{
                    padding: '10px 0', borderRadius: 8, border: `1px solid ${isActive ? 'var(--pc-sage)' : 'var(--pc-line)'}`,
                    background: isActive ? 'var(--pc-sage-lo)' : 'var(--pc-card)',
                    color: isActive ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                    fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer'
                  }}>{t}</button>
                );
              })}
            </div>
          </section>

          {/* Step 3 */}
          <section>
            <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg)', marginBottom: 16 }}>3. Location & Vehicle</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <select value={city} onChange={(e) => setCity(e.target.value)} style={{ ...inputStyle, flex: 1, appearance: 'none' }}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              </div>
              <input placeholder="Full Address (House No, Street, etc.)" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
              
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} style={{ ...inputStyle, flex: 1, appearance: 'none' }}>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <input placeholder="Model (e.g. Nexon)" value={model} onChange={e => setModel(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section>
            <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg)', marginBottom: 16 }}>4. Contact Details</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <input placeholder="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            </div>
            {error && <p style={{ color: 'var(--pc-sage)', marginTop: 12, fontSize: 14 }}>{error}</p>}
          </section>
        </div>
      </div>

      {/* Right: Summary */}
      <div style={{ flex: '1 1 300px', maxWidth: 400 }}>
        <div style={{ position: 'sticky', top: 120 }}>
          <Card style={{ padding: 24 }}>
            <Eyebrow style={{ marginBottom: 16, display: 'block' }}>BOOKING SUMMARY</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{selectedService.name}</span>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 14, color: 'var(--pc-fg)' }}>₹{selectedService.price}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>Platform Fee</span>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 14, color: 'var(--pc-fg)' }}>₹{platformFee}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--pc-line)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)' }}>Total</span>
              <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 24, color: 'var(--pc-fg)' }}>₹{total}</span>
            </div>
            
            <button disabled={isSubmitting} onClick={handleBooking} style={{
              width: '100%', padding: '16px 0', borderRadius: 999,
              background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
              border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}>
              {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
