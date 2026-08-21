/**
 * Formats an ISO timestamp as a medium date, e.g. `15 Nov 2024`.
 * Returns an empty string when the value is absent.
 */
export function fmtDate(iso: string | null | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Formats an ISO timestamp as a medium date plus short time,
 * e.g. `15 Nov 2024, 23:55`. Returns an empty string when absent.
 */
export function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Formats an ISO timestamp as `HH:mm` (en-GB). Returns a dash when absent. */
export function fmtTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
