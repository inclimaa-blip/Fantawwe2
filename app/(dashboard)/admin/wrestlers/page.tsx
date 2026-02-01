"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { WWEBrand, WrestlerStatus } from "@/types/database"

const wrestlerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.enum(["raw", "smackdown", "nxt"]),
  status: z.enum(["active", "injured", "released"]).default("active"),
  photo_url: z.string().url().optional().or(z.literal("")),
})

type WrestlerForm = z.infer<typeof wrestlerSchema>

interface Wrestler {
  id: string
  name: string
  brand: WWEBrand
  status: WrestlerStatus
  photo_url: string | null
}

export default function AdminWrestlersPage() {
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWrestler, setEditingWrestler] = useState<Wrestler | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WrestlerForm>({
    resolver: zodResolver(wrestlerSchema),
    defaultValues: {
      status: "active",
    },
  })

  useEffect(() => {
    fetchWrestlers()
  }, [])

  async function fetchWrestlers() {
    const { data, error } = await supabase
      .from("wrestlers")
      .select("*")
      .order("name")

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load wrestlers",
        variant: "destructive",
      })
    } else {
      setWrestlers(data || [])
    }
    setIsLoading(false)
  }

  async function onSubmit(data: WrestlerForm) {
    if (editingWrestler) {
      const { error } = await supabase
        .from("wrestlers")
        .update({
          name: data.name,
          brand: data.brand,
          status: data.status,
          photo_url: data.photo_url || null,
        })
        .eq("id", editingWrestler.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update wrestler",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Wrestler updated successfully",
      })
    } else {
      const { error } = await supabase.from("wrestlers").insert({
        name: data.name,
        brand: data.brand,
        status: data.status,
        photo_url: data.photo_url || null,
      })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create wrestler",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Wrestler created successfully",
      })
    }

    setIsDialogOpen(false)
    setEditingWrestler(null)
    reset()
    fetchWrestlers()
  }

  function openEditDialog(wrestler: Wrestler) {
    setEditingWrestler(wrestler)
    setValue("name", wrestler.name)
    setValue("brand", wrestler.brand)
    setValue("status", wrestler.status)
    setValue("photo_url", wrestler.photo_url || "")
    setIsDialogOpen(true)
  }

  function openCreateDialog() {
    setEditingWrestler(null)
    reset()
    setIsDialogOpen(true)
  }

  async function deleteWrestler(id: string) {
    if (!confirm("Are you sure you want to delete this wrestler?")) return

    const { error } = await supabase.from("wrestlers").delete().eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete wrestler",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: "Wrestler deleted",
    })
    fetchWrestlers()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading wrestlers...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Wrestlers</h1>
          <p className="text-muted-foreground">
            Add, edit, and remove WWE Superstars
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Add Wrestler</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingWrestler ? "Edit Wrestler" : "Add Wrestler"}
              </DialogTitle>
              <DialogDescription>
                {editingWrestler
                  ? "Update wrestler information"
                  : "Add a new WWE Superstar to the database"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Roman Reigns"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={watch("brand")}
                  onValueChange={(value) =>
                    setValue("brand", value as WWEBrand)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">RAW</SelectItem>
                    <SelectItem value="smackdown">SmackDown</SelectItem>
                    <SelectItem value="nxt">NXT</SelectItem>
                  </SelectContent>
                </Select>
                {errors.brand && (
                  <p className="text-sm text-destructive">
                    {errors.brand.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) =>
                    setValue("status", value as WrestlerStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="injured">Injured</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo_url">Photo URL (optional)</Label>
                <Input
                  id="photo_url"
                  {...register("photo_url")}
                  placeholder="https://..."
                />
                {errors.photo_url && (
                  <p className="text-sm text-destructive">
                    {errors.photo_url.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editingWrestler
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wrestlers ({wrestlers.length})</CardTitle>
          <CardDescription>All WWE Superstars in the database</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wrestlers.map((wrestler) => (
                <TableRow key={wrestler.id}>
                  <TableCell className="font-medium">{wrestler.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {wrestler.brand}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        wrestler.status === "active"
                          ? "default"
                          : wrestler.status === "injured"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {wrestler.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(wrestler)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteWrestler(wrestler.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
