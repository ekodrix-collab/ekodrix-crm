import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isPast,
  isTomorrow,
  differenceInDays,
  parseISO
} from 'date-fns';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';

  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isTomorrow(d)) return 'Tomorrow';

  const daysDiff = differenceInDays(new Date(), d);

  if (daysDiff > 0 && daysDiff <= 7) {
    return `${daysDiff} days ago`;
  }

  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPast(d) && !isToday(d);
}

export function isDueToday(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
}

export function isDueSoon(date: string | Date | null | undefined, days: number = 3): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diff = differenceInDays(d, new Date());
  return diff >= 0 && diff <= days;
}

// Currency formatting
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'INR'
): string {
  if (amount === null || amount === undefined) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(
  amount: number | null | undefined,
  currency: string = 'INR'
): string {
  if (amount === null || amount === undefined) return '₹0';

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
}


// Phone number formatting
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A';

  // Remove all non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Handle +91 numbers (Indian standard)
  if (cleaned.startsWith('+91')) {
    const raw = cleaned.slice(3);
    if (raw.length === 10) {
      return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
    }
    return cleaned;
  }

  // Handle 10-digit numbers (assume Indian/local if no prefix)
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  // Handle 11-digit numbers starting with 91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  // Return original if no specific rule matches
  return phone;
}

// Get initials from name
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??';

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Truncate text
export function truncate(text: string | null | undefined, length: number = 50): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

// Capitalize first letter
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Generate random color for avatars
export function getAvatarColor(name: string | null | undefined): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  if (!name) return colors[0];

  // Generate consistent color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Sleep function for delays
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

// Open WhatsApp chat
export function openWhatsApp(phone: string, message?: string): void {
  const cleaned = phone.replace(/\D/g, '');
  const url = message
    ? `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${cleaned}`;
  window.open(url, '_blank');
}

// Open phone dialer
export function openPhoneDialer(phone: string): void {
  window.location.href = `tel:${phone}`;
}

// Open email client
export function openEmailClient(email: string, subject?: string, body?: string): void {
  let url = `mailto:${email}`;
  const params: string[] = [];

  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);

  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  window.location.href = url;
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Extracts an Instagram username from a profile URL or pattern.
 * Examples:
 * - https://www.instagram.com/sanaa.nasrin?igsh=... -> sanaa.nasrin
 * - instagram.com/sanaa.nasrin -> sanaa.nasrin
 * - @sanaa.nasrin -> sanaa.nasrin
 */
export function extractInstagramUsername(input: string): string {
  if (!input) return '';

  let username = input.trim();

  // Remove URL prefix if present
  try {
    if (username.toLowerCase().includes('instagram.com')) {
      // Handle URLs like https://www.instagram.com/username...
      const url = username.startsWith('http') ? username : `https://${username}`;
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        // Special case for instagram.com/reels/..., instagram.com/p/..., etc.
        const servicePaths = [
          'reels',
          'p',
          'stories',
          'explore',
          'direct',
          'share',
          'profile',
        ];
        if (
          servicePaths.includes(pathParts[0].toLowerCase()) &&
          pathParts.length > 1
        ) {
          username = pathParts[1];
        } else {
          username = pathParts[0];
        }
      }
    }
  } catch (e) {
    // If URL parsing fails, fallback to regex
    const match = username.match(/instagram\.com\/([^/ ?#&]+)/i);
    if (match && match[1]) {
      username = match[1];
    }
  }

  // Remove @ if present
  if (username.startsWith('@')) {
    username = username.substring(1);
  }

  // Remove any remaining query params if they weren't caught by URL parser
  // and handle trailing slashes
  username = username.split('?')[0].split('/')[0];

  return username;
}