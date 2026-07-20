import connectToDatabase from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
