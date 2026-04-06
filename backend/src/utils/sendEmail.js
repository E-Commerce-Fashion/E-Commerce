import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
};

export const sendOrderConfirmationEmail = async (userEmail, order) => {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.size}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">₹${item.price}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0F;color:#F0F0F8;padding:40px;border-radius:12px">
      <h1 style="color:#C9A84C;margin-bottom:8px">FashionForge</h1>
      <h2 style="margin-bottom:24px">Order Confirmed! 🎉</h2>
      <p>Thank you for your order. Your order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> has been placed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <thead>
          <tr style="background:#1A1A24">
            <th style="padding:12px;text-align:left;color:#C9A84C">Item</th>
            <th style="padding:12px;text-align:left;color:#C9A84C">Size</th>
            <th style="padding:12px;text-align:left;color:#C9A84C">Qty</th>
            <th style="padding:12px;text-align:left;color:#C9A84C">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="font-size:20px;color:#C9A84C;font-weight:bold">Total: ₹${order.total_amount}</p>
      <p style="color:#A0A0B8;margin-top:24px">We'll notify you when your order ships.</p>
      <p style="color:#5A5A70;font-size:12px;margin-top:40px">© ${new Date().getFullYear()} FashionForge. All rights reserved.</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Order Confirmed — #${order.id.slice(0, 8).toUpperCase()} | FashionForge`,
    html,
  });
};

export const sendWelcomeEmail = async (userEmail, name) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0F;color:#F0F0F8;padding:40px;border-radius:12px">
      <h1 style="color:#C9A84C">FashionForge</h1>
      <h2>Welcome, ${name}! 👗</h2>
      <p>Your account has been created successfully. Start exploring our curated fashion collections.</p>
      <a href="${process.env.CLIENT_URL}/products" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#C9A84C;color:#0A0A0F;border-radius:8px;text-decoration:none;font-weight:bold">Shop Now</a>
    </div>
  `;
  return sendEmail({ to: userEmail, subject: 'Welcome to FashionForge! 👗', html });
};
