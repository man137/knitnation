import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { file, name } = await request.json();
    
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // If Cloudinary isn't configured, just return the base64 data URL so it gets saved to MongoDB and displays properly.
      console.warn("Cloudinary not configured! Using base64 data URL directly.");
      return NextResponse.json({ success: true, url: file }, { status: 200 });
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // You may need an unsigned upload preset in Cloudinary
    formData.append('public_id', name);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    
    if (data.secure_url) {
      return NextResponse.json({ success: true, url: data.secure_url }, { status: 200 });
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
