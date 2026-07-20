"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import Link from "next/link"
import hoc from '../hoc'
import { Package, ChevronLeft, ShoppingBag, Clock, CheckCircle, Truck, Star } from "lucide-react"

const STATUS_CONFIG = {
  Confirmed: { color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={14} /> },
  Shipped: { color: '#2563eb', bg: '#dbeafe', icon: <Truck size={14} /> },
  Delivered: { color: '#7c3aed', bg: '#ede9fe', icon: <Star size={14} /> },
  Cancelled: { color: '#dc2626', bg: '#fee2e2', icon: null },
}

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/orders')
        .then(r => r.json())
        .then(data => {
          if (data.success) setOrders(data.data)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [status])

  if (loading || status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTop: '3px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280' }}>Loading your orders...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #f9fafb 60%, #fff 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Nav */}
      <motion.nav initial={{ y: -60 }} animate={{ y: 0 }}
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}>
            <ChevronLeft size={16} /> Back
          </button>
          <Link href="/home"><img src="/logo.png" alt="KnitNation" style={{ height: 32 }} /></Link>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/home" style={{ fontSize: 14, fontWeight: 600, color: '#111', textDecoration: 'none' }}>Womens</Link>
          <Link href="/men" style={{ fontSize: 14, fontWeight: 600, color: '#111', textDecoration: 'none' }}>Mens</Link>
        </div>
      </motion.nav>

      <div style={{ maxWidth: 860, margin: '40px auto', padding: '0 20px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Order History</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 32px' }}>All your past orders in one place.</p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: '#fff', borderRadius: 20, padding: 60, textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <div style={{ width: 80, height: 80, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShoppingBag size={36} color="#059669" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>No orders yet</h2>
            <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: 15 }}>You haven't placed any orders yet. Start shopping!</p>
            <motion.button onClick={() => router.push('/home')} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>
              Start Shopping →
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {orders.map((order, index) => {
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.Confirmed
              const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'

              return (
                <motion.div key={order._id || index}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
                  style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>

                  {/* Order header */}
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Package size={16} color="#059669" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Order #{(order.orderId || order._id || '').slice(-10).toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9ca3af' }}>
                        <Clock size={13} />
                        <span>{orderDate}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>₹{order.total?.toFixed ? order.total.toFixed(2) : order.total}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusConf.bg, color: statusConf.color }}>
                        {statusConf.icon} {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '16px 24px' }}>
                    <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {order.items?.map((item, ii) => (
                        <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                            <img src={item.imageUrl || '/placeholder.svg'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Qty: {item.quantity} × ₹{item.price}</p>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery address if available */}
                  {order.address && (
                    <div style={{ padding: '12px 24px', background: '#f9fafb', borderTop: '1px solid #f3f4f6', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={13} />
                      <span>Delivering to: <strong style={{ color: '#374151' }}>{order.address.name}, {order.address.city}, {order.address.state} - {order.address.zip}</strong></span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default hoc(OrderHistory)
