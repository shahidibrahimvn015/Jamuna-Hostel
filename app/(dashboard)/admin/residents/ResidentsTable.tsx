"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/types/database.types";
import { deleteResident } from "./actions";

type Resident = Database["public"]["Tables"]["residents"]["Row"];

function ResidentRow({ resident }: { resident: Resident }) {
  const [isPending, startTransition] = useTransition();

  return (
    <TableRow>
      <TableCell className="font-mono">{resident.roll_number}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await deleteResident(resident.id);
            });
          }}
        >
          Remove
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ResidentsTable({ residents }: { residents: Resident[] }) {
  if (residents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No residents added yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Roll number</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {residents.map((resident) => (
          <ResidentRow key={resident.id} resident={resident} />
        ))}
      </TableBody>
    </Table>
  );
}
