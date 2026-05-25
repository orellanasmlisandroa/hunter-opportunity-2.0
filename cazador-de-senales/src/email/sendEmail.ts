import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../db/saveCompaniesAndReviews';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  outreachMessageId: string;
}

export interface SendResult {
  sent: boolean;
  dryRun: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const isDryRun = process.env.DRY_RUN !== 'false';

  // No reenviar si ya fue enviado
  const { data: existing } = await supabase
    .from('outreach_messages')
    .select('status')
    .eq('id', payload.outreachMessageId)
    .maybeSingle();

  if (existing?.status === 'sent') {
    return { sent: false, dryRun: false, error: 'Ya enviado anteriormente' };
  }

  if (isDryRun) {
    console.log('\n  ─── DRY RUN — Email NO enviado ───────────────');
    console.log(`  Para   : ${payload.to}`);
    console.log(`  Asunto : ${payload.subject}`);
    console.log(`  Cuerpo :\n${payload.body.split('\n').map(l => '    ' + l).join('\n')}`);
    console.log('  ────────────────────────────────────────────\n');
    return { sent: false, dryRun: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: payload.to,
      subject: payload.subject,
      text: payload.body,
    });

    if (error) throw new Error(error.message);

    await supabase
      .from('outreach_messages')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', payload.outreachMessageId);

    return { sent: true, dryRun: false, messageId: data?.id };
  } catch (err) {
    const msg = (err as Error).message;
    console.error('  ⚠️  Error Resend:', msg);
    return { sent: false, dryRun: false, error: msg };
  }
}
