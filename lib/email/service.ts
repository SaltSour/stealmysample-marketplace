"use client"

import nodemailer from 'nodemailer';

// Email service configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  from: process.env.EMAIL_FROM || 'noreply@stealmysample.com',
};

// Create a transporter instance
const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.host,
  port: EMAIL_CONFIG.port,
  secure: EMAIL_CONFIG.secure,
  auth: EMAIL_CONFIG.auth,
});

// Interface for email options
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: any;
    contentType?: string;
  }>;
}

/**
 * Send an email using the configured transporter
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: EMAIL_CONFIG.from,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send a congratulatory email with download links
 */
export async function sendPurchaseConfirmationEmail({
  to,
  userName,
  orderId,
  items,
  totalAmount,
  downloadUrl,
}: {
  to: string;
  userName: string;
  orderId: string;
  items: Array<{
    title: string;
    price: number;
    type: 'sample' | 'pack';
  }>;
  totalAmount: number;
  downloadUrl: string;
}): Promise<boolean> {
  // Format price to USD
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Create items list HTML
  const itemsList = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.type === 'pack' ? 'Sample Pack' : 'Sample'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
      </tr>
    `
    )
    .join('');

  // Create email HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Purchase Confirmation - StealMySample</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { max-width: 200px; }
        .section { margin-bottom: 30px; }
        .button { display: inline-block; background-color: #D12F25; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #D12F25;">StealMySample</h1>
        </div>
        
        <div class="section">
          <h2>Thank You for Your Purchase, ${userName}!</h2>
          <p>We're excited to confirm that your order has been successfully processed. Your purchased items are now available in your library.</p>
        </div>
        
        <div class="section">
          <h3>Order Summary</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                <td style="padding: 10px; text-align: right;"><strong>${formatPrice(totalAmount)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="section" style="text-align: center;">
          <p><strong>Your samples are ready to download!</strong></p>
          <a href="${downloadUrl}" class="button">Access Your Library</a>
        </div>
        
        <div class="section" style="background-color: #f8f8f8; padding: 15px; border-radius: 4px;">
          <h3>How to Access Your Purchase</h3>
          <ol>
            <li>Click the button above to go to your library</li>
            <li>Browse your purchased items</li>
            <li>Stream or download your content</li>
            <li>For sample packs, you can access all included samples</li>
          </ol>
        </div>
        
        <div class="footer">
          <p>If you have any questions or need support, please contact us at support@stealmysample.com</p>
          <p>&copy; ${new Date().getFullYear()} StealMySample. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain text version
  const text = `
    Thank You for Your Purchase, ${userName}!
    
    We're excited to confirm that your order has been successfully processed.
    
    Order ID: ${orderId}
    Date: ${new Date().toLocaleDateString()}
    Total: ${formatPrice(totalAmount)}
    
    Your samples are ready to download: ${downloadUrl}
    
    If you have any questions, please contact us at support@stealmysample.com
    
    © ${new Date().getFullYear()} StealMySample
  `;

  return sendEmail({
    to,
    subject: 'Thank You for Your Purchase! Your Samples Are Ready',
    html,
    text,
  });
} 