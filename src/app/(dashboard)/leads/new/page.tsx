import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LeadForm } from '@/components/leads/lead-form';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function NewLeadPage() {
  const supabase = await createClient();
  
  // Fetch team members for assignment
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, role, is_active, daily_target, created_at, updated_at, avatar_url')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Add New Lead
          </h1>
          <p className="text-slate-500">Enter the lead details below</p>
        </div>
      </div>

      <LeadForm users={users || []} />
    </div>
  );
}