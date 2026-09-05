"use client";

import { UserRound } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Database, HostelRepSection } from "@/lib/types/database.types";
import { addHostelRep, deleteHostelRep, updateHostelRep } from "./actions";

type Rep = Database["public"]["Tables"]["hostel_reps"]["Row"];

function repPhotoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rep-photos/${path}`;
}

function RepFields({
  defaultRep,
  showPhoto,
}: {
  defaultRep?: Rep;
  showPhoto?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultRep?.name}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="role_title">Role / title</Label>
        <Input
          id="role_title"
          name="role_title"
          defaultValue={defaultRep?.role_title ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={defaultRep?.phone ?? ""} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" defaultValue={defaultRep?.email ?? ""} />
      </div>
      {showPhoto && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="photo">Photo (optional)</Label>
          <Input id="photo" name="photo" type="file" accept="image/*" />
        </div>
      )}
    </div>
  );
}

function EditRepDialog({ rep, showPhoto }: { rep: Rep; showPhoto?: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {rep.name}</DialogTitle>
        </DialogHeader>
        <form
          action={(formData) => {
            formData.set("section", rep.section);
            startTransition(async () => {
              const result = await updateHostelRep(rep.id, formData);
              setError(result.error);
              if (!result.error) setOpen(false);
            });
          }}
          className="flex flex-col gap-3"
        >
          <RepFields defaultRep={rep} showPhoto={showPhoto} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await deleteHostelRep(rep.id);
                  setOpen(false);
                });
              }}
            >
              Delete
            </Button>
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddRepDialog({
  section,
  showPhoto,
}: {
  section: HostelRepSection;
  showPhoto?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Add
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to {section}</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={(formData) => {
            formData.set("section", section);
            startTransition(async () => {
              const result = await addHostelRep(formData);
              setError(result.error);
              if (!result.error) {
                formRef.current?.reset();
                setOpen(false);
              }
            });
          }}
          className="flex flex-col gap-3"
        >
          <RepFields showPhoto={showPhoto} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RepSectionCard({
  section,
  title,
  reps,
  isAdmin,
  layout = "list",
}: {
  section: HostelRepSection;
  title: string;
  reps: Rep[];
  isAdmin: boolean;
  layout?: "list" | "grid";
}) {
  const showPhoto = layout === "grid";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {isAdmin && <AddRepDialog section={section} showPhoto={showPhoto} />}
      </CardHeader>
      <CardContent>
        {reps.length === 0 && (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        )}

        {layout === "grid" ? (
          <div className="flex flex-wrap justify-center gap-4">
            {reps.map((rep) => (
              <div
                key={rep.id}
                className="flex w-[calc(50%-0.5rem)] flex-col items-center gap-2 rounded-lg border bg-surface-2 p-4 text-center sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]"
              >
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {rep.photo_path ? (
                    <Image
                      src={repPhotoUrl(rep.photo_path)}
                      alt={rep.name}
                      width={80}
                      height={80}
                      className="size-20 object-cover"
                      unoptimized
                    />
                  ) : (
                    <UserRound className="size-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{rep.name}</p>
                  {rep.role_title && (
                    <p className="text-xs text-muted-foreground">
                      {rep.role_title}
                    </p>
                  )}
                  {rep.phone && <p className="text-xs">{rep.phone}</p>}
                  {rep.email && (
                    <p className="text-xs break-all">{rep.email}</p>
                  )}
                </div>
                {isAdmin && (
                  <EditRepDialog rep={rep} showPhoto={showPhoto} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reps.map((rep, i) => (
              <div key={rep.id} className="flex flex-col gap-1">
                {i > 0 && <Separator className="mb-2" />}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{rep.name}</p>
                    {rep.role_title && (
                      <p className="text-sm text-muted-foreground">
                        {rep.role_title}
                      </p>
                    )}
                    {rep.phone && <p className="text-sm">{rep.phone}</p>}
                    {rep.email && <p className="text-sm">{rep.email}</p>}
                  </div>
                  {isAdmin && <EditRepDialog rep={rep} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
