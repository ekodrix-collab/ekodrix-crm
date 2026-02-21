'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Mail,
    Shield,
    Phone,
    Settings as SettingsIcon,
    Users,
    ChevronRight,
    Bell,
    Lock,
    Globe,
    AlertCircle,
    Camera,
    Palette,
    Monitor,
    ShieldCheck,
} from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeamManagementPage from './team/page';

export default function SettingsPage() {
    const { user, isAdmin, loading } = useUser();
    const [activeTab, setActiveTab] = useState('profile');

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-accent"></div>
                    <div className="absolute top-0 h-12 w-12 rounded-full border-4 border-t-primary animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4 sm:px-6">
            {/* Header with Glassmorphism feel */}
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-primary-foreground/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className={`${getAvatarColor(user.name)} text-4xl text-primary-foreground`}>
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <button className="absolute bottom-1 right-1 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg transition-all group-hover:scale-110 border-2 border-primary">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-center md:text-left space-y-3">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight capitalize text-white">{user.name}</h1>
                            {isAdmin && (
                                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                                    ADMINSTRATOR
                                </Badge>
                            )}
                        </div>
                        <p className="text-primary-foreground/80 font-medium flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" />
                            {user.email}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                            <Button size="sm" className="bg-white text-primary hover:bg-emerald-50 rounded-full font-bold px-6 shadow-md">
                                Update Photo
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10 rounded-full font-bold px-6">
                                View Public Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <Tabs defaultValue="profile" className="space-y-8" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between border-b border-border pb-2 overflow-x-auto">
                    <TabsList className="bg-transparent h-auto p-0 gap-8 justify-start">
                        <TabsTrigger
                            value="profile"
                            className="bg-transparent border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary text-muted-foreground font-bold transition-all"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Account Profile
                        </TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger
                                value="team"
                                className="bg-transparent border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary text-muted-foreground font-bold transition-all"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Team Access
                            </TabsTrigger>
                        )}
                        <TabsTrigger
                            value="security"
                            className="bg-transparent border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary text-muted-foreground font-bold transition-all"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger
                            value="preferences"
                            className="bg-transparent border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary text-muted-foreground font-bold transition-all"
                        >
                            <Palette className="w-4 h-4 mr-2" />
                            General
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-border shadow-xl shadow-accent/50 dark:shadow-none overflow-hidden rounded-2xl">
                                <CardHeader className="bg-accent/30 border-b border-border">
                                    <CardTitle className="text-lg">Personal Details</CardTitle>
                                    <CardDescription>Update your basic information to stay current.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                                            <Input defaultValue={user.name} className="bg-background border-border h-11 focus:ring-2 focus:ring-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                                            <Input defaultValue={user.email} disabled className="bg-accent/50 border-border h-11 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone number</label>
                                            <Input defaultValue={user.phone || ''} placeholder="+91..." className="bg-background border-border h-11 focus:ring-2 focus:ring-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Job Title</label>
                                            <Input placeholder="e.g. CEO, Sales Manager" className="bg-background border-border h-11 focus:ring-2 focus:ring-primary" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-full font-bold">Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-2xl">
                                <CardHeader className="bg-accent/30 border-b border-border">
                                    <CardTitle className="text-lg">About Me</CardTitle>
                                    <CardDescription>A brief description for your profile.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <textarea
                                        className="w-full min-h-[120px] rounded-xl border border-border bg-background p-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Tell your team about yourself..."
                                    />
                                    <div className="flex justify-end mt-4">
                                        <Button variant="outline" className="rounded-full px-8 font-bold border-border">Update Bio</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="border-primary/20 bg-primary/5 rounded-2xl overflow-hidden shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        Verification Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-sm font-semibold text-foreground">Account Verified</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                        Your account is fully verified and compliant with all security standards.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border rounded-2xl overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Connect Apps</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg">
                                                <Globe className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="text-sm font-bold">Google Calendar</span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10">Connected</Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg">
                                                <Mail className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="text-sm font-bold">Outlook</span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-slate-400 font-bold">Connect</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <TeamManagementPage />
                    </TabsContent>
                )}

                <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-border shadow-xl shadow-accent/50 dark:shadow-none overflow-hidden rounded-2xl">
                        <CardHeader className="bg-accent/30 border-b border-border">
                            <CardTitle className="text-lg">Change Password</CardTitle>
                            <CardDescription>Keep your account secure with a strong password.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Password</label>
                                    <Input type="password" placeholder="••••••••" className="bg-background border-border h-11" />
                                </div>
                                <div className="hidden sm:block"></div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</label>
                                    <Input type="password" placeholder="••••••••" className="bg-background border-border h-11" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
                                    <Input type="password" placeholder="••••••••" className="bg-background border-border h-11" />
                                </div>
                            </div>
                            <div className="flex justify-start pt-4">
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 rounded-full font-bold">Update Password</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-50 dark:border-red-900/20 bg-red-50/10 dark:bg-red-900/5 rounded-2xl overflow-hidden shadow-sm">
                        <CardHeader className="pb-3 border-b border-red-50 dark:border-red-900/20 mb-4">
                            <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                                <AlertCircle className="w-5 h-5" />
                                Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground text-center sm:text-left">Delete Account</p>
                                <p className="text-xs text-muted-foreground text-center sm:text-left max-w-md">
                                    Once you delete your account, there is no going back. All your data will be permanently removed from our servers.
                                </p>
                            </div>
                            <Button variant="destructive" className="rounded-full w-full sm:w-auto px-8 font-bold">Deactivate My Account</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-border shadow-xl shadow-accent/50 dark:shadow-none overflow-hidden rounded-2xl">
                        <CardHeader className="bg-accent/30 border-b border-border">
                            <CardTitle className="text-lg">System Preferences</CardTitle>
                            <CardDescription>Tailor the CRM experience to your workflow.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-1">
                            <div className="flex items-center justify-between py-6 border-b border-border last:border-0 hover:bg-accent/30 px-4 -mx-4 rounded-xl transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-muted-foreground/60" />
                                        <p className="text-sm font-bold">Theme Appearance</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Switch between light and dark modes.</p>
                                </div>
                                <div className="flex bg-accent p-1 rounded-full w-40">
                                    <Button variant="ghost" size="sm" className="rounded-full flex-1 h-8 text-[10px] uppercase font-bold bg-background shadow-sm border border-border">Auto</Button>
                                    <Button variant="ghost" size="sm" className="rounded-full flex-1 h-8 text-[10px] uppercase font-bold text-muted-foreground/40">Dark</Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-6 border-b border-border last:border-0 hover:bg-accent/30 px-4 -mx-4 rounded-xl transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-muted-foreground/60" />
                                        <p className="text-sm font-bold">Email Notifications</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Manage how you receive alerts and updates.</p>
                                </div>
                                <div className="w-12 h-6 bg-primary rounded-full flex items-center justify-end px-1 cursor-pointer">
                                    <div className="h-4 w-4 bg-primary-foreground rounded-full"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-6 border-b border-border last:border-0 hover:bg-accent/30 px-4 -mx-4 rounded-xl transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-muted-foreground/60" />
                                        <p className="text-sm font-bold">Language & Region</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Set your local language and timezone.</p>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2 h-9 text-xs font-bold rounded-full px-6 border-border">
                                    English (US)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
