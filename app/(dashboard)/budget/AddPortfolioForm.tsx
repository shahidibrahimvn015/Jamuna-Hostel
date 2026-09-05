"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPortfolio } from "./actions";

export function AddPortfolioForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          const result = await createPortfolio(formData);
          setError(result.error);
          if (!result.error) formRef.current?.reset();
        });
      }}
      className="flex items-end gap-2"
    >
      <Input name="name" placeholder="e.g. Cultural Secretary" required />
      <Button type="submit" disabled={isPending}>
        Add portfolio
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
