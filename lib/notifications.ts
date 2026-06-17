import { resend, EMAIL_FROM, SITE_URL } from './email/resend';
import { prisma } from './prisma';
import { NotificationType, NotificationStatus } from '@prisma/client';
import { render } from '@react-email/components';
import { OrderConfirmationEmail } from './email/templates/order-confirmation';
import { ShippingUpdateEmail } from './email/templates/shipping-update';
import { EmailVerificationEmail } from './email/templates/email-verification';
import { PasswordResetEmail } from './email/templates/password-reset';
import { BadgeEarnedEmail } from './email/templates/badge-earned';
import { AdminAlertEmail } from './email/templates/admin-alert';

// ============================================================
// Types
// ============================================================

/** Data payload shapes for each notification type */
export interface NotificationDataMap {
  ORDER_CONFIRMATION: {
    customerName: string;
    orderNumber: string;
    items: { name: string; quantity: number; unitPrice: number }[];
    subtotal: number;
    discount: number;
    shippingCost: number;
    total: number;
    estimatedDelivery: string;
  };
  SHIPPING_UPDATE: {
    customerName: string;
    orderNumber: string;
    trackingNumber: string;
    carrier: string;
    status: 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered';
    estimatedDelivery?: string;
    trackingUrl?: string;
  };
  DELIVERY_CONFIRMATION: {
    customerName: string;
    orderNumber: string;
    trackingNumber: string;
    carrier: string;
  };
  EMAIL_VERIFICATION: {
    customerName: string;
    verificationToken: string;
  };
  PASSWORD_RESET: {
    customerName: string;
    resetToken: string;
  };
  BADGE_EARNED: {
    customerName: string;
    badgeName: string;
    badgeDescription: string;
  };
  ADMIN_NEW_ORDER: {
    orderNumber: string;
    customerName: string;
    total: string;
    itemCount: string;
  };
  ADMIN_LOW_STOCK: {
    productName: string;
    currentStock: string;
    threshold: string;
  };
  ADMIN_NEW_INQUIRY: {
    name: string;
    email: string;
    packageTier: string;
    partyDate: string;
  };
  ADMIN_MODERATION: {
    contentType: string;
    submittedBy: string;
    submittedAt: string;
  };
  BIRTHDAY_INQUIRY_CONFIRMATION: {
    customerName: string;
    partyDate: string;
    packageTier: string;
    numberOfChildren: string;
  };
}

export type NotificationPayload<T extends NotificationType> = {
  type: T;
  recipient: string;
  recipientId?: string;
  data: NotificationDataMap[T];
};

// ============================================================
// Retry Configuration
// ============================================================

/** Exponential backoff delays in milliseconds: 30s, 60s, 120s */
const RETRY_DELAYS_MS = [30_000, 60_000, 120_000] as const;
const MAX_RETRIES = 3;

// ============================================================
// Email Rendering
// ============================================================

interface RenderedEmail {
  subject: string;
  html: string;
}

