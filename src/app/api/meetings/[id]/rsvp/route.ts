import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST — RSVP to a meeting
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id: meetingId } = await params;

    try {
        const body = await request.json();
        const { rsvp_status } = body;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!['accepted', 'declined', 'tentative'].includes(rsvp_status)) {
            return NextResponse.json(
                { error: 'Invalid RSVP status' },
                { status: 400 }
            );
        }

        // Update participant RSVP
        const { data, error } = await supabase
            .from('meeting_participants')
            .update({
                rsvp_status,
                responded_at: new Date().toISOString(),
            })
            .eq('meeting_id', meetingId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating RSVP:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Notify the organizer
        const { data: meeting } = await supabase
            .from('meetings')
            .select('title, organizer_id')
            .eq('id', meetingId)
            .single();

        if (meeting) {
            const { data: respondingUser } = await supabase
                .from('users')
                .select('name')
                .eq('id', user.id)
                .single();

            await supabase.from('notifications').insert([{
                user_id: meeting.organizer_id,
                title: 'Meeting RSVP',
                message: `${respondingUser?.name || 'Someone'} ${rsvp_status} your meeting "${meeting.title}"`,
                type: 'meeting',
                related_id: meetingId,
            }]);
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error in POST /api/meetings/[id]/rsvp:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
