"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addNotice, deleteNotice } from "./actions";

export type NoticeItem = {
  id: number;
  title: string;
  description: string;
  event_date: string;
  posterUrl: string | null;
};

function AddNoticeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a notice</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={(formData) => {
            startTransition(async () => {
              const result = await addNotice(formData);
              setError(result.error);
              if (!result.error) formRef.current?.reset();
            });
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="title">Event title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="event_date">Date</Label>
            <Input id="event_date" name="event_date" type="date" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="poster">Poster photo (optional)</Label>
            <Input id="poster" name="poster" type="file" accept="image/*" />
          </div>
          <Button type="submit" disabled={isPending} className="w-fit">
            Post notice
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function NoticeBoardClient({
  notices,
  isAdmin,
}: {
  notices: NoticeItem[];
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [lightbox, setLightbox] = useState<NoticeItem | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {notices.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No notices posted yet.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notices.map((notice) => (
          <Card key={notice.id} className="flex flex-col">
            {notice.posterUrl && (
              <button
                type="button"
                onClick={() => setLightbox(notice)}
                className="relative block h-48 w-full shrink-0 overflow-hidden rounded-t-xl bg-muted"
              >
                <Image
                  src={notice.posterUrl}
                  alt={notice.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </button>
            )}
            <CardHeader>
              <CardTitle>{notice.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(notice.event_date).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-3">
              <p className="text-sm whitespace-pre-wrap">
                {notice.description}
              </p>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-fit"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await deleteNotice(notice.id);
                    });
                  }}
                >
                  Remove
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdmin && <AddNoticeForm />}

      <Dialog
        open={lightbox !== null}
        onOpenChange={(open) => !open && setLightbox(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{lightbox?.title}</DialogTitle>
          </DialogHeader>
          {lightbox?.posterUrl && (
            <div className="relative h-[75vh] w-full">
              <Image
                src={lightbox.posterUrl}
                alt={lightbox.title}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
