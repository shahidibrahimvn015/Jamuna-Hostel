"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { bulkAddResidents } from "./actions";

export function BulkImportDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<{
    error: string | null;
    count: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setText("");
          setResult(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        Bulk import
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk import residents</DialogTitle>
          <DialogDescription>
            Roll numbers separated by commas, spaces, or one per line.
            Re-importing a roll number already on the list is a no-op
            instead of duplicating it.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"ed24b064,ed24b061,ed24b062"}
          rows={10}
        />

        {result && (
          <p
            className={
              result.error && result.count === 0
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {result.count > 0
              ? `Imported ${result.count} resident(s).`
              : null}
            {result.error ? ` ${result.error}` : null}
          </p>
        )}

        <DialogFooter>
          <Button
            disabled={isPending || !text.trim()}
            onClick={() => {
              startTransition(async () => {
                const res = await bulkAddResidents(text);
                setResult(res);
                if (res.count > 0 && !res.error) {
                  setText("");
                }
              });
            }}
          >
            {isPending ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
