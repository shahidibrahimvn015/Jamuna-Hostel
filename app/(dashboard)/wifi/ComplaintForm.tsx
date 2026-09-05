"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractRollNumber } from "@/lib/auth/extractRollNumber";
import {
  WIFI_COMPLAINT_BCC,
  WIFI_COMPLAINT_CC,
  WIFI_HELPDESK_EMAIL,
} from "@/lib/constants/network";
import {
  buildComplaintEmailContent,
  buildGmailAppComposeUrl,
  buildGmailWebComposeUrl,
} from "@/lib/mailto";
import { logTicket } from "./actions";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function ComplaintForm({ smailId }: { smailId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFields, setPendingFields] = useState<{
    room_number: string;
    contact_number: string;
    mac_address: string;
    issue_description: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function readFields() {
    const formData = new FormData(formRef.current!);
    return {
      room_number: String(formData.get("room_number") ?? ""),
      contact_number: String(formData.get("contact_number") ?? ""),
      mac_address: String(formData.get("mac_address") ?? ""),
      issue_description: String(formData.get("issue_description") ?? ""),
    };
  }

  function handleDraft() {
    if (!formRef.current?.reportValidity()) return;
    const fields = readFields();

    const { subject, body } = buildComplaintEmailContent({
      room: fields.room_number,
      contact: fields.contact_number,
      mac: fields.mac_address,
      issue: fields.issue_description,
      rollNumber: extractRollNumber(smailId) ?? smailId,
    });

    const webUrl = buildGmailWebComposeUrl({
      to: WIFI_HELPDESK_EMAIL,
      cc: WIFI_COMPLAINT_CC,
      bcc: WIFI_COMPLAINT_BCC,
      subject,
      body,
    });

    if (isMobileDevice()) {
      const appUrl = buildGmailAppComposeUrl({
        to: WIFI_HELPDESK_EMAIL,
        cc: WIFI_COMPLAINT_CC,
        bcc: WIFI_COMPLAINT_BCC,
        subject,
        body,
      });
      const openedAt = Date.now();
      window.location.href = appUrl;
      setTimeout(() => {
        if (document.visibilityState !== "hidden" && Date.now() - openedAt < 2000) {
          window.location.href = webUrl;
        }
      }, 1000);
    } else {
      window.open(webUrl, "_blank");
    }

    setMessage(null);
  }

  function handleSent() {
    if (!formRef.current?.reportValidity()) return;
    setPendingFields(readFields());
    setConfirmOpen(true);
  }

  function handleConfirmSent() {
    if (!pendingFields) return;
    const fields = pendingFields;

    startTransition(async () => {
      const result = await logTicket({
        smail_id: smailId,
        room_number: fields.room_number,
        contact_number: fields.contact_number || null,
        mac_address: fields.mac_address || null,
        issue_description: fields.issue_description,
        mail_sent: true,
      });
      setMessage(
        result.error
          ? result.error
          : "Ticket logged. Check 'My raised tickets' below."
      );
      setConfirmOpen(false);
      setPendingFields(null);
      if (!result.error) formRef.current?.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raise a complaint</CardTitle>
        <CardDescription>
          Fill in the details and click &quot;Draft complaint email&quot; to
          open Gmail (the app on your phone, or gmail.com on desktop) with a
          pre-filled complaint addressed to {WIFI_HELPDESK_EMAIL}. Once
          you&apos;ve actually sent it, click &quot;I&apos;ve sent mail&quot;
          to log your ticket — only complaints confirmed as sent are counted
          as raised.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <Label>Smail ID</Label>
            <Input value={smailId} disabled />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="room_number">Room number</Label>
            <Input id="room_number" name="room_number" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="contact_number">Contact number (optional)</Label>
            <Input id="contact_number" name="contact_number" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="mac_address">
              Device MAC address (optional)
            </Label>
            <Input id="mac_address" name="mac_address" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="issue_description">Describe the issue</Label>
            <Textarea id="issue_description" name="issue_description" required />
          </div>
          <p className="text-sm text-muted-foreground">
            Note: if possible, attach a screenshot of your ipconfig output to
            the drafted email before sending it.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleDraft}>
              Draft complaint email
            </Button>
            <Button type="button" disabled={isPending} onClick={handleSent}>
              I&apos;ve sent mail
            </Button>
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm you&apos;ve sent the complaint mail</DialogTitle>
            <DialogDescription>
              This will log a ticket under &quot;My raised tickets&quot;.
              Only confirm if you&apos;ve actually sent the email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setConfirmOpen(false);
                setPendingFields(null);
              }}
            >
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleConfirmSent}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
