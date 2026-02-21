import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createMeetEvent, buildISODateTime } from '@/lib/google-calendar';

// GET — List meetings with filters
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const organizerId = searchParams.get('organizer_id');
    const view = searchParams.get('view'); // 'today', 'upcoming', 'past', 'all'

    try {
        let query = supabase
            .from('meetings')
            .select(`
        *,
        organizer:users!organizer_id(id, name, email, avatar_url),
        participants:meeting_participants(
          id, user_id, email, name, role, rsvp_status, invited_at, responded_at,
          user:users(id, name, email, avatar_url)
        ),
        lead:leads(id, name, company_name)
      `)
            .order('start_time', { ascending: true });

        // View filters
        const now = new Date().toISOString();
        if (view === 'today') {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            query = query
                .gte('start_time', todayStart.toISOString())
                .lte('start_time', todayEnd.toISOString());
        } else if (view === 'upcoming') {
            query = query
                .gte('start_time', now)
                .neq('status', 'cancelled');
        } else if (view === 'past') {
            query = query.lt('end_time', now);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (dateFrom) {
            query = query.gte('start_time', dateFrom);
        }
        if (dateTo) {
            query = query.lte('start_time', dateTo);
        }
        if (organizerId && organizerId !== 'all') {
            query = query.eq('organizer_id', organizerId);
        }

        const { data: meetings, error } = await query;

        if (error) {
            console.error('Error fetching meetings:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: meetings || [] });
    } catch (error) {
        console.error('Error in GET /api/meetings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST — Create a new meeting
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    try {
        const body = await request.json();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Build proper ISO start/end timestamps with timezone
        const timezone = body.timezone || 'Asia/Kolkata';
        const startDateTime = await buildISODateTime(body.start_date, body.start_time, timezone);

        // If end_time is numerically less than start_time, it likely crosses midnight.
        // We pass start_time to detect this and increment the date if necessary.
        const endDateTime = await buildISODateTime(body.start_date, body.end_time, timezone, body.start_time);

        // Generate Meet link if requested
        let meetLink: string | null = null;
        let calendarEventId: string | null = null;

        if (body.generate_meet_link) {
            // Collect all attendee emails (from direct emails + user IDs)
            const attendeeEmails: { email: string }[] = [];

            // Add direct email participants
            for (const p of (body.participants || [])) {
                if (p.email && !attendeeEmails.some(a => a.email === p.email)) {
                    attendeeEmails.push({ email: p.email });
                }
            }

            // Resolve user_id participants to emails
            const userIds = (body.participants || [])
                .filter((p: { user_id?: string }) => p.user_id)
                .map((p: { user_id: string }) => p.user_id);

            if (userIds.length > 0) {
                const { data: users } = await supabase
                    .from('users')
                    .select('email')
                    .in('id', userIds);

                if (users) {
                    for (const u of users) {
                        if (u.email && !attendeeEmails.some(a => a.email === u.email)) {
                            attendeeEmails.push({ email: u.email });
                        }
                    }
                }
            }

            const meetResult = await createMeetEvent({
                userId: user.id,
                title: body.title,
                description: body.description,
                startTime: startDateTime,
                endTime: endDateTime,
                timezone,
                attendees: attendeeEmails,
            });

            meetLink = meetResult.meetLink;
            calendarEventId = meetResult.calendarEventId;

            if (body.generate_meet_link && !meetLink) {
                console.warn('Meeting created but Google Meet link was not generated');
            }
        }

        // Insert meeting into database
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .insert([{
                title: body.title,
                description: body.description || null,
                organizer_id: user.id,
                start_time: startDateTime,
                end_time: endDateTime,
                timezone,
                meeting_link: meetLink,
                calendar_event_id: calendarEventId,
                status: 'scheduled',
                recurrence: body.recurrence || 'none',
                location: body.location || null,
                color: body.color || '#3b82f6',
                lead_id: body.lead_id || null,
            }])
            .select()
            .single();

        if (meetingError) {
            console.error('Error creating meeting:', meetingError);
            return NextResponse.json({ error: meetingError.message }, { status: 500 });
        }

        // Insert organizer as participant
        const participantsToInsert = [{
            meeting_id: meeting.id,
            user_id: user.id,
            role: 'organizer',
            rsvp_status: 'accepted',
        }];

        // Insert other participants (excluding organizer if already in list)
        if (body.participants?.length > 0) {
            for (const p of body.participants) {
                if (p.user_id === user.id) continue; // Skip if it's the organizer

                participantsToInsert.push({
                    meeting_id: meeting.id,
                    user_id: p.user_id || null,
                    email: p.email || null,
                    name: p.name || null,
                    role: p.role || 'required',
                    rsvp_status: 'pending',
                } as typeof participantsToInsert[0]);
            }
        }

        const { error: participantError } = await supabase
            .from('meeting_participants')
            .insert(participantsToInsert);

        if (participantError) {
            console.error('Error adding participants:', participantError);
        }

        // Create in-app notifications for each participant
        const notificationsToInsert = (body.participants || [])
            .filter((p: { user_id?: string }) => p.user_id)
            .map((p: { user_id: string }) => ({
                user_id: p.user_id,
                title: 'Meeting Invitation',
                message: `You've been invited to "${body.title}" on ${body.start_date} at ${body.start_time}`,
                type: 'meeting_invite',
                related_id: meeting.id,
            }));

        if (notificationsToInsert.length > 0) {
            await supabase.from('notifications').insert(notificationsToInsert);
        }

        // Fetch the full meeting with relations
        const { data: fullMeeting } = await supabase
            .from('meetings')
            .select(`
        *,
        organizer:users!organizer_id(id, name, email, avatar_url),
        participants:meeting_participants(
          id, user_id, email, name, role, rsvp_status, invited_at, responded_at,
          user:users(id, name, email, avatar_url)
        ),
        lead:leads(id, name, company_name)
      `)
            .eq('id', meeting.id)
            .single();

        return NextResponse.json({ data: fullMeeting }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/meetings:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}


