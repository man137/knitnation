'use client';
import ProductDetails from '../../comp/ProductDetails';

export default function ProductPage({ params }) {
  return <ProductDetails id={params.id} />;
}