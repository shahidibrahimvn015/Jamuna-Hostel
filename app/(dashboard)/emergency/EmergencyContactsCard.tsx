"use client";

import { Phone } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/lib/types/database.types";
import { addEmergencyContact, deleteEmergencyContact } from "./actions";

type Contact = Database["public"]["Tables"]["emergency_contacts"]["Row"];

// tel: hands off to the OS, which on Android offers whichever apps can place
// the call (Phone, WhatsApp, Truecaller...). Strip formatting but keep a
// leading + so international numbers still dial.
function telHref(phone: string) {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return `tel:${plus}${trimmed.replace(/\D/g, "")}`;
}

const actionButtonClass =
  "rounded-[10px] border border-black/10 bg-[#F5EFE4] text-[#422400] shadow-md hover:bg-[#ECE3D0] hover:text-[#422400]";

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
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        Emergency Contacts
      </h2>

      {contacts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No emergency contacts added yet.
        </p>
      )}
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="bg-brand-gradient flex items-center justify-between gap-3 rounded-2xl p-4 text-white shadow-md"
        >
          {/* The link wraps only the contact details: a <button> inside an
              <a> is invalid markup, and tapping Remove would also place the
              call. */}
          <a
            href={telHref(contact.phone)}
            aria-label={`Call ${contact.role_title}`}
            className="-m-2 flex flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/10 active:bg-white/15"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
              <Phone className="size-4" />
            </span>
            <span>
              <span className="block font-medium">{contact.role_title}</span>
              <span className="block text-sm text-white/90">
                {contact.phone}
              </span>
            </span>
          </a>
          {isAdmin && (
            <Button
              size="sm"
              disabled={isPending}
              className={actionButtonClass}
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
          className="flex flex-wrap items-end gap-2 pt-1"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="role_title">Role</Label>
            <Input
              id="role_title"
              name="role_title"
              placeholder="Security Desk"
              required
            />
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
    </div>
  );
}
