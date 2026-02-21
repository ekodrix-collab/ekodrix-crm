import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '/meetings';

    if (!code) {
        return NextResponse.redirect(new URL('/meetings?error=no_code', request.url));
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);
        console.log('Google tokens received:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiry: tokens.expiry_date
        });

        // Update user with tokens
        const updateData: Record<string, any> = {
            google_access_token: tokens.access_token,
            google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        };

        // Only update refresh token if Google provides it (usually only on first consent)
        if (tokens.refresh_token) {
            updateData.google_refresh_token = tokens.refresh_token;
        }

        // Use Admin client to bypass RLS for token storage
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminSupabase = createAdminClient();

        const { error } = await adminSupabase
            .from('users')
            .update(updateData)
            .eq('id', user.id);

        if (error) {
            console.error('Supabase admin update error in callback:', error);
            throw error;
        }
        console.log('User profile (ADMIN) updated with Google tokens for user:', user.id);

        // Redirect back to the requested page (or meetings)
        const redirectUrl = state.startsWith('/') ? state : '/meetings';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (error) {
        console.error('Error in Google OAuth callback:', error);
        return NextResponse.redirect(new URL('/meetings?error=auth_failed', request.url));
    }
}
