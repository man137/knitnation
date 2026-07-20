"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearCart } from '../../../redux/slices';
import hoc from '../../hoc';
import { ShoppingBag, MapPin, Tag, ChevronRight, CheckCircle, Truck, Package } from 'lucide-react';

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh'];

function Component() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session, status } = useSession();
  const cartItems = useSelector((state) => state.cart.items);
  const [discount, setDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const finalTotal = cartTotal - discount;

  const [address, setAddress] = useState({
    name: '', phone: '', address1: '', address2: '', city: '', state: '', zip: '', country: 'India',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    // Pre-fill name from session
    if (session?.user?.name) {
      setAddress(prev => ({ ...prev, name: session.user.name }));
    }
  }, [session]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => window.Razorpay && setIsRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.id]: e.target.value });
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'DISCOUNT10') {
      const discountAmount = cartTotal * 0.1;
      setDiscount(discountAmount);
      setPromoApplied(true);
    } else {
      alert('Invalid promo code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!session) { router.push('/login'); return; }
    if (!isRazorpayLoaded) { alert('Payment gateway loading, please wait...'); return; }

    const requiredFields = ['name', 'phone', 'address1', 'city', 'state', 'zip'];
    const missing = requiredFields.find(f => !address[f]);
    if (missing) { alert(`Please fill in ${missing}`); return; }

    setIsPlacingOrder(true);
    try {
      const response = await fetch('/api/startpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderDetails: { amount: finalTotal },
          userDetails: { userId: session.user.id, email: session.user.email, fullName: session.user.name, phoneNumber: address.phone },
        }),
      });

      if (!response.ok) throw new Error('Failed to create payment order');
      const data = await response.json();

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'KnitNation',
        description: 'Order Payment',
        order_id: data.orderId,
        prefill: { name: session.user.name, email: session.user.email, contact: address.phone },
        theme: { color: '#059669' },
        handler: async function (razorpayResponse) {
          // Save order to MongoDB
          await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpayPaymentId: razorpayResponse.razorpay_payment_id,
              total: finalTotal,
              items: cartItems,
              address,
              status: 'Confirmed',
            }),
          });
          dispatch(clearCart());
          router.push(`/order-success?orderId=${data.orderId}&amount=${data.amount}&currency=${data.currency}`);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTop: '3px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10,
    fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#111', transition: 'border-color 0.2s',
  };

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111' }}>Checkout</h1>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 900, margin: '24px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
          {[{ n: 1, label: 'Address' }, { n: 2, label: 'Payment' }].map(({ n, label }, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => activeStep > n && setActiveStep(n)}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: activeStep >= n ? '#059669' : '#e5e7eb', color: activeStep >= n ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {activeStep > n ? <CheckCircle size={18} /> : n}
                </div>
                <span style={{ fontSize: 14, fontWeight: activeStep === n ? 700 : 500, color: activeStep >= n ? '#111' : '#9ca3af' }}>{label}</span>
              </div>
              {i < 1 && <div style={{ flex: 1, height: 2, background: activeStep > 1 ? '#059669' : '#e5e7eb', margin: '0 16px' }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 24 }}>

          {/* Left: Address Form */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <MapPin size={20} color="#059669" />
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111' }}>Delivery Address</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label htmlFor="name" style={labelStyle}>Full Name *</label>
                  <input id="name" value={address.name} onChange={handleInputChange} placeholder="John Doe" style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div>
                  <label htmlFor="phone" style={labelStyle}>Phone *</label>
                  <input id="phone" value={address.phone} onChange={handleInputChange} placeholder="+91 98765 43210" style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
              </div>

              <div>
                <label htmlFor="address1" style={labelStyle}>Address Line 1 *</label>
                <input id="address1" value={address.address1} onChange={handleInputChange} placeholder="House No, Street Name" style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>

              <div>
                <label htmlFor="address2" style={labelStyle}>Address Line 2</label>
                <input id="address2" value={address.address2} onChange={handleInputChange} placeholder="Landmark, Area (optional)" style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label htmlFor="city" style={labelStyle}>City *</label>
                  <input id="city" value={address.city} onChange={handleInputChange} placeholder="Mumbai" style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div>
                  <label style={labelStyle}>State *</label>
                  <select value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="zip" style={labelStyle}>PIN Code *</label>
                  <input id="zip" value={address.zip} onChange={handleInputChange} placeholder="400001" maxLength={6} style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Cart Items */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ShoppingBag size={18} color="#059669" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111' }}>Order Items ({cartItems.length})</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 240, overflowY: 'auto' }}>
                {cartItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <img src={item.imageUrl || '/placeholder.svg'} alt={item.name} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', background: '#f3f4f6', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>Qty: {item.quantity}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111', flexShrink: 0 }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Tag size={16} color="#059669" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Promo Code</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="DISCOUNT10"
                  style={{ ...inputStyle, flex: 1 }} disabled={promoApplied} />
                <button onClick={applyPromoCode} disabled={promoApplied}
                  style={{ padding: '12px 16px', background: promoApplied ? '#d1fae5' : '#111', color: promoApplied ? '#059669' : '#fff', border: 'none', borderRadius: 10, cursor: promoApplied ? 'default' : 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                  {promoApplied ? 'Applied ✓' : 'Apply'}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#111' }}>Price Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#374151' }}>
                  <span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#374151' }}>
                  <span>Shipping</span><span style={{ color: '#059669', fontWeight: 600 }}>FREE</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#059669' }}>
                    <span>Discount</span><span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#111' }}>
                  <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <motion.button onClick={handlePlaceOrder} disabled={!isRazorpayLoaded || isPlacingOrder || cartItems.length === 0}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  marginTop: 20, width: '100%', padding: '16px', background: (!isRazorpayLoaded || isPlacingOrder) ? '#d1fae5' : 'linear-gradient(135deg, #059669, #047857)',
                  color: (!isRazorpayLoaded || isPlacingOrder) ? '#059669' : '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800,
                  cursor: (!isRazorpayLoaded || isPlacingOrder) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(5,150,105,0.35)',
                }}>
                {isPlacingOrder ? 'Processing...' : !isRazorpayLoaded ? 'Loading...' : `Pay ₹${finalTotal.toFixed(2)}`}
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                <img src="https://razorpay.com/favicon.ico" alt="Razorpay" style={{ height: 16, opacity: 0.6 }} />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Secured by Razorpay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default hoc(Component);