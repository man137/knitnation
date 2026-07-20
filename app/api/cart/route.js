import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cart schema (inline, simple)
const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [
    {
      productId: String,
      name: String,
      price: Number,
      imageUrl: String,
      quantity: { type: Number, default: 1 },
      size: String,
    }
  ],
  updatedAt: { type: Date, default: Date.now },
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

// GET - fetch cart for logged in user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const cart = await Cart.findOne({ userId: session.user.id });
    return NextResponse.json({ success: true, data: cart?.items || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - add or update item in cart
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { productId, name, price, imageUrl, quantity, size } = await request.json();

    let cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      cart = new Cart({ userId: session.user.id, items: [] });
    }

    const existingIndex = cart.items.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = Math.min(cart.items[existingIndex].quantity + (quantity || 1), 10);
    } else {
      cart.items.push({ productId, name, price, imageUrl, quantity: quantity || 1, size });
    }

    cart.updatedAt = new Date();
    await cart.save();

    return NextResponse.json({ success: true, data: cart.items }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - update item quantity
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { productId, quantity } = await request.json();

    const cart = await Cart.findOne({ userId: session.user.id });
    if (!cart) return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = Math.min(quantity, 10);
      }
    }

    cart.updatedAt = new Date();
    await cart.save();
    return NextResponse.json({ success: true, data: cart.items }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - remove item from cart
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { productId } = await request.json();

    const cart = await Cart.findOne({ userId: session.user.id });
    if (cart) {
      cart.items = cart.items.filter(item => item.productId !== productId);
      cart.updatedAt = new Date();
      await cart.save();
    }

    return NextResponse.json({ success: true, data: cart?.items || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
