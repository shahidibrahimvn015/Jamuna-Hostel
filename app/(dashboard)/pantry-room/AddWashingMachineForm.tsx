"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MachineFormFields } from "./WashingMachineFields";
import { addWashingMachine } from "./washingActions";

// Standalone "add new X" form living outside any themed box, so it stays
// neutral like AddNoticeForm and AddPortfolioForm.
export function AddWashingMachineForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          const result = await addWashingMachine(formData);
          setError(result.error);
          if (!result.error) formRef.current?.reset();
        });
      }}
      className="flex max-w-md flex-col gap-3 rounded-2xl border p-4"
    >
      <p className="text-sm font-medium">Add a washing machine</p>
      <MachineFormFields />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-fit">
        Add machine
      </Button>
    </form>
  );
}
