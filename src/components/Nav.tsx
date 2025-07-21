'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/eval', label: 'Mes Évaluations' },
  { href: '/files', label: 'Mes Fichiers' },
];

const NavLink = ({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) => (
  <Link
    href={href}
    aria-current={isActive ? 'page' : undefined}
    className={`relative text-sm md:text-base transition-all duration-300 font-medium hover:text-white/90 ${
      isActive
        ? 'text-white font-semibold after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[2px] after:bg-white after:rounded'
        : 'text-white/70'
    }`}
  >
    {label}
  </Link>
);

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#2f3644] text-white shadow-lg z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto py-4 px-6">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity"
        >
          Evagen
        </Link>

        <div className="hidden md:flex items-center space-x-10">
          {NAV_ITEMS.map(({ href, label }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              isActive={pathname.startsWith(href)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