async function renderNotificationEmail(
  type: NotificationType,
  data: NotificationDataMap[NotificationType]
): Promise<RenderedEmail> {
  switch (type) {
    case 'ORDER_CONFIRMATION': {
      const d = data as NotificationDataMap['ORDER_CONFIRMATION'];
      const orderUrl = `${SITE_URL}/account/orders`;
      const html = await render(
        OrderConfirmationEmail({ ...d, orderUrl })
      );
      return {
        subject: `Order Confirmed — ${d.orderNumber}`,
        html,
      };
    }

    case 'SHIPPING_UPDATE': {
      const d = data as NotificationDataMap['SHIPPING_UPDATE'];
      const html = await render(ShippingUpdateEmail(d));
      return {
        subject: `Shipping Update — ${d.orderNumber}`,
        html,
      };
    }

    case 'DELIVERY_CONFIRMATION': {
      const d = data as NotificationDataMap['DELIVERY_CONFIRMATION'];
      const html = await render(
        ShippingUpdateEmail({
          ...d,
          status: 'delivered',
        })
      );
      return {
        subject: `Order Delivered — ${d.orderNumber}`,
        html,
      };
    }

    case 'EMAIL_VERIFICATION': {
      const d = data as NotificationDataMap['EMAIL_VERIFICATION'];
      const verificationUrl = `${SITE_URL}/api/auth/verify/${d.verificationToken}`;
      const html = await render(
        EmailVerificationEmail({
          customerName: d.customerName,
          verificationUrl,
        })
      );
      return {
        subject: 'Verify Your Email — Paint & Keep',
        html,
      };
    }

    case 'PASSWORD_RESET': {
      const d = data as NotificationDataMap['PASSWORD_RESET'];
      const resetUrl = `${SITE_URL}/reset-password?token=${d.resetToken}`;
      const html = await render(
        PasswordResetEmail({
          customerName: d.customerName,
          resetUrl,
        })
      );
      return {
        subject: 'Reset Your Password — Paint & Keep',
        html,
      };
    }

    case 'BADGE_EARNED': {
      const d = data as NotificationDataMap['BADGE_EARNED'];
      const profileUrl = `${SITE_URL}/account`;
      const html = await render(BadgeEarnedEmail({ ...d, profileUrl }));
      return {
        subject: `You Earned a Badge: ${d.badgeName}! 🏆`,
        html,
      };
    }

    case 'ADMIN_NEW_ORDER': {
      const d = data as NotificationDataMap['ADMIN_NEW_ORDER'];
      const html = await render(
        AdminAlertEmail({
          alertType: 'new_order',
          title: 'New Order Received',
          details: {
            'Order Number': d.orderNumber,
            Customer: d.customerName,
            Total: `₹${d.total}`,
            Items: d.itemCount,
          },
          actionUrl: `${SITE_URL}/admin/orders`,
          actionLabel: 'View Order',
        })
      );
      return {
        subject: `New Order — ${d.orderNumber}`,
        html,
      };
    }

    case 'ADMIN_LOW_STOCK': {
      const d = data as NotificationDataMap['ADMIN_LOW_STOCK'];
      const html = await render(
        AdminAlertEmail({
          alertType: 'low_stock',
          title: 'Low Stock Alert',
          details: {
            Product: d.productName,
            'Current Stock': d.currentStock,
            Threshold: d.threshold,
          },
          actionUrl: `${SITE_URL}/admin/products`,
          actionLabel: 'Manage Inventory',
        })
      );
      return {
        subject: `Low Stock Alert — ${d.productName}`,
        html,
      };
    }

    case 'ADMIN_NEW_INQUIRY': {
      const d = data as NotificationDataMap['ADMIN_NEW_INQUIRY'];
      const html = await render(
        AdminAlertEmail({
          alertType: 'new_inquiry',
          title: 'New Birthday Inquiry',
          details: {
            Name: d.name,
            Email: d.email,
            Package: d.packageTier,
            'Party Date': d.partyDate,
          },
          actionUrl: `${SITE_URL}/admin/inquiries`,
          actionLabel: 'View Inquiry',
        })
      );
      return {
        subject: `New Birthday Inquiry from ${d.name}`,
        html,
      };
    }

    case 'ADMIN_MODERATION': {
      const d = data as NotificationDataMap['ADMIN_MODERATION'];
      const html = await render(
        AdminAlertEmail({
          alertType: 'new_inquiry',
          title: 'New Content Pending Moderation',
          details: {
            Type: d.contentType,
            'Submitted By': d.submittedBy,
            'Submitted At': d.submittedAt,
          },
          actionUrl: `${SITE_URL}/admin/moderation`,
          actionLabel: 'Review Content',
        })
      );
      return {
        subject: `Moderation Required — ${d.contentType}`,
        html,
      };
    }

    case 'BIRTHDAY_INQUIRY_CONFIRMATION': {
      const d = data as NotificationDataMap['BIRTHDAY_INQUIRY_CONFIRMATION'];
      const html = await render(
        OrderConfirmationEmail({
          customerName: d.customerName,
          orderNumber: `Birthday Party — ${d.partyDate}`,
          items: [
            {
              name: `${d.packageTier} (${d.numberOfChildren} kids)`,
              quantity: 1,
              unitPrice: 0,
            },
          ],
          subtotal: 0,
          discount: 0,
          shippingCost: 0,
          total: 0,
          estimatedDelivery: d.partyDate,
          orderUrl: `${SITE_URL}/account`,
        })
      );
      return {
        subject: 'Birthday Inquiry Received — Paint & Keep',
        html,
      };
    }

    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown notification type: ${_exhaustive}`);
    }
  }
}

// ============================================================
// Notification Service
// ============================================================

/**
 * Send a notification email with retry logic and database logging.
 *
 * Implements exponential backoff: 30s → 60s → 120s (max 3 retries).
 * All notifications are recorded in the NotificationLog table.
 */
export async function sendNotification<T extends NotificationType>(
  payload: NotificationPayload<T>
): Promise<{ success: boolean; logId: string }> {
  const { type, recipient, recipientId, data } = payload;

  // Render the email content
  let rendered: RenderedEmail;
  try {
    rendered = await renderNotificationEmail(type, data);
  } catch (renderError) {
    // If rendering fails, log and return immediately (no retries for render errors)
    const log = await prisma.notificationLog.create({
      data: {
        recipientId: recipientId || null,
        email: recipient,
        type,
        subject: `[RENDER ERROR] ${type}`,
        status: NotificationStatus.FAILED,
        lastError:
          renderError instanceof Error
            ? renderError.message
            : 'Template rendering failed',
      },
    });
    console.error(
      `[Notification] Render error for ${type} to ${recipient}:`,
      renderError
    );
    return { success: false, logId: log.id };
  }

  // Create the notification log entry as PENDING
  const log = await prisma.notificationLog.create({
    data: {
      recipientId: recipientId || null,
      email: recipient,
      type,
      subject: rendered.subject,
      status: NotificationStatus.PENDING,
    },
  });

  // Attempt to send with retries
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Resend API error');
      }

      // Success — update log
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          retryCount: attempt,
          lastError: null,
        },
      });

      return { success: true, logId: log.id };
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : 'Unknown send error';

      console.error(
        `[Notification] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed ` +
          `for ${type} to ${recipient}: ${lastError}`
      );

      // If we haven't exhausted retries, mark as RETRYING and wait
      if (attempt < MAX_RETRIES) {
        await prisma.notificationLog.update({
          where: { id: log.id },
          data: {
            status: NotificationStatus.RETRYING,
            retryCount: attempt + 1,
            lastError,
          },
        });

        // Wait with exponential backoff
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  // All retries exhausted — mark as FAILED
  await prisma.notificationLog.update({
    where: { id: log.id },
    data: {
      status: NotificationStatus.FAILED,
      retryCount: MAX_RETRIES,
      lastError,
    },
  });

  console.error(
    `[Notification] FAILED after ${MAX_RETRIES + 1} attempts: ` +
      `type=${type}, recipient=${recipient}, error=${lastError}`
  );

  return { success: false, logId: log.id };
}

// ============================================================
// Helper: Send notification without blocking (fire-and-forget)
// ============================================================

/**
 * Queues a notification to be sent in the background.
 * Does not block the calling code. Errors are logged but not thrown.
 */
export function sendNotificationAsync<T extends NotificationType>(
  payload: NotificationPayload<T>
): void {
  sendNotification(payload).catch((error) => {
    console.error(
      `[Notification] Background send failed for ${payload.type}:`,
      error
    );
  });
}

// ============================================================
// Utility
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
