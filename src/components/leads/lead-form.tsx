'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { leadSchema, type LeadFormValues } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { DuplicateAlert } from '@/components/leads/duplicate-alert';
import { useDuplicateCheck } from '@/hooks/use-leads';
import {
    User,
    Building,
    Phone,
    Mail,
    Instagram,
    MessageCircle,
    Globe,
    Linkedin,
    Save,
    Loader2,
} from 'lucide-react';
import { debounce, extractInstagramUsername } from '@/lib/utils';
import { LEAD_SOURCES, PROJECT_TYPES, BUDGET_RANGES, PRIORITIES } from '@/lib/constants';
import type { User as UserType, Lead } from '@/types';

interface LeadFormProps {
    initialData?: Lead;
    isEdit?: boolean;
}

export function LeadForm({ initialData, isEdit = false }: LeadFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<UserType[]>([]);
    const { checking, duplicate, checkDuplicate, clearDuplicate } = useDuplicateCheck();

    // Initialize form
    const form = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema) as Resolver<LeadFormValues>,
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            company_name: initialData?.company_name || '',
            designation: initialData?.designation || '',
            instagram_handle: initialData?.instagram_handle || '',
            whatsapp_number: initialData?.whatsapp_number || '',
            facebook_url: initialData?.facebook_url || '',
            linkedin_url: initialData?.linkedin_url || '',
            website: initialData?.website || '',
            source: initialData?.source || (undefined as any),
            source_details: initialData?.source_details || '',
            project_type: initialData?.project_type || '',
            budget_range: initialData?.budget_range || '',
            timeline: initialData?.timeline || '',
            requirements: initialData?.requirements || '',
            assigned_to: initialData?.assigned_to || '',
            priority: (initialData?.priority as any) || 'warm',
            tags: initialData?.tags || [],
        },
    });

    // Fetch team members
    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('is_active', true)
                .order('name');
            setUsers((data as any) || []);
        };
        fetchUsers();
    }, [supabase]);

    // Debounced duplicate check
    const debouncedDuplicateCheck = useCallback(
        debounce(async (field: any, value: any) => {
            if (value && value.trim()) {
                const checkData = {
                    [field]: value,
                    exclude_id: isEdit ? initialData?.id : undefined
                };
                await checkDuplicate(checkData);
            }
        }, 500),
        [checkDuplicate, isEdit, initialData?.id]
    );

    // Handle field blur for duplicate check
    const handleFieldBlur = (field: string, value: string) => {
        if (['phone', 'email', 'instagram_handle', 'whatsapp_number'].includes(field)) {
            debouncedDuplicateCheck(field, value);
        }
    };

    // Handle form submission
    const onSubmit = async (data: LeadFormValues) => {
        // Check for duplicates one more time before submitting
        if (data.phone || data.email || data.instagram_handle || data.whatsapp_number) {
            const result = await checkDuplicate({
                phone: data.phone,
                email: data.email,
                instagram_handle: data.instagram_handle,
                whatsapp_number: data.whatsapp_number,
                exclude_id: isEdit ? initialData?.id : undefined,
            });

            if (result?.isDuplicate) {
                toast({
                    title: 'Duplicate Found',
                    description: 'A lead with this contact information already exists.',
                    variant: 'destructive',
                });
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const url = isEdit ? `/api/leads/${initialData?.id}` : '/api/leads';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to ${isEdit ? 'update' : 'create'} lead`);
            }

            toast({
                title: `Lead ${isEdit ? 'Updated' : 'Created'}`,
                description: `${data.name} has been ${isEdit ? 'updated' : 'added'} successfully.`,
            });

            router.push(`/leads/${isEdit ? initialData?.id : result.data.id}`);
            router.refresh();
        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'creating'} lead:`, error);
            const errorMessage = error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} lead`;
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Duplicate Alert */}
            {duplicate?.isDuplicate && (
                <DuplicateAlert
                    existingLead={duplicate.existingLead as any}
                    matchedField={duplicate.matchedField || 'contact'}
                    message={duplicate.message || 'Duplicate found'}
                    onDismiss={clearDuplicate}
                />
            )}

            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Smith" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="+1 234 567 890"
                                                    className="pl-10"
                                                    {...field}
                                                    onBlur={(e) => {
                                                        field.onBlur();
                                                        handleFieldBlur('phone', e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    className="pl-10"
                                                    {...field}
                                                    onBlur={(e) => {
                                                        field.onBlur();
                                                        handleFieldBlur('email', e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="Acme Corp"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="designation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Designation</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CEO / Manager" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Social Handles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Instagram className="w-5 h-5 text-pink-500" />
                                Social Handles
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="instagram_handle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instagram</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                                <Input
                                                    placeholder="@username"
                                                    className="pl-10"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Automatically extract username if it looks like a URL or @handle
                                                        if (value.includes('instagram.com') || value.startsWith('@')) {
                                                            field.onChange(extractInstagramUsername(value));
                                                        } else {
                                                            field.onChange(value);
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        field.onBlur();
                                                        const extracted = extractInstagramUsername(e.target.value);
                                                        if (extracted !== e.target.value) {
                                                            field.onChange(extracted);
                                                        }
                                                        handleFieldBlur('instagram_handle', extracted);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="whatsapp_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                                <Input
                                                    placeholder="+1 234 567 890"
                                                    className="pl-10"
                                                    {...field}
                                                    onBlur={(e) => {
                                                        field.onBlur();
                                                        handleFieldBlur('whatsapp_number', e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="linkedin_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>LinkedIn URL</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700" />
                                                <Input
                                                    placeholder="linkedin.com/in/username"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    placeholder="www.example.com"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Source & Assignment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Source & Assignment</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lead Source *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select source" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(LEAD_SOURCES).map(([key, { label }]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="assigned_to"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign To</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select team member" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(PRIORITIES).map(([key, { label, emoji }]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {emoji} {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="source_details"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source Details</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Campaign name, post URL, etc."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Project Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="project_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PROJECT_TYPES.map(({ value, label }) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="budget_range"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Budget Range</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select budget" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {BUDGET_RANGES.map(({ value, label }) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="requirements"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Requirements / Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the project requirements..."
                                                rows={4}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href={isEdit ? `/leads/${initialData?.id}` : '/leads'}>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isSubmitting || (duplicate?.isDuplicate && !isEdit)}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isEdit ? 'Update Lead' : 'Create Lead'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
