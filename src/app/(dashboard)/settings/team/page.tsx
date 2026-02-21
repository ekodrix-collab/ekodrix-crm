'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    Users,
    Mail,
    Shield,
    Trash2,
    Loader2,
    AlertCircle,
    MoreVertical,
    Search,
    CheckCircle2,
    ArrowRight,
    UserPlus,
    UserCheck,
    Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { approveUserAction, deleteUserAction } from '@/lib/actions/user-actions';
import type { User } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function TeamManagementPage() {
    const { user: currentUser, isAdmin } = useUser();
    const supabase = createClient();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active');

    // UI States
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data as User[]);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [supabase]);

    const handleApproveUser = async (userId: string) => {
        setIsApproving(userId);
        setError(null);
        setSuccess(null);

        const result = await approveUserAction(userId);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess('User approved successfully! They can now access the dashboard.');
            fetchUsers();
        }
        setIsApproving(null);
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === currentUser?.id) {
            setError("You cannot delete your own account.");
            return;
        }

        if (!confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(userId);
        const result = await deleteUserAction(userId);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess('User removed successfully.');
            fetchUsers();
        }
        setIsDeleting(null);
    };

    const pendingUsers = users.filter(u => !u.is_active);
    const activeUsers = users.filter(u => u.is_active);

    const filteredUsers = (activeTab === 'active' ? activeUsers : pendingUsers).filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 text-center">
                <Shield className="w-16 h-16 text-slate-200" />
                <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
                <p className="text-slate-500 max-w-sm">
                    Only administrators can manage the team.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        Team Management
                        {pendingUsers.length > 0 && (activeTab !== 'pending') && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 border-none px-2 text-[10px] h-5">
                                {pendingUsers.length} PENDING
                            </Badge>
                        )}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Manage access and permissions for your agency members.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search members..."
                        className="pl-11 h-12 bg-background border-border rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent h-auto p-0 gap-8 justify-start border-b border-slate-100 dark:border-slate-800 w-full rounded-none mb-6">
                    <TabsTrigger
                        value="active"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all"
                    >
                        Active Members ({activeUsers.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="pending"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all"
                    >
                        Pending Access ({pendingUsers.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <UserTable
                        users={filteredUsers}
                        loading={loading}
                        isApproving={isApproving}
                        isDeleting={isDeleting}
                        currentUser={currentUser}
                        onApprove={handleApproveUser}
                        onDelete={handleDeleteUser}
                        error={error}
                        success={success}
                        type="active"
                    />
                </TabsContent>

                <TabsContent value="pending" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <UserTable
                        users={filteredUsers}
                        loading={loading}
                        isApproving={isApproving}
                        isDeleting={isDeleting}
                        currentUser={currentUser}
                        onApprove={handleApproveUser}
                        onDelete={handleDeleteUser}
                        error={error}
                        success={success}
                        type="pending"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function UserTable({
    users,
    loading,
    isApproving,
    isDeleting,
    currentUser,
    onApprove,
    onDelete,
    error,
    success,
    type
}: any) {
    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-3xl">
            <CardContent className="p-0">
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20 animate-in fade-in">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm font-bold">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    </div>
                )}

                {success && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/20 animate-in fade-in">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            {success}
                        </div>
                    </div>
                )}

                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="h-14 px-6 text-left align-middle font-bold text-slate-500 uppercase tracking-widest text-[10px]">User Profile</th>
                                <th className="h-14 px-6 text-left align-middle font-bold text-slate-500 uppercase tracking-widest text-[10px]">Requested Date</th>
                                <th className="h-14 px-6 text-left align-middle font-bold text-slate-500 uppercase tracking-widest text-[10px]">Role</th>
                                <th className="h-14 px-6 text-right align-middle font-bold text-slate-500 uppercase tracking-widest text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="h-64 text-center">
                                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600/30" />
                                        <p className="mt-4 text-slate-400 font-medium">Retrieving member data...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="h-40 text-center text-slate-400 font-medium">
                                        No {type} members found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user: User) => (
                                    <tr key={user.id} className="group hover:bg-muted/50 transition-all">
                                        <td className="px-6 py-5 align-middle">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform">
                                                    <AvatarImage src={user.avatar_url || ''} />
                                                    <AvatarFallback className={`${getAvatarColor(user.name)} text-white font-black`}>
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base tracking-tight">
                                                        {user.name}
                                                        {user.id === currentUser?.id && (
                                                            <Badge variant="secondary" className="text-[10px] h-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black border-none px-2">YOU</Badge>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-semibold">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-middle">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold ml-5">
                                                    {new Date(user.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-middle">
                                            {user.role === 'admin' ? (
                                                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                    ADMIN
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                    MEMBER
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {type === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-widest uppercase h-9 px-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                                        onClick={() => onApprove(user.id)}
                                                        disabled={isApproving === user.id}
                                                    >
                                                        {isApproving === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <UserCheck className="w-3.5 h-3.5 mr-2" />}
                                                        Approve Access
                                                    </Button>
                                                )}

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                            <MoreVertical className="h-5 w-5 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2 gap-1 flex flex-col">
                                                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Account Control</DropdownMenuLabel>
                                                        <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50">
                                                            Modify Permissions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 text-sm font-bold text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                                                            onClick={() => onDelete(user.id)}
                                                            disabled={isDeleting === user.id || user.id === currentUser?.id}
                                                        >
                                                            {isDeleting === user.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                                            {type === 'pending' ? 'Reject Request' : 'Remove from Team'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
