import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ProfileRole } from '@shared/types/campaign';
import { supabase } from './supabase';

function initialsOf(name: string): string {
    const parts = name.split(/\s+/).filter(Boolean);
    return (
        parts
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? '')
            .join('') || 'VU'
    );
}

function nameFromEmail(email: string): string {
    const local = email.split('@')[0] ?? '';
    const name = local
        .split(/[._\-+]/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
    return name || 'VOIS User';
}

/**
 * Subscribes to the Supabase auth session and fetches the user's profile role.
 *
 * @returns `ready: false` until the initial session lookup resolves;
 * `email: null` when unauthenticated. `role` is `null` while loading or when
 * the profile row is missing.
 */
export function useUser(): {
    ready: boolean;
    email: string | null;
    role: ProfileRole | null;
    fullName: string;
    firstName: string;
    initials: string;
} {
    const [ready, setReady] = useState(false);
    const [email, setEmail] = useState<string | null>(null);
    const [role, setRole] = useState<ProfileRole | null>(null);
    const [metaName, setMetaName] = useState<string | null>(null);

    useEffect(() => {
        const apply = async (session: Session | null) => {
            setEmail(session?.user?.email ?? null);
            const meta = session?.user?.user_metadata;
            setMetaName(typeof meta?.full_name === 'string' ? meta.full_name : null);

            if (session?.user?.id) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                setRole(data?.role ?? null);
            } else {
                setRole(null);
            }

            setReady(true);
        };
        supabase.auth.getSession().then(({ data: { session } }) => apply(session));
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
        return () => subscription.unsubscribe();
    }, []);

    const fullName = metaName ?? (email ? nameFromEmail(email) : 'VOIS User');

    return {
        ready,
        email,
        role,
        fullName,
        firstName: fullName.split(/\s+/)[0] ?? fullName,
        initials: initialsOf(fullName),
    };
}
