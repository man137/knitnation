import connectToDatabase from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - fetch orders for logged-in user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const orders = await Order.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - create a new order
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();
    const order = await Order.create({
      ...body,
      userId: session.user.id,
      userEmail: session.user.email,
      status: 'Confirmed',
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
