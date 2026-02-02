"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Profile {
  id: string
  username: string
  role: string
}

interface NavbarProps {
  user: User
  profile: Profile | null
}

export function Navbar({ user, profile }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isAdmin = profile?.role === "admin"
  const isManager = profile?.role === "general_manager"
  const canAccessAdmin = isAdmin || isManager

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/roster" className="font-bold text-xl">
            FantaWWE
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/leagues"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Leagues
            </Link>
            <Link
              href="/roster"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Roster
            </Link>
            <Link
              href="/lineup"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Lineup
            </Link>
            <Link
              href="/draft"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Draft
            </Link>
            <Link
              href="/standings"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Standings
            </Link>
            {canAccessAdmin && (
              <Link
                href={isAdmin ? "/admin/wrestlers" : "/admin/leagues"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative">
                {profile?.username || user.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/leagues">Leagues</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/roster">Roster</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/lineup">Lineup</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/draft">Draft</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/standings">Standings</Link>
              </DropdownMenuItem>
              {canAccessAdmin && (
                <DropdownMenuItem asChild className="md:hidden">
                  <Link href={isAdmin ? "/admin/wrestlers" : "/admin/leagues"}>Admin</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
