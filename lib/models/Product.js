import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    images: [{ type: String }], // Array of image URLs (Cloudinary)
    stock: { type: Number, default: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
