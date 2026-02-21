import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { UserProvider } from '@/components/providers/user-provider';
import { PendingApproval } from '@/components/layout/pending-approval';
import { redirect } from 'next/navigation';
import type { User } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get authenticated user from Supabase Auth on the server
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Fetch full user profile on the server
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  const userProfile = (profile as User) || {
    id: authUser.id,
    email: authUser.email || '',
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    role: 'member',
    is_active: true,
    daily_target: 10,
    created_at: authUser.created_at,
    updated_at: authUser.updated_at || authUser.created_at,
  };

  return (
    <UserProvider initialUser={userProfile}>
      {!userProfile.is_active ? (
        <PendingApproval user={userProfile} />
      ) : (
        <div className="min-h-screen bg-background">
          {/* Desktop Sidebar - Hidden on mobile */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="lg:pl-72">
            {/* Header */}
            <Header />

            {/* Page Content */}
            <main className="min-h-[calc(100vh-4rem)]">
              <div className="p-4 lg:p-6 pb-24 lg:pb-6">
                {children}
              </div>
            </main>
          </div>

          {/* Mobile Bottom Navigation - Visible only on mobile */}
          <MobileNav />
        </div>
      )}
    </UserProvider>
  );
}