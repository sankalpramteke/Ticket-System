// Centralized Notification Service
import { sendMail } from '@/lib/mail';
import Notification from '@/models/Notification';
import User from '@/models/User';
import {
  ticketCreatedTemplate,
  ticketUpdatedTemplate,
  commentAddedTemplate,
  profileUpdatedTemplate,
  ticketAssignedTemplate
} from '@/lib/emailTemplates';

/**
 * Check if user has notifications enabled and specific notification type enabled
 */
async function shouldNotifyUser(userId, notificationType) {
  try {
    const user = await User.findById(userId).select('notificationPreferences').lean();
    if (!user) return false;

    // If user doesn't have preferences set, default to true (send all notifications)
    if (!user.notificationPreferences) return true;

    // Check master email switch
    if (user.notificationPreferences.emailEnabled === false) return false;

    // Check specific notification type
    const prefMap = {
      'ticket_created': 'ticketCreated',
      'ticket_updated': 'ticketStatusChanged', // Also covers priority changes
      'ticket_assigned': 'ticketAssigned',
      'comment_added': 'newComment',
      'profile_updated': 'profileUpdated'
    };

    const prefKey = prefMap[notificationType];
    if (prefKey && user.notificationPreferences[prefKey] === false) return false;

    return true;
  } catch (error) {
    console.warn('[notificationService] Error checking user preferences:', error.message);
    return true; // Default to sending if check fails
  }
}

/**
 * Log notification to database
 */
async function logNotification(userId, recipientEmail, type, subject, status, ticketId = null, error = null) {
  try {
    await Notification.create({
      userId,
      recipientEmail,
      type,
      subject,
      status,
      ticketId,
      error,
      sentAt: new Date()
    });
  } catch (err) {
    console.warn('[notificationService] Failed to log notification:', err.message);
  }
}

/**
 * Send email with tracking
 */
async function sendEmailWithTracking(userId, recipientEmail, type, subject, htmlContent, ticketId = null) {
  try {
    // Check if user wants this notification
    const shouldSend = await shouldNotifyUser(userId, type);
    if (!shouldSend) {
      await logNotification(userId, recipientEmail, type, subject, 'skipped', ticketId, 'User preferences disabled');
      console.log(`[notificationService] Skipped ${type} for ${recipientEmail} (preferences)`);
      return { skipped: true, reason: 'preferences' };
    }

    // Send email
    const result = await sendMail({
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for plain text fallback
    });

    if (result.skipped) {
      await logNotification(userId, recipientEmail, type, subject, 'skipped', ticketId, 'SMTP not configured');
      return result;
    }

    // Log success
    await logNotification(userId, recipientEmail, type, subject, 'sent', ticketId);
    console.log(`[notificationService] Sent ${type} to ${recipientEmail}`);
    return { sent: true };

  } catch (error) {
    // Log failure
    await logNotification(userId, recipientEmail, type, subject, 'failed', ticketId, error.message);
    console.error(`[notificationService] Failed to send ${type} to ${recipientEmail}:`, error.message);
    return { failed: true, error: error.message };
  }
}

/**
 * Notify about ticket creation
 */
export async function notifyTicketCreated(ticket, reporterUser) {
  const results = [];
  const ticketUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/tickets/${ticket._id}`;
  const shortId = ticket._id.toString().slice(-6);
  const subject = `New Ticket #${shortId} - ${ticket.category} / ${ticket.subCategory}`;

  const htmlContent = ticketCreatedTemplate({
    ticketId: ticket._id,
    issuerName: ticket.issuerName,
    category: ticket.category,
    subCategory: ticket.subCategory,
    department: ticket.department,
    room: ticket.room,
    priority: ticket.priority,
    description: ticket.description,
    ticketUrl
  });

  // Notify reporter
  if (reporterUser?.email) {
    const result = await sendEmailWithTracking(
      reporterUser._id,
      reporterUser.email,
      'ticket_created',
      subject,
      htmlContent,
      ticket._id
    );
    results.push({ recipient: 'reporter', email: reporterUser.email, ...result });
  }

  // Notify admins
  try {
    const admins = await User.find({ role: 'admin' }).select('_id name email').lean();
    for (const admin of admins) {
      if (admin.email) {
        const result = await sendEmailWithTracking(
          admin._id,
          admin.email,
          'ticket_created',
          subject,
          htmlContent,
          ticket._id
        );
        results.push({ recipient: 'admin', email: admin.email, ...result });
      }
    }
  } catch (error) {
    console.warn('[notificationService] Error fetching admins:', error.message);
  }

  return results;
}

/**
 * Notify about ticket updates (status, priority, assignment)
 */
