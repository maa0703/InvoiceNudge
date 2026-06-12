export type ReminderTemplateVars = {
  clientName: string
  displayName: string
  signatureName: string
  invoiceRef: string
  amount: string
  dueDate: string
  cancelUrl: string
}

type EmailTemplate = { subject: string; text: string; html: string }

export function reminder1(v: ReminderTemplateVars): EmailTemplate {
  const name = v.signatureName || v.displayName || 'Your freelancer'
  return {
    subject: `Quick note about invoice ${v.invoiceRef}`,
    text: [
      `Hi ${v.clientName},`,
      ``,
      `Just a quick note — invoice ${v.invoiceRef} for ${v.amount} was due on ${v.dueDate}.`,
      ``,
      `If you've already sent payment, please disregard this. Otherwise, we'd appreciate settlement at your earliest convenience.`,
      ``,
      `Thanks,`,
      `${name}`,
    ].join('\n'),
    html: `<p>Hi ${v.clientName},</p>
<p>Just a quick note — invoice <strong>${v.invoiceRef}</strong> for <strong>${v.amount}</strong> was due on ${v.dueDate}.</p>
<p>If you've already sent payment, please disregard this. Otherwise, we'd appreciate settlement at your earliest convenience.</p>
<p>Thanks,<br>${name}</p>`,
  }
}

export function reminder2(v: ReminderTemplateVars): EmailTemplate {
  const name = v.signatureName || v.displayName || 'Your freelancer'
  return {
    subject: `Second reminder — invoice ${v.invoiceRef}`,
    text: [
      `Hi ${v.clientName},`,
      ``,
      `This is a second reminder that invoice ${v.invoiceRef} for ${v.amount} (due ${v.dueDate}) is still outstanding.`,
      ``,
      `Please arrange payment as soon as possible. If there's an issue, feel free to reach out.`,
      ``,
      `Thanks,`,
      `${name}`,
    ].join('\n'),
    html: `<p>Hi ${v.clientName},</p>
<p>This is a second reminder that invoice <strong>${v.invoiceRef}</strong> for <strong>${v.amount}</strong> (due ${v.dueDate}) is still outstanding.</p>
<p>Please arrange payment as soon as possible. If there's an issue, feel free to reach out.</p>
<p>Thanks,<br>${name}</p>`,
  }
}

export function reminder3(v: ReminderTemplateVars): EmailTemplate {
  const name = v.signatureName || v.displayName || 'Your freelancer'
  return {
    subject: `Third reminder — invoice ${v.invoiceRef} is overdue`,
    text: [
      `Hi ${v.clientName},`,
      ``,
      `This is our third reminder that invoice ${v.invoiceRef} for ${v.amount} (due ${v.dueDate}) remains unpaid.`,
      ``,
      `Please make payment immediately. If you have questions, please get in touch.`,
      ``,
      `Thanks,`,
      `${name}`,
    ].join('\n'),
    html: `<p>Hi ${v.clientName},</p>
<p>This is our third reminder that invoice <strong>${v.invoiceRef}</strong> for <strong>${v.amount}</strong> (due ${v.dueDate}) remains unpaid.</p>
<p>Please make payment immediately. If you have questions, please get in touch.</p>
<p>Thanks,<br>${name}</p>`,
  }
}

export function reminder4(v: ReminderTemplateVars): EmailTemplate {
  const name = v.signatureName || v.displayName || 'Your freelancer'
  return {
    subject: `Final notice — invoice ${v.invoiceRef}`,
    text: [
      `Hi ${v.clientName},`,
      ``,
      `This is our final notice regarding invoice ${v.invoiceRef} for ${v.amount}, due on ${v.dueDate}.`,
      ``,
      `Please arrange payment at your earliest opportunity. If you have questions or need to discuss, please reply to this email.`,
      ``,
      `Thank you,`,
      `${name}`,
    ].join('\n'),
    html: `<p>Hi ${v.clientName},</p>
<p>This is our final notice regarding invoice <strong>${v.invoiceRef}</strong> for <strong>${v.amount}</strong>, due on ${v.dueDate}.</p>
<p>Please arrange payment at your earliest opportunity. If you have questions or need to discuss, please reply to this email.</p>
<p>Thank you,<br>${name}</p>`,
  }
}

export function checkin(v: ReminderTemplateVars): EmailTemplate {
  return {
    subject: `Heads-up: reminder sending soon for invoice ${v.invoiceRef}`,
    text: [
      `Hi,`,
      ``,
      `We're about to send a payment reminder to ${v.clientName} for invoice ${v.invoiceRef} (${v.amount}).`,
      ``,
      `If your client has already paid or you'd like to cancel this reminder, click below (valid for 3 hours):`,
      ``,
      v.cancelUrl,
      ``,
      `If you take no action, the reminder will be sent automatically.`,
    ].join('\n'),
    html: `<p>Hi,</p>
<p>We're about to send a payment reminder to <strong>${v.clientName}</strong> for invoice <strong>${v.invoiceRef}</strong> (${v.amount}).</p>
<p>If your client has already paid or you'd like to cancel this reminder, <a href="${v.cancelUrl}">click here to cancel</a> (valid for 3 hours).</p>
<p>If you take no action, the reminder will be sent automatically.</p>`,
  }
}
