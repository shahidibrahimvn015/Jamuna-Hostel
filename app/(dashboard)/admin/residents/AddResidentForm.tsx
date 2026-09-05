"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addResident } from "./actions";

export function AddResidentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          const result = await addResident(formData);
          setError(result.error);
          if (!result.error) formRef.current?.reset();
        });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="roll_number">Roll number</Label>
        <Input
          id="roll_number"
          name="roll_number"
          placeholder="ed24b064"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add resident"}
      </Button>
      {error && <p className="text-sm text-destructive w-full">{error}</p>}
    </form>
  );
}
