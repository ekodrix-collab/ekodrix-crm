import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to Agency CRM',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle modern background elements using standard primary colors */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px] pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center text-center pointer-events-none z-10">
        <span className="text-sm font-bold leading-none text-slate-800 dark:text-slate-200">Ekodrix CRM</span>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1.5">
          Secure Access
        </span>
      </div>
    </div>
  );
}