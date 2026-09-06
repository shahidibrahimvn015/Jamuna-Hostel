"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button variant="ghost" size="icon-sm" className="md:hidden" />
        }
      >
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col gap-4 border-r bg-card p-4 shadow-lg outline-none duration-150 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="font-heading text-sm font-semibold tracking-widest uppercase">
              Menu
            </DialogPrimitive.Title>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="size-4" />
                <span className="sr-only">Close menu</span>
              </DialogPrimitive.Close>
            </div>
          </div>
          <div onClick={() => setOpen(false)}>
            <SidebarNav isAdmin={isAdmin} />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
