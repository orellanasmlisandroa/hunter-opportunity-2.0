import { supabase } from './saveCompaniesAndReviews';

export async function markAsContacted(signalId: string): Promise<void> {
  await supabase
    .from('signals')
    .update({ status: 'contacted' })
    .eq('id', signalId);
}

export async function markAsDiscarded(signalId: string): Promise<void> {
  await supabase
    .from('signals')
    .update({ status: 'discarded' })
    .eq('id', signalId);
}
