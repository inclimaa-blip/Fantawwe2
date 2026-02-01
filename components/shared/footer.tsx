export function Footer() {
  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FantaWWE. All rights reserved.</p>
        <p className="mt-1">
          Not affiliated with WWE. Match ratings sourced from Cagematch.net.
        </p>
      </div>
    </footer>
  )
}
