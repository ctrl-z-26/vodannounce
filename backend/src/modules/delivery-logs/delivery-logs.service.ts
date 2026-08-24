import { supabase } from '@shared/supabase/supabase.js';


export async function createDeliveryLog(
    announcementId: string,
    destination: string,
) {

    const { data, error } =
        await supabase
            .from('delivery_logs')
            .insert({
                announcement_id: announcementId,
                channel: 'teams',
                destination,
                status: 'pending',
            })
            .select()
            .single();


    if (error) {
        throw new Error(
            `Failed to create delivery log: ${error.message}`,
        );
    }


    return data;
}


export async function markDeliveryLogSent(
    deliveryLogId: string,
    providerMessageId: string,
) {

    const { error } =
        await supabase
            .from('delivery_logs')
            .update({
                status: 'sent',
                provider_message_id: providerMessageId,
                completed_at: new Date().toISOString(),
                error_message: null,
            })
            .eq('id', deliveryLogId);


    if (error) {
        throw new Error(
            `Failed to update delivery log: ${error.message}`,
        );
    }
}


export async function markDeliveryLogFailed(
    deliveryLogId: string,
    errorMessage: string,
) {

    const { error } =
        await supabase
            .from('delivery_logs')
            .update({
                status: 'failed',
                error_message: errorMessage,
                completed_at: new Date().toISOString(),
            })
            .eq('id', deliveryLogId);


    if (error) {
        throw new Error(
            `Failed to update delivery log: ${error.message}`,
        );
    }
}