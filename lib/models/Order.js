import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  size: { type: String },
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String },
    orderId: { type: String },
    razorpayPaymentId: { type: String },
    items: [OrderItemSchema],
    address: {
      name: String, phone: String, address1: String, address2: String,
      city: String, state: String, zip: String, country: String,
    },
    total: { type: Number, required: true },
    status: { type: String, default: 'Confirmed', enum: ['Confirmed', 'Shipped', 'Delivered', 'Cancelled'] },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
