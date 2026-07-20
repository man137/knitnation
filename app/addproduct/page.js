"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, Image as ImageIcon, Plus, ArrowLeft, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';

const generateUniqueID = () => Math.random().toString(36).substr(2, 9);

const AddProductPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [session, status, router]);

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    try {
      const files = Array.from(e.target.files);
      const newImages = await Promise.all(
        files.map(async (file) => {
          const dataURL = await readFileAsDataURL(file);
          return { id: generateUniqueID(), file, dataURL };
        })
      );
      setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      toast.error('Error reading images');
    }
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSetMainImage = (index) => {
    setImages((prev) => {
      const newImages = [...prev];
      const selected = newImages.splice(index, 1)[0];
      newImages.unshift(selected); // Move to the front (main image)
      return newImages;
    });
  };

  const moveImage = (index, direction) => {
    if (
      (direction === 'left' && index === 0) || 
      (direction === 'right' && index === images.length - 1)
    ) return;

    setImages((prev) => {
      const newImages = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      return newImages;
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !price || !description || !category || !subcategory || images.length === 0) {
      toast.error('Please fill all required fields and add at least one image.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload images first
      const imageUrls = [];
      for (const img of images) {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: img.dataURL, name: img.file.name }),
        });
        const data = await response.json();
        if (data.success) {
          imageUrls.push(data.url);
        } else {
          throw new Error('Image upload failed');
        }
      }

      // Save product to MongoDB
      const productData = {
        name,
        price: Number(price),
        description,
        images: imageUrls,
        category,
        subcategory,
        ownerId: session.user.id,
      };

      const productResponse = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const productResult = await productResponse.json();

      if (productResult.success) {
        toast.success(`🎉 Product "${name}" added successfully!`);
        // Reset form
        setName(''); setPrice(''); setDescription(''); setImages([]); setCategory(''); setSubcategory('');
      } else {
        throw new Error(productResult.error || 'Failed to add product');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error adding product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTop: '3px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: 12,
    fontSize: 15, outline: 'none', background: '#fff', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#111', transition: 'all 0.2s',
  };

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      {/* Header */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111' }}>Add New Product</h1>
      </nav>

      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <form onSubmit={handleAddProduct} style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.04)', display: 'grid', gap: 32 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div>
              <label style={labelStyle}>Product Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Classic Blue Jeans" required style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>
            <div>
              <label style={labelStyle}>Price (₹) *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1599" required min="1" style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }} required style={{...inputStyle, appearance: 'none', cursor: 'pointer'}} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
                <option value="">Select Category</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subcategory *</label>
              <select value={subcategory} onChange={e => setSubcategory(e.target.value)} required disabled={!category} style={{...inputStyle, appearance: 'none', cursor: category ? 'pointer' : 'not-allowed', opacity: category ? 1 : 0.6}} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
                <option value="">Select Subcategory</option>
                {category === 'men' && ['Jeans', 'Shirts', 'T-Shirts', 'Shorts'].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                {category === 'women' && ['Curve', 'Cargo', 'Jeans', 'T-Shirts', 'Shirts', 'Skirts'].map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the product details, fabric, fit, etc." required rows={4} style={{...inputStyle, resize: 'vertical'}} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Product Images * (Slide/click to change main image)</label>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{images.length} added</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              {images.map((img, index) => (
                <motion.div key={img.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', border: index === 0 ? '3px solid #059669' : '1px solid #e5e7eb', boxShadow: index === 0 ? '0 4px 12px rgba(5,150,105,0.2)' : 'none', background: '#f9fafb' }}>
                  
                  <img src={img.dataURL} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {index === 0 && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#059669', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} fill="#fff" /> Main
                    </div>
                  )}

                  <button type="button" onClick={() => handleRemoveImage(img.id)}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                    <X size={14} />
                  </button>

                  <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                    {index > 0 ? (
                      <button type="button" onClick={() => moveImage(index, 'left')} style={{ flex: 1, padding: '4px 0', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', backdropFilter: 'blur(4px)' }} title="Move Left">
                        <ChevronLeft size={16} />
                      </button>
                    ) : <div style={{ flex: 1 }} />}
                    
                    {index !== 0 && (
                      <button type="button" onClick={() => handleSetMainImage(index)} style={{ flex: 2, padding: '4px 0', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#059669', backdropFilter: 'blur(4px)' }}>
                        Set Main
                      </button>
                    )}

                    {index < images.length - 1 ? (
                      <button type="button" onClick={() => moveImage(index, 'right')} style={{ flex: 1, padding: '4px 0', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', backdropFilter: 'blur(4px)' }} title="Move Right">
                        <ChevronRight size={16} />
                      </button>
                    ) : <div style={{ flex: 1 }} />}
                  </div>
                </motion.div>
              ))}

              <label style={{ aspectRatio: '1', borderRadius: 12, border: '2px dashed #d1d5db', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: '#6b7280', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669'; e.currentTarget.style.background = '#ecfdf5' }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = '#f9fafb' }}>
                <Plus size={24} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Add Images</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ height: 1, background: '#e5e7eb' }} />

          <button type="submit" disabled={isSubmitting} style={{ padding: '16px', background: isSubmitting ? '#a7f3d0' : 'linear-gradient(135deg, #059669, #047857)', color: isSubmitting ? '#059669' : '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>
            {isSubmitting ? (
              <><div style={{ width: 18, height: 18, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Saving Product...</>
            ) : (
              <><Check size={20} /> Publish Product</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductPage;
