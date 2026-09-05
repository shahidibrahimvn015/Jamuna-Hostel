"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/lib/types/database.types";
import { addEmergencyContact, deleteEmergencyContact } from "./actions";

type Contact = Database["public"]["Tables"]["emergency_contacts"]["Row"];

export function EmergencyContactsCard({
  contacts,
  isAdmin,
}: {
  contacts: Contact[];
  isAdmin: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Contacts</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {contacts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No emergency contacts added yet.
          </p>
        )}
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between rounded border bg-surface-2 p-2 text-sm"
          >
            <div>
              <p className="font-medium">{contact.name}</p>
              {contact.role_title && (
                <p className="text-muted-foreground">{contact.role_title}</p>
              )}
              <p>{contact.phone}</p>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await deleteEmergencyContact(contact.id);
                  });
                }}
              >
                Remove
              </Button>
            )}
          </div>
        ))}

        {isAdmin && (
          <form
            ref={formRef}
            action={(formData) => {
              startTransition(async () => {
                const result = await addEmergencyContact(formData);
                setError(result.error);
                if (!result.error) formRef.current?.reset();
              });
            }}
            className="flex flex-wrap items-end gap-2 pt-2"
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="role_title">Role</Label>
              <Input id="role_title" name="role_title" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <Button type="submit" disabled={isPending}>
              Add
            </Button>
            {error && <p className="text-sm text-destructive w-full">{error}</p>}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
