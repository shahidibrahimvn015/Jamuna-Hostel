"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/types/database.types";
import { deleteTicket, resolveTicket } from "./actions";

type Ticket = Database["public"]["Tables"]["wifi_tickets"]["Row"];

export function TicketsTable({
  tickets,
  currentUserId,
  isAdmin = false,
  showResolveAction = false,
}: {
  tickets: Ticket[];
  currentUserId: string;
  isAdmin?: boolean;
  showResolveAction?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  if (tickets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No tickets raised yet.</p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Mail sent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const canDelete = isAdmin || ticket.raised_by === currentUserId;
            return (
              <TableRow key={ticket.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(ticket.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell>{ticket.room_number}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {ticket.issue_description}
                </TableCell>
                <TableCell>
                  <Badge variant={ticket.mail_sent ? "default" : "secondary"}>
                    {ticket.mail_sent ? "Sent" : "Not sent"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={ticket.status === "open" ? "secondary" : "default"}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {showResolveAction && ticket.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            await resolveTicket(ticket.id);
                          });
                        }}
                      >
                        Mark resolved
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => setDeleteId(ticket.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this ticket?</DialogTitle>
            <DialogDescription>
              This permanently removes the ticket. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                const id = deleteId;
                if (id === null) return;
                startTransition(async () => {
                  await deleteTicket(id);
                  setDeleteId(null);
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
