"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/roadmap", label: "Roadmap" },
  { href: "/feedback", label: "Feedback" },
  { href: "/concepts", label: "Concepts" },
]

export default function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-4 text-sm">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={isActive ? "font-semibold text-gray-900" : "text-blue-700 hover:underline"}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
