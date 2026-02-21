'use client';

import { Button } from '@/components/ui/button';
import { Phone, MessageCircle } from 'lucide-react';
import { openWhatsApp, openPhoneDialer } from '@/lib/utils';

interface LeadActionButtonsProps {
    phone?: string | null;
    whatsappNumber?: string | null;
}

export function LeadActionButtons({ phone, whatsappNumber }: LeadActionButtonsProps) {
    return (
        <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {phone && (
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openPhoneDialer(phone);
                    }}
                >
                    <Phone className="w-4 h-4 text-primary" />
                </Button>
            )}
            {(whatsappNumber || phone) && (
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openWhatsApp(whatsappNumber || phone!);
                    }}
                >
                    <MessageCircle className="w-4 h-4 text-green-500" />
                </Button>
            )}
        </div>
    );
}
