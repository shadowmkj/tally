import type { Metadata } from 'next';
import './globals.css';
import { LayoutShell } from '@/components/LayoutShell';
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

export const metadata: Metadata = {
    title: 'WECODE GCEK | Coding Competition Platform',
    description: 'Real-time online judge and competitive programming platform for Wecode GCEK.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={cn("dark", "font-mono", jetbrainsMono.variable)}>
            <body className="bg-zinc-950 text-zinc-100 font-sans antialiased">
                <LayoutShell>{children}</LayoutShell>
            </body>
        </html>
    );
}
