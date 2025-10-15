// HTML Email Templates for Ticket System

export const emailStyles = `
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .ticket-info { background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .ticket-info-item { margin: 8px 0; }
    .label { font-weight: 600; color: #374151; display: inline-block; min-width: 120px; }
    .value { color: #6b7280; }
    .button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background-color: #2563eb; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-new { background-color: #dbeafe; color: #1e40af; }
    .badge-open { background-color: #dbeafe; color: #1e40af; }
    .badge-in-progress { background-color: #fef3c7; color: #92400e; }
    .badge-resolved { background-color: #d1fae5; color: #065f46; }
    .badge-closed { background-color: #e5e7eb; color: #374151; }
    .badge-low { background-color: #e0e7ff; color: #3730a3; }
    .badge-medium { background-color: #fef3c7; color: #92400e; }
    .badge-high { background-color: #fee2e2; color: #991b1b; }
    .changes { background-color: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px; margin: 15px 0; }
    .comment-box { background-color: #f0f9ff; border-left: 3px solid #0ea5e9; padding: 15px; margin: 15px 0; border-radius: 4px; }
  </style>
`;

export function ticketCreatedTemplate({ ticketId, issuerName, category, subCategory, department, room, priority, description, ticketUrl }) {
  const shortId = ticketId.toString().slice(-6);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 New Ticket Created</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #374151;">A new support ticket has been created and requires attention.</p>
          
          <div class="ticket-info">
            <div class="ticket-info-item">
              <span class="label">Ticket ID:</span>
              <span class="value">#${shortId}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Issuer:</span>
              <span class="value">${issuerName}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Category:</span>
              <span class="value">${category} / ${subCategory}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Department:</span>
              <span class="value">${department}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Location:</span>
              <span class="value">${room}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Priority:</span>
              <span class="badge badge-${priority}">${priority.toUpperCase()}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Status:</span>
              <span class="badge badge-new">NEW</span>
            </div>
          </div>

          <div style="margin: 20px 0;">
            <strong style="color: #374151;">Description:</strong>
            <p style="color: #6b7280; margin-top: 8px; line-height: 1.6;">${description}</p>
          </div>

          <div style="text-align: center;">
            <a href="${ticketUrl}" class="button">View Ticket Details</a>
          </div>
        </div>
        <div class="footer">
          <p>Campus Ticket System - Automated Notification</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function ticketUpdatedTemplate({ ticketId, issuerName, category, subCategory, department, room, status, priority, changes, ticketUrl, actorName }) {
  const shortId = ticketId.toString().slice(-6);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Ticket Updated</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #374151;">Ticket <strong>#${shortId}</strong> has been updated${actorName ? ' by ' + actorName : ''}.</p>
          
          <div class="changes">
            <strong style="color: #92400e;">📝 Changes Made:</strong>
            <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
              ${changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
          </div>

          <div class="ticket-info">
            <div class="ticket-info-item">
              <span class="label">Ticket ID:</span>
              <span class="value">#${shortId}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Issuer:</span>
              <span class="value">${issuerName}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Category:</span>
              <span class="value">${category} / ${subCategory}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Department:</span>
              <span class="value">${department}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Location:</span>
              <span class="value">${room}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Status:</span>
              <span class="badge badge-${status}">${status.toUpperCase().replace('_', ' ')}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Priority:</span>
              <span class="badge badge-${priority}">${priority.toUpperCase()}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${ticketUrl}" class="button">View Ticket Details</a>
          </div>
        </div>
        <div class="footer">
          <p>Campus Ticket System - Automated Notification</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function commentAddedTemplate({ ticketId, issuerName, category, subCategory, commenterName, commentText, ticketUrl }) {
  const shortId = ticketId.toString().slice(-6);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Comment Added</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #374151;"><strong>${commenterName}</strong> added a comment to ticket <strong>#${shortId}</strong>.</p>
          
          <div class="comment-box">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0c4a6e;">💬 ${commenterName} commented:</strong>
            </div>
            <p style="color: #0f172a; margin: 0; line-height: 1.6;">${commentText}</p>
          </div>

          <div class="ticket-info">
            <div class="ticket-info-item">
              <span class="label">Ticket ID:</span>
              <span class="value">#${shortId}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Issuer:</span>
              <span class="value">${issuerName}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Category:</span>
              <span class="value">${category} / ${subCategory}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${ticketUrl}" class="button">View & Reply</a>
          </div>
        </div>
        <div class="footer">
          <p>Campus Ticket System - Automated Notification</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function profileUpdatedTemplate({ userName, userEmail, changes, updatedBy }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👤 Profile Updated</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #374151;">Your profile information has been updated${updatedBy ? ' by ' + updatedBy : ''}.</p>
          
          <div class="changes">
            <strong style="color: #92400e;">📝 Changes Made:</strong>
            <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
              ${changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
          </div>

          <div class="ticket-info">
            <div class="ticket-info-item">
              <span class="label">Name:</span>
              <span class="value">${userName}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Email:</span>
              <span class="value">${userEmail}</span>
            </div>
          </div>

          <p style="color: #dc2626; margin-top: 20px; padding: 15px; background-color: #fee2e2; border-radius: 6px; font-size: 14px;">
            ⚠️ If you did not request these changes, please contact your system administrator immediately.
          </p>
        </div>
        <div class="footer">
          <p>Campus Ticket System - Automated Notification</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function ticketAssignedTemplate({ ticketId, issuerName, category, subCategory, department, room, priority, description, assigneeName, ticketUrl }) {
  const shortId = ticketId.toString().slice(-6);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👨‍💼 Ticket Assigned to You</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #374151;">Hello <strong>${assigneeName}</strong>, a ticket has been assigned to you.</p>
          
          <div class="ticket-info">
            <div class="ticket-info-item">
              <span class="label">Ticket ID:</span>
              <span class="value">#${shortId}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Issuer:</span>
              <span class="value">${issuerName}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Category:</span>
              <span class="value">${category} / ${subCategory}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Department:</span>
              <span class="value">${department}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Location:</span>
              <span class="value">${room}</span>
            </div>
            <div class="ticket-info-item">
              <span class="label">Priority:</span>
              <span class="badge badge-${priority}">${priority.toUpperCase()}</span>
            </div>
          </div>

          <div style="margin: 20px 0;">
            <strong style="color: #374151;">Description:</strong>
            <p style="color: #6b7280; margin-top: 8px; line-height: 1.6;">${description}</p>
          </div>

          <div style="text-align: center;">
            <a href="${ticketUrl}" class="button">Start Working on This Ticket</a>
          </div>
        </div>
        <div class="footer">
          <p>Campus Ticket System - Automated Notification</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
