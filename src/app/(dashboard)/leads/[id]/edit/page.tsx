import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LeadForm } from '@/components/leads/lead-form';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

interface EditLeadPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: EditLeadPageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data: lead } = await supabase
        .from('leads')
        .select('name')
        .eq('id', id)
        .single();

    if (!lead) {
        return { title: 'Lead Not Found' };
    }

    return {
        title: `Edit Lead: ${lead.name}`,
    };
}

async function getLead(id: string) {
    const supabase = await createClient();
    const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !lead) {
        return null;
    }

    return lead;
}

export default async function EditLeadPage({ params }: EditLeadPageProps) {
    const { id } = await params;
    const lead = await getLead(id);

    if (!lead) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/leads/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Edit Lead: {lead.name}
                    </h1>
                    <p className="text-slate-500">Update the lead details below</p>
                </div>
            </div>

            <LeadForm initialData={lead} isEdit />
        </div>
    );
}
