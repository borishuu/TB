'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {useRouter} from "next/navigation";

const NAV_ITEMS = [
  { href: '/eval', label: 'Mes Evaluations' },
  { href: '/files', label: 'Mes Fichiers' },
];

const NavLink = ({ href, label, isActive }: { href: string; label: string; isActive: boolean }) => (
  <Link
    href={href}
    className={`text-center transition-transform duration-300 ${isActive ? 'font-bold transform scale-120' : 'text-base'}`}
  >
    {label}
  </Link>
);

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="absolute top-0 left-0 w-full bg-[#3e4756] text-white shadow-md z-50 py-4 px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side */}
        <Link href="/" className="text-2xl font-bold">
          Evagen
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-8">
          {NAV_ITEMS.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} isActive={pathname.startsWith(href)} />
          ))}
        </div>
      </div>
    </nav>
  );
}
