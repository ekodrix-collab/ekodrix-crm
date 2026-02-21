'use client';

import { useState } from 'react';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Check, Plus, X, Mail, User as UserIcon } from 'lucide-react';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { ParticipantRole } from '@/types';

interface ParticipantSelectorProps {
    users: User[];
    selectedParticipants: {
        user_id?: string;
        email?: string;
        name?: string;
        role: ParticipantRole;
    }[];
    onChange: (participants: any[]) => void;
}

export function ParticipantSelector({
    users,
    selectedParticipants,
    onChange,
}: ParticipantSelectorProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddUser = (user: User) => {
        if (selectedParticipants.some((p) => p.user_id === user.id)) return;
        onChange([...selectedParticipants, { user_id: user.id, name: user.name, email: user.email, role: 'required' }]);
        setOpen(false);
    };

    const handleAddGuest = (input: string) => {
        if (!input) return;

        // If it's an email, use it. If not, treat title case name
        const isEmail = input.includes('@');
        const name = isEmail ? input.split('@')[0] : input;
        const email = isEmail ? input : null;

        if (selectedParticipants.some((p) => (email && p.email === email) || (p.name === name))) return;

        onChange([...selectedParticipants, {
            email: email,
            name: name,
            role: 'required'
        }]);
        setSearchQuery('');
        setOpen(false);
    };

    const handleRemove = (index: number) => {
        const newParticipants = [...selectedParticipants];
        newParticipants.splice(index, 1);
        onChange(newParticipants);
    };

    const handleToggleRole = (index: number) => {
        const newParticipants = [...selectedParticipants];
        newParticipants[index].role = newParticipants[index].role === 'required' ? 'optional' : 'required';
        onChange(newParticipants);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {selectedParticipants.map((participant, index) => {
                    const user = participant.user_id ? users.find(u => u.id === participant.user_id) : null;

                    return (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="pl-1 py-1 pr-1 h-auto flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        >
                            <Avatar className="w-5 h-5">
                                <AvatarImage src={user?.avatar_url || undefined} />
                                <AvatarFallback className={cn(getAvatarColor(participant.name || 'P'), 'text-[8px] text-white')}>
                                    {getInitials(participant.name || 'P')}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium max-w-[120px] truncate">
                                {participant.name}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-4 h-4 rounded-full p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => handleToggleRole(index)}
                                title={participant.role === 'required' ? 'Required' : 'Optional'}
                            >
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    participant.role === 'required' ? "bg-blue-500" : "bg-slate-400"
                                )} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-4 h-4 rounded-full p-0 hover:bg-red-100 hover:text-red-500"
                                onClick={() => handleRemove(index)}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </Badge>
                    );
                })}

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-dashed bg-transparent hover:bg-slate-50"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Participant
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={true}>
                            <CommandInput
                                placeholder="Search team or enter guest..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="h-9"
                            >
                                {searchQuery.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="h-7 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white shrink-0 uppercase font-bold tracking-wider"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAddGuest(searchQuery);
                                        }}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        New
                                    </Button>
                                )}
                            </CommandInput>
                            <CommandList>
                                <CommandGroup heading="Quick Add Guest">
                                    {searchQuery.length > 0 && !users.some(u => u.name.toLowerCase() === searchQuery.toLowerCase() || u.email.toLowerCase() === searchQuery.toLowerCase()) && (
                                        <CommandItem
                                            onSelect={() => handleAddGuest(searchQuery)}
                                            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add "{searchQuery}" as guest</span>
                                        </CommandItem>
                                    )}
                                </CommandGroup>

                                <CommandEmpty>
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-slate-500 mb-2">No team member found.</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full h-8 text-xs"
                                            onClick={() => handleAddGuest(searchQuery)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add as guest
                                        </Button>
                                    </div>
                                </CommandEmpty>
                                <CommandGroup heading="Team Members">
                                    {users.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            value={user.name}
                                            onSelect={() => handleAddUser(user)}
                                            className="flex items-center gap-2"
                                        >
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback className={cn(getAvatarColor(user.name), 'text-[10px] text-white')}>
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{user.name}</span>
                                                <span className="text-xs text-slate-500">{user.email}</span>
                                            </div>
                                            {selectedParticipants.some(p => p.user_id === user.id) && (
                                                <Check className="w-4 h-4 ml-auto text-blue-500" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedParticipants.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                    No participants added yet. The organizer is added automatically.
                </p>
            )}
        </div>
    );
}
