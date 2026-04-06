import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HomeForge - Floorplan Planner',
  description: 'Upload your floorplan. Move walls. Place furniture. Done.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
