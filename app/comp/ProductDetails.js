"use client"
import { useState, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import withReduxProvider from "../hoc"
import { Menu, X, Search, ShoppingBag, Minus, Plus, Trash2, ChevronRight, Star, Truck, Shield, RefreshCw } from "lucide-react"
import SizeSelection from "../comp/size"
import SizeChartModal from "../comp/chart"
import {
  setSelectedImage,
  toggleSizeChartModal,
  setPincode,
  setCity,
  setEstimatedDeliveryDate,
  addToCart,
  clearSelectedImage,
  updateQuantity,
  removeFromCart,
} from "../../redux/slices"

const ProductDetails = ({ id }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { data: session, status } = useSession()
  const user = session?.user || null

  const [productData, setProductData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pincode, setPincodeLocal] = useState("")
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false)
  const [city, setCityLocal] = useState("")
  const [estimatedDeliveryDate, setEstimatedDeliveryDateLocal] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })

  const selectedImage = useSelector((state) => state.products.selectedImage)
  const isSizeChartModalOpen = useSelector((state) => state.products.isSizeChartModalOpen)
  const cartItems = useSelector((state) => state.cart.items)
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Load cart from DB on login
  useEffect(() => {
    if (user) {
      fetch('/api/cart')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data.length > 0) {
            const items = data.data.map(item => ({
              id: item.productId,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl,
              quantity: item.quantity,
              size: item.size,
            }))
            dispatch(addToCart(items))
          }
        })
        .catch(console.error)
    } else if (status === 'unauthenticated') {
      const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]")
      if (guestCart.length > 0) dispatch(addToCart(guestCart))
    }
  }, [user, status, dispatch])

  // Fetch product from MongoDB
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      try {
        setLoading(true)
        const res = await fetch(`/api/products/${id}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        const p = data.data
        setProductData({ ...p, id: p._id, imageUrls: p.images || [] })
        if (p.images && p.images[0]) dispatch(setSelectedImage(p.images[0]))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
    return () => { dispatch(clearSelectedImage()) }
  }, [id, dispatch])

  const handleImageClick = (imageUrl, index) => {
    setActiveImageIndex(index)
    dispatch(setSelectedImage(imageUrl))
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const handleAccClick = () => {
    if (user) setIsAccDropdownOpen(!isAccDropdownOpen)
    else router.push("/login")
  }

  const handleCartClick = () => {
    if (!isCartOpen) {
      setScrollPosition(window.scrollY)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
      window.scrollTo(0, scrollPosition)
    }
    setIsCartOpen(!isCartOpen)
  }

  const checkAvailability = async () => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      const data = await response.json()
      if (data && data[0].Status === "Success" && data[0].PostOffice.length > 0) {
        const estimatedDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString()
        setCityLocal(data[0].PostOffice[0].District)
        setEstimatedDeliveryDateLocal(estimatedDate)
        dispatch(setCity(data[0].PostOffice[0].District))
        dispatch(setEstimatedDeliveryDate(estimatedDate))
        dispatch(setPincode(pincode))
      } else {
        setCityLocal("")
        setEstimatedDeliveryDateLocal("")
        toast.error("Pincode not found")
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
    }
  }

  const handleAddToCart = async () => {
    if (!productData || !productData.price) {
      toast.error("Error adding to cart. Please try again.")
      return
    }
    setIsAddingToCart(true)
    const { id, price, name, imageUrls } = productData
    const imageUrl = selectedImage || (imageUrls && imageUrls[0]) || ""

    try {
      if (user) {
        // Save to MongoDB cart
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id, name, price: Number(price), imageUrl, quantity: 1 }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        // Sync Redux with DB response
        const items = data.data.map(item => ({
          id: item.productId, name: item.name, price: item.price,
          imageUrl: item.imageUrl, quantity: item.quantity,
        }))
        dispatch(addToCart(items))
      } else {
        // Guest cart in localStorage
        let guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]")
        const existing = guestCart.find(item => item.id === id)
        if (existing) {
          guestCart = guestCart.map(item => item.id === id ? { ...item, quantity: Math.min(item.quantity + 1, 10) } : item)
          dispatch(updateQuantity({ id, quantity: Math.min(existing.quantity + 1, 10) }))
        } else {
          const newItem = { id, name, price: Number(price), imageUrl, quantity: 1 }
          guestCart.push(newItem)
          dispatch(addToCart([...cartItems, newItem]))
        }
        localStorage.setItem("guestCart", JSON.stringify(guestCart))
      }
      toast.success("Added to cart! 🛍️")
      setIsCartOpen(true)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Error adding to cart. Please try again.")
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    dispatch(updateQuantity({ id: itemId, quantity: newQuantity }))
    if (user) {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: itemId, quantity: newQuantity }),
      }).catch(console.error)
    } else {
      const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]")
      const updated = guestCart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
      localStorage.setItem("guestCart", JSON.stringify(updated))
    }
  }

  const handleRemoveFromCart = async (itemId) => {
    dispatch(removeFromCart(itemId))
    if (user) {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: itemId }),
      }).catch(console.error)
    } else {
      const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]").filter(item => item.id !== itemId)
      localStorage.setItem("guestCart", JSON.stringify(guestCart))
    }
  }

  const handleProceedToPay = () => {
    if (!user) {
      toast.info("Please log in to proceed to checkout.")
      localStorage.setItem("guestCart", JSON.stringify(cartItems))
      router.push("/login")
      return
    }
    localStorage.setItem("cartItems", JSON.stringify(cartItems))
    localStorage.setItem("cartTotal", cartTotal.toFixed(2))
    router.push("/comp/address")
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTop: '3px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280', fontFamily: 'inherit' }}>Loading product...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#dc2626', fontSize: 18, marginBottom: 16 }}>{error}</p>
        <button onClick={() => router.push('/home')} style={{ padding: '12px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Go Back Home</button>
      </div>
    </div>
  )

  if (!productData) return null

  const { name, price, description, imageUrls } = productData
  const currentImage = selectedImage || (imageUrls && imageUrls[0])

  return (
    <>
      {/* ── NAV ── */}
      <motion.nav
        style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 12px rgba(0,0,0,0.07)' }}
        initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo.png" alt="KnitNation" style={{ height: 36, width: 'auto' }} />
          </Link>

          <div style={{ display: isMobile ? 'none' : 'flex', gap: 32, alignItems: 'center' }}>
            {['Womens', 'Mens'].map((label, i) => (
              <Link key={label} href={i === 0 ? '/home' : '/men'} style={{ textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#111', position: 'relative' }}>
                {label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.button onClick={handleAccClick} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative' }}>
              <img src="/acc.png" alt="Account" style={{ width: 22, height: 22 }} />
            </motion.button>

            <AnimatePresence>
              {isAccDropdownOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  style={{ position: 'absolute', top: 70, right: 80, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 180, zIndex: 100 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Signed in as</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                  <Link href="/order-history" onClick={() => setIsAccDropdownOpen(false)}
                    style={{ display: 'block', padding: '12px 16px', fontSize: 14, color: '#111', textDecoration: 'none', fontWeight: 500 }}>Order History</Link>
                  <button onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: 14, color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500, borderTop: '1px solid #f3f4f6' }}>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button onClick={handleCartClick} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative' }}>
              <ShoppingBag size={22} color="#111" />
              <AnimatePresence>
                {cartItems.length > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ position: 'absolute', top: 0, right: 0, background: '#059669', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cartItems.length > 9 ? '9+' : cartItems.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {isMobile && (
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ borderTop: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff' }}>
              {['Womens:/home', 'Mens:/men'].map(item => {
                const [label, href] = item.split(':')
                return <Link key={label} href={href} onClick={() => setIsMobileMenuOpen(false)}
                  style={{ display: 'block', padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#111', textDecoration: 'none', borderBottom: '1px solid #f3f4f6' }}>{label}</Link>
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── BREADCRUMB ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
        <Link href="/home" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#111', fontWeight: 500 }}>{name}</span>
      </div>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 16px 40px' : '0 40px 60px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 60 }}>

        {/* ── IMAGE GALLERY ── */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
          {/* Thumbnails */}
          {!isMobile && imageUrls && imageUrls.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 72 }}>
              {imageUrls.map((url, i) => (
                <motion.button key={i} onClick={() => handleImageClick(url, i)} whileHover={{ scale: 1.05 }}
                  style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: activeImageIndex === i ? '2px solid #059669' : '2px solid #e5e7eb', cursor: 'pointer', background: 'none', padding: 0 }}>
                  <img src={url} alt={`${name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </motion.button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div style={{ flex: 1, position: 'relative' }}>
            <motion.div
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              style={{
                width: '100%', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden',
                background: '#f3f4f6', cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              }}>
              <img
                src={currentImage || '/placeholder.svg'}
                alt={name}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.2s ease',
                  transform: isZoomed ? 'scale(1.8)' : 'scale(1)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              />
            </motion.div>

            {/* Mobile thumbnails */}
            {isMobile && imageUrls && imageUrls.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {imageUrls.map((url, i) => (
                  <button key={i} onClick={() => handleImageClick(url, i)}
                    style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: activeImageIndex === i ? '2px solid #059669' : '2px solid #e5e7eb', cursor: 'pointer', padding: 0, background: 'none' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── PRODUCT INFO ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Name + Rating */}
          <div>
            <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: '0 0 8px', color: '#111', lineHeight: 1.2, letterSpacing: '-0.5px' }}>{name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>4.8 (128 reviews)</span>
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: isMobile ? 32 : 40, fontWeight: 800, color: '#111' }}>₹{price}</span>
            <span style={{ fontSize: 14, color: '#059669', fontWeight: 600, background: '#d1fae5', padding: '2px 10px', borderRadius: 20 }}>In Stock</span>
          </div>

          <div style={{ height: 1, background: '#e5e7eb' }} />

          {/* Size */}
          <div>
            <SizeSelection />
          </div>

          {/* Size chart */}
          <button onClick={() => dispatch(toggleSizeChartModal())}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', width: 'fit-content' }}>
            <img src="/download.png" alt="size chart" style={{ height: 18 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>View Size Chart</span>
          </button>

          {/* Delivery check */}
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#111', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check Delivery</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Enter 6-digit PIN code" value={pincode} onChange={(e) => setPincodeLocal(e.target.value)} maxLength={6}
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }} />
              <button onClick={checkAvailability}
                style={{ padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Check</button>
            </div>
            {city && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#059669' }}>
                <Truck size={15} />
                <span>Delivers to <strong>{city}</strong> by <strong>{estimatedDeliveryDate}</strong></span>
              </motion.div>
            )}
          </div>

          {/* Add to Cart */}
          <motion.button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            whileHover={{ scale: isAddingToCart ? 1 : 1.02 }}
            whileTap={{ scale: isAddingToCart ? 1 : 0.98 }}
            style={{
              padding: '18px 32px', background: isAddingToCart ? '#d1fae5' : 'linear-gradient(135deg, #059669, #047857)',
              color: isAddingToCart ? '#059669' : '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
              cursor: isAddingToCart ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 4px 20px rgba(5, 150, 105, 0.35)', transition: 'all 0.2s',
            }}>
            <ShoppingBag size={20} />
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </motion.button>

          {/* Trust badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { icon: <Truck size={18} />, label: 'Free Shipping', sub: 'On orders ₹999+' },
              { icon: <RefreshCw size={18} />, label: 'Easy Returns', sub: '7-day returns' },
              { icon: <Shield size={18} />, label: 'Secure Pay', sub: '100% safe' },
            ].map(({ icon, label, sub }) => (
              <div key={label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ color: '#059669', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#111' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {description && (
            <div style={{ paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#111' }}>Product Description</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#4b5563', margin: 0 }}>{description}</p>
            </div>
          )}
        </div>
      </main>

      {/* ── CART SIDEBAR ── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCartClick}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998, backdropFilter: 'blur(2px)' }} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              style={{
                position: 'fixed', right: 0, top: 0, width: isMobile ? '100%' : 420, height: '100vh',
                background: '#fff', zIndex: 999, display: 'flex', flexDirection: 'column',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
              }}>

              {/* Cart Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShoppingBag size={22} color="#059669" />
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111' }}>Your Cart</h2>
                  {cartItems.length > 0 && (
                    <span style={{ background: '#d1fae5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{cartItems.length}</span>
                  )}
                </div>
                <button onClick={handleCartClick} style={{ padding: 8, border: 'none', background: '#f3f4f6', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} color="#6b7280" />
                </button>
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {cartItems.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#9ca3af' }}>
                    <ShoppingBag size={60} strokeWidth={1} />
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#374151', margin: 0 }}>Your cart is empty</p>
                    <p style={{ fontSize: 14, margin: 0 }}>Add something you love!</p>
                    <button onClick={handleCartClick} style={{ padding: '10px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cartItems.map((item) => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', gap: 14, padding: 14, background: '#f9fafb', borderRadius: 14, border: '1px solid #e5e7eb' }}>
                        <img src={item.imageUrl || '/placeholder.svg'} alt={item.name}
                          style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', background: '#e5e7eb', flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>{item.name}</p>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#059669' }}>₹{item.price}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                              <button onClick={() => item.quantity > 1 ? handleUpdateQuantity(item.id, item.quantity - 1) : handleRemoveFromCart(item.id)}
                                style={{ width: 32, height: 32, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Minus size={14} color="#6b7280" />
                              </button>
                              <span style={{ padding: '0 10px', fontSize: 14, fontWeight: 700, color: '#111', minWidth: 32, textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => handleUpdateQuantity(item.id, Math.min(item.quantity + 1, 10))}
                                style={{ width: 32, height: 32, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Plus size={14} color="#6b7280" />
                              </button>
                            </div>
                            <button onClick={() => handleRemoveFromCart(item.id)}
                              style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, borderRadius: 6, display: 'flex' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cartItems.length > 0 && (
                <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Subtotal</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <motion.button onClick={handleProceedToPay} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ padding: '16px', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(5,150,105,0.35)' }}>
                    Proceed to Checkout →
                  </motion.button>
                  <button onClick={handleCartClick}
                    style={{ padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Continue Shopping
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isSizeChartModalOpen && <SizeChartModal onClose={() => dispatch(toggleSizeChartModal())} />}
    </>
  )
}

export default withReduxProvider(ProductDetails)
