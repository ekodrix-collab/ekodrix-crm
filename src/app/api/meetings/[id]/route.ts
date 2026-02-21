import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { updateMeetEvent, deleteMeetEvent, buildISODateTime } from '@/lib/google-calendar';

// GET — Single meeting with full details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    try {
        const { data: meeting, error } = await supabase
            .from('meetings')
            .select(`
        *,
        organizer:users!organizer_id(id, name, email, avatar_url),
        participants:meeting_participants(
          id, user_id, email, name, role, rsvp_status, invited_at, responded_at,
          user:users(id, name, email, avatar_url)
        ),
        lead:leads(id, name, company_name, email, phone)
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching meeting:', error);
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json({ data: meeting });
    } catch (error) {
        console.error('Error in GET /api/meetings/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT — Update a meeting
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    try {
        const body = await request.json();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current meeting for calendar event ID
        const { data: existingMeeting } = await supabase
            .from('meetings')
            .select('calendar_event_id, organizer_id, timezone')
            .eq('id', id)
            .single();

        // Build update data
        const updateData: Record<string, any> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;

        // Build proper ISO start/end timestamps with timezone
        const timezone = body.timezone || existingMeeting?.timezone || 'Asia/Kolkata';
        if (body.start_date && body.start_time) {
            updateData.start_time = await buildISODateTime(body.start_date, body.start_time, timezone);
        }
        if (body.start_date && body.end_time) {
            updateData.end_time = await buildISODateTime(body.start_date, body.end_time, timezone, body.start_time);
        }
        if (body.timezone !== undefined) updateData.timezone = body.timezone;
        if (body.location !== undefined) updateData.location = body.location;
        if (body.color !== undefined) updateData.color = body.color;
        if (body.recurrence !== undefined) updateData.recurrence = body.recurrence;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.lead_id !== undefined) updateData.lead_id = body.lead_id || null;

        // Update in Supabase
        const { data: meeting, error } = await supabase
            .from('meetings')
            .update(updateData)
            .eq('id', id)
            .select(`
        *,
        organizer:users!organizer_id(id, name, email, avatar_url),
        participants:meeting_participants(
          id, user_id, email, name, role, rsvp_status, invited_at, responded_at,
          user:users(id, name, email, avatar_url)
        ),
        lead:leads(id, name, company_name)
      `)
            .single();

        if (error) {
            console.error('Error updating meeting:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update participants if provided
        let attendeeEmails: { email: string }[] | undefined = undefined;
        if (body.participants) {
            attendeeEmails = [];
            // Remove existing non-organizer participants
            await supabase
                .from('meeting_participants')
                .delete()
                .eq('meeting_id', id)
                .neq('role', 'organizer');

            // Insert new participants
            if (body.participants.length > 0) {
                const newParticipants = body.participants
                    .filter((p: { user_id?: string }) => p.user_id !== existingMeeting?.organizer_id) // Skip organizer
                    .map((p: {
                        user_id?: string;
                        email?: string;
                        name?: string;
                        role?: string;
                    }) => ({
                        meeting_id: id,
                        user_id: p.user_id || null,
                        email: p.email || null,
                        name: p.name || null,
                        role: p.role || 'required',
                        rsvp_status: 'pending',
                    }));

                if (newParticipants.length > 0) {
                    await supabase.from('meeting_participants').insert(newParticipants);
                }

                // Collect emails for Google Calendar sync
                attendeeEmails = [];
                const guestUserIds = body.participants
                    .filter((p: { user_id?: string }) => p.user_id && p.user_id !== existingMeeting?.organizer_id)
                    .map((p: { user_id: string }) => p.user_id);

                if (guestUserIds.length > 0) {
                    const { data: users } = await supabase
                        .from('users')
                        .select('email')
                        .in('id', guestUserIds);
                    if (users) {
                        for (const u of users) {
                            if (u.email) attendeeEmails.push({ email: u.email });
                        }
                    }
                }

                for (const p of body.participants) {
                    if (p.email && p.user_id !== existingMeeting?.organizer_id && !attendeeEmails.some(a => a.email === p.email)) {
                        attendeeEmails.push({ email: p.email });
                    }
                }
            }
        }

        // Update Google Calendar event if exists
        if (existingMeeting?.calendar_event_id) {
            await updateMeetEvent({
                userId: existingMeeting.organizer_id,
                calendarEventId: existingMeeting.calendar_event_id,
                title: body.title,
                description: body.description,
                startTime: updateData.start_time as string,
                endTime: updateData.end_time as string,
                timezone: body.timezone,
                attendees: attendeeEmails,
            });
        }

        // Send notifications for rescheduled meeting
        if (body.start_date || body.start_time || body.status === 'cancelled') {
            const participants = meeting?.participants || [];
            const notifs = participants
                .filter((p: { user_id?: string; role: string }) => p.user_id && p.role !== 'organizer')
                .map((p: { user_id: string }) => ({
                    user_id: p.user_id,
                    title: body.status === 'cancelled' ? 'Meeting Cancelled' : 'Meeting Updated',
                    message: body.status === 'cancelled'
                        ? `"${meeting?.title}" has been cancelled`
                        : `"${meeting?.title}" has been rescheduled`,
                    type: 'meeting' as const,
                    related_id: id,
                }));

            if (notifs.length > 0) {
                await supabase.from('notifications').insert(notifs);
            }
        }

        return NextResponse.json({ data: meeting });
    } catch (error) {
        console.error('Error in PUT /api/meetings/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE — Cancel a meeting
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get meeting details
        const { data: meeting } = await supabase
            .from('meetings')
            .select(`
        id, title, calendar_event_id, organizer_id,
        participants:meeting_participants(user_id, role)
      `)
            .eq('id', id)
            .single();

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Delete Google Calendar event
        if (meeting.calendar_event_id) {
            await deleteMeetEvent({
                userId: meeting.organizer_id,
                calendarEventId: meeting.calendar_event_id,
            });
        }

        // Notify participants
        const notifs = (meeting.participants || [])
            .filter((p: { user_id?: string; role: string }) => p.user_id && p.role !== 'organizer')
            .map((p: { user_id: string }) => ({
                user_id: p.user_id,
                title: 'Meeting Cancelled',
                message: `"${meeting.title}" has been cancelled`,
                type: 'meeting' as const,
                related_id: id,
            }));

        if (notifs.length > 0) {
            await supabase.from('notifications').insert(notifs);
        }

        // Delete meeting (cascades to participants)
        const { error } = await supabase
            .from('meetings')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting meeting:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/meetings/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
