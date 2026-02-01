import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">FantaWWE</h1>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          The Ultimate Fantasy Wrestling Game
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Draft your favorite WWE Superstars, set your weekly lineup, and compete
          against friends based on real match performances.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Join a League
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Draft Your Roster</CardTitle>
              <CardDescription>
                Build your team through our auction draft system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Start with 100 points and bid on your favorite WWE Superstars.
                Build a roster of 12 wrestlers to compete throughout the quarter.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Set Your Lineup</CardTitle>
              <CardDescription>
                Choose your starters and captain each week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Select 6 starters and 4 reserves before Monday&apos;s Raw. Pick a
                captain to earn 1.5x points on their performance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Points</CardTitle>
              <CardDescription>
                Earn points based on real match ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Points are calculated from Cagematch ratings, victories, title
                matches, main events, and more. Track your standings weekly.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Scoring Highlights */}
      <section className="container mx-auto px-4 py-16 bg-muted/50 rounded-lg">
        <h3 className="text-3xl font-bold text-center mb-12">Scoring System</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-primary mb-2">2x</div>
            <p className="text-sm text-muted-foreground">
              Base points per star rating
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-primary mb-2">+4</div>
            <p className="text-sm text-muted-foreground">
              World title match bonus
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-primary mb-2">+3</div>
            <p className="text-sm text-muted-foreground">
              Main event bonus
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-primary mb-2">1.5x</div>
            <p className="text-sm text-muted-foreground">
              Captain multiplier
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to Play?</h3>
        <p className="text-muted-foreground mb-8">
          Create your account and join a league today!
        </p>
        <Link href="/register">
          <Button size="lg">Create Free Account</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FantaWWE. All rights reserved.</p>
          <p className="text-sm mt-2">
            Not affiliated with WWE. Match ratings sourced from Cagematch.net.
          </p>
        </div>
      </footer>
    </div>
  )
}
