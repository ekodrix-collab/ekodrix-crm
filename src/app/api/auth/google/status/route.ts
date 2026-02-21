import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isConnected: false });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('google_access_token')
            .eq('id', user.id)
            .single();

        console.log('Checking Google status for user:', user.id, 'Found profile:', !!profile, 'Has token:', !!profile?.google_access_token);
        return NextResponse.json({
            isConnected: !!profile?.google_access_token
        });
    } catch (error) {
        console.error('Error checking Google Calendar status:', error);
        return NextResponse.json({ isConnected: false }, { status: 500 });
    }
}