export async function notifyTicketUpdated(ticket, changes, actorUser) {
  const results = [];
  const ticketUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/tickets/${ticket._id}`;
  const shortId = ticket._id.toString().slice(-6);
  const subject = `Ticket #${shortId} Updated`;

  const htmlContent = ticketUpdatedTemplate({
    ticketId: ticket._id,
    issuerName: ticket.issuerName,
    category: ticket.category,
    subCategory: ticket.subCategory,
    department: ticket.department,
    room: ticket.room,
    status: ticket.status,
    priority: ticket.priority,
    changes,
    ticketUrl,
    actorName: actorUser?.name
  });

  // Get reporter
  const reporterId = ticket.reporterId?._id || ticket.reporterId;
  if (reporterId) {
    try {
      const reporter = await User.findById(reporterId).select('_id email').lean();
      if (reporter?.email) {
        const result = await sendEmailWithTracking(
          reporter._id,
          reporter.email,
          'ticket_updated',
          subject,
          htmlContent,
          ticket._id
        );
        results.push({ recipient: 'reporter', email: reporter.email, ...result });
      }
    } catch (error) {
      console.warn('[notificationService] Error fetching reporter:', error.message);
    }
  }

  // Get assignee if different from actor
  const assigneeId = ticket.assigneeId?._id || ticket.assigneeId;
  if (assigneeId && String(assigneeId) !== String(actorUser?._id)) {
    try {
      const assignee = await User.findById(assigneeId).select('_id email').lean();
      if (assignee?.email) {
        const result = await sendEmailWithTracking(
          assignee._id,
          assignee.email,
          'ticket_updated',
          subject,
          htmlContent,
          ticket._id
        );
        results.push({ recipient: 'assignee', email: assignee.email, ...result });
      }
    } catch (error) {
      console.warn('[notificationService] Error fetching assignee:', error.message);
    }
  }

  // Notify admins
  try {
    const admins = await User.find({ role: 'admin' }).select('_id name email').lean();
    for (const admin of admins) {
      // Don't notify admin if they made the change
      if (admin.email && String(admin._id) !== String(actorUser?._id)) {
        const result = await sendEmailWithTracking(
          admin._id,
          admin.email,
          'ticket_updated',
          subject,
          htmlContent,
          ticket._id
        );
        results.push({ recipient: 'admin', email: admin.email, ...result });
      }
    }
  } catch (error) {
    console.warn('[notificationService] Error fetching admins:', error.message);
  }

  return results;
}

/**
 * Notify assignee when ticket is assigned to them
 */
export async function notifyTicketAssigned(ticket, assigneeUser) {
  if (!assigneeUser?.email) return [];

  const ticketUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/tickets/${ticket._id}`;
  const shortId = ticket._id.toString().slice(-6);
  const subject = `Ticket #${shortId} Assigned to You`;

  const htmlContent = ticketAssignedTemplate({
    ticketId: ticket._id,
    issuerName: ticket.issuerName,
    category: ticket.category,
    subCategory: ticket.subCategory,
    department: ticket.department,
    room: ticket.room,
    priority: ticket.priority,
    description: ticket.description,
    assigneeName: assigneeUser.name,
    ticketUrl
  });

  const result = await sendEmailWithTracking(
    assigneeUser._id,
    assigneeUser.email,
    'ticket_assigned',
    subject,
    htmlContent,
    ticket._id
  );

  return [{ recipient: 'assignee', email: assigneeUser.email, ...result }];
}

/**
 * Notify about new comment
 */
export async function notifyCommentAdded(ticket, comment, commenterUser) {
  const results = [];
  const ticketUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/tickets/${ticket._id}`;
  const shortId = ticket._id.toString().slice(-6);
  const subject = `New Comment on Ticket #${shortId}`;

  const htmlContent = commentAddedTemplate({
    ticketId: ticket._id,
    issuerName: ticket.issuerName,
    category: ticket.category,
    subCategory: ticket.subCategory,
    commenterName: commenterUser?.name || 'User',
    commentText: comment.message,
    ticketUrl
  });

  // Get reporter
  const reporterId = ticket.reporterId?._id || ticket.reporterId;
  if (reporterId && String(reporterId) !== String(commenterUser?._id)) {
    try {
      const reporter = await User.findById(reporterId).select('_id email').lean();
      if (reporter?.email) {
        const result = await sendEmailWithTracking(
          reporter._id,
          reporter.email,
          'comment_added',
          subject,
          htmlContent,
          ticket._id
        );
        results.push({ recipient: 'reporter', email: reporter.email, ...result });
      }
    } catch (error) {
      console.warn('[notificationService] Error fetching reporter:', error.message);
    }
  }

  // Get assignee
  const assigneeId = ticket.assigneeId?._id || ticket.assigneeId;
  if (assigneeId && String(assigneeId) !== String(commenterUser?._id)) {
    try {
      const assignee = await User.findById(assigneeId).select('_id email').lean();
      if (assignee?.email) {
        const result = await sendEmailWithTracking(
          assignee._id,
          assignee.email,
          'comment_added',
          subject,
          htmlContent,
          ticket._id
        );
        results.push({ recipient: 'assignee', email: assignee.email, ...result });
      }
    } catch (error) {
      console.warn('[notificationService] Error fetching assignee:', error.message);
    }
  }

  // Notify admins
  try {
    const admins = await User.find({ role: 'admin' }).select('_id name email').lean();
    for (const admin of admins) {
      // Don't notify admin if they made the comment
      if (admin.email && String(admin._id) !== String(commenterUser?._id)) {
        const result = await sendEmailWithTracking(
          admin._id,
          admin.email,
          'comment_added',
          subject,
          htmlContent,
          ticket._id
        );
        results.push({ recipient: 'admin', email: admin.email, ...result });
      }
    }
  } catch (error) {
    console.warn('[notificationService] Error fetching admins:', error.message);
  }

  return results;
}

/**
 * Notify about profile updates
 */
export async function notifyProfileUpdated(user, changes, updatedByUser) {
  if (!user?.email) return [];

  const subject = 'Your Profile Has Been Updated';
  const htmlContent = profileUpdatedTemplate({
    userName: user.name,
    userEmail: user.email,
    changes,
    updatedBy: updatedByUser?.name
  });

  const result = await sendEmailWithTracking(
    user._id,
    user.email,
    'profile_updated',
    subject,
    htmlContent
  );

  return [{ recipient: 'user', email: user.email, ...result }];
}
