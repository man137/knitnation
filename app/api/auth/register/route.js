import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectToDatabase();
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User already exists with this email' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
    });

    return NextResponse.json({ success: true, message: 'User registered successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
