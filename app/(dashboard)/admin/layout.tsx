import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/roster")
  }

  return (
    <div>
      <div className="mb-6 flex gap-4 border-b pb-4">
        <Link href="/admin/wrestlers">
          <Button variant="outline">Wrestlers</Button>
        </Link>
        <Link href="/admin/matches">
          <Button variant="outline">Matches</Button>
        </Link>
      </div>
      {children}
    </div>
  )
}
