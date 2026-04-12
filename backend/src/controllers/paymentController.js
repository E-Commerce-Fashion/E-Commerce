import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, createdResponse, errorResponse } from '../utils/apiResponse.js';
import { sendOrderConfirmationEmail } from '../utils/sendEmail.js';
import logger from '../utils/logger.js';

// ── CREATE RAZORPAY ORDER ─────────────────────────────────────────
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, couponCode } = req.body;

    if (!items?.length) return errorResponse(res, 'Cart is empty', 400);
    if (!shippingAddress) return errorResponse(res, 'Shipping address required', 400);

    // Validate products & calculate amount server-side (never trust client-side amounts)
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('id, name, price, discount_price, sizes, images')
        .eq('id', item.product_id)
        .single();

      if (error || !product) {
        return errorResponse(res, `Product ${item.product_id} not found`, 404);
      }

      // Check stock
      const sizeEntry = product.sizes?.find((s) => {
        if (s.size !== item.size) return false;
        if (!item.color) return true;
        if (!s.color) return true;
        return s.color === item.color;
      });
      if (!sizeEntry || sizeEntry.stock < item.qty) {
        return errorResponse(res, `Insufficient stock for ${product.name} (${item.size})`, 400);
      }

      const itemPrice = product.discount_price || product.price;
      totalAmount += itemPrice * item.qty;

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        size: item.size,
        color: item.color || null,
        qty: item.qty,
        price: itemPrice,
        image: product.images?.[0]?.url,
      });
    }

    // Calculate Discount
    let discount = 0;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (coupon) {
        discount = coupon.discount_type === 'percentage'
          ? Math.round(totalAmount * (Number(coupon.discount_value) / 100))
          : Number(coupon.discount_value);
      } else if (couponCode.toUpperCase() === 'FIRST10') {
         // Fallback for demo
         discount = Math.round(totalAmount * 0.10);
      }
    }

    const finalAmount = Math.max(0, totalAmount - discount);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: { userId: req.user.id, couponCode: couponCode || '' },
    });

    // Create pending order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: req.user.id,
        items: validatedItems,
        shipping_address: shippingAddress,
        total_amount: finalAmount,
        razorpay_order_id: razorpayOrder.id,
        payment_status: 'pending',
        order_status: 'placed',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    logger.info('Order created', { orderId: order.id, razorpayOrderId: razorpayOrder.id });

    return createdResponse(res, {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    logger.error('createOrder error', { error: err.message });
    return errorResponse(res, 'Failed to create order', 500);
  }
};

// ── VERIFY & CONFIRM PAYMENT ──────────────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // HMAC-SHA256 signature verification
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      logger.warn('Payment signature mismatch', { orderId, razorpayPaymentId });
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId);
      return errorResponse(res, 'Payment verification failed. Signature mismatch.', 400);
    }

    // Update order with payment details
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        payment_status: 'paid',
        order_status: 'processing',
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Deduct stock
    for (const item of order.items) {
      await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_size: item.size,
        p_qty: item.qty,
      });
    }

    // Send confirmation email (non-blocking)
    const { data: userEmail } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
    sendOrderConfirmationEmail(userEmail?.user?.email, order).catch((err) =>
      logger.warn('Order email failed', { error: err.message })
    );

    logger.info('Payment verified', { orderId, razorpayPaymentId });
    return successResponse(res, { orderId: order.id }, 'Payment successful! Order confirmed.');
  } catch (err) {
    logger.error('verifyPayment error', { error: err.message });
    return errorResponse(res, 'Payment verification failed', 500);
  }
};

// ── RAZORPAY WEBHOOK ──────────────────────────────────────────────
export const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSig) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ received: false });
    }

    const event = req.body.event;

    if (event === 'payment.failed') {
      const razorpayOrderId = req.body.payload.payment.entity.order_id;
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('razorpay_order_id', razorpayOrderId);
      logger.info('Payment failed webhook processed', { razorpayOrderId });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Webhook error', { error: err.message });
    return res.status(500).json({ received: false });
  }
};

// ── GET USER ORDERS ───────────────────────────────────────────────
export const getUserOrders = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch orders', 500);
  }
};

// ── GET SINGLE ORDER ──────────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) return errorResponse(res, 'Order not found', 404);

    // Ensure user can only see their own orders
    if (order.user_id !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, order);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch order', 500);
  }
};
