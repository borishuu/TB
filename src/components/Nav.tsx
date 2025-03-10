'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';


const NAV_ITEMS_PUBLIC = [
  { href: '/', label: 'Home' },
];

const NAV_ITEMS_DISCONNECTED = [
    { href: '/login', label: 'Login' },
    { href: '/register', label: 'Register' },
]

const NAV_ITEMS_CONNECTED = [
    { href: '/quiz', label: 'Generate Quiz' },
]

const NavLink = ({ href, label, isActive }: { href: string; label: string; isActive: boolean }) => (
  <Link
    href={href}
    className={`text-center transition-transform duration-300 ${isActive ? 'font-bold transform scale-120' : 'text-base'}`}
    //style={{ color: isActive ? '#660099' : '#000000' }}
  >
    {label}
  </Link>
);

export default function Nav() {
    const pathname = usePathname();
  
    return (
      <nav
        className="fixed top-0 left-0 w-full bg-[#3e4756] text-white shadow-md z-50 py-4 px-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side */}
          <Link href="/" className="text-2xl font-bold">
            Quiz Generator
          </Link>
  
          {/* Right side */}
          <div className="flex items-center space-x-8">
            {NAV_ITEMS_PUBLIC.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                isActive={pathname === href}
              />
            ))}

            {NAV_ITEMS_DISCONNECTED.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                isActive={pathname === href}
              />
            ))}

            {NAV_ITEMS_CONNECTED.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                isActive={pathname === href}
              />
            ))}
          </div>
        </div>
      </nav>
    );
  }
  
