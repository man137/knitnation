import connectToDatabase from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Optional: parse query params for filtering/pagination
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const query = category ? { category } : {};
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const product = await Product.create(body);
    
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
