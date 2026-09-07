"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { LayoutGrid, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";

export function MobileNav({
  isAdmin,
  onSignOut,
}: {
  isAdmin: boolean;
  onSignOut: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button variant="ghost" size="icon-sm" className="md:hidden" />
        }
      >
        <LayoutGrid className="size-5" />
        <span className="sr-only">Open menu</span>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="bg-sidebar-pattern fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col gap-4 p-4 text-white shadow-lg outline-none duration-150 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <div className="relative flex items-center justify-between">
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            <div>
              <ThemeToggle className="text-white/90" />
            </div>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-white hover:bg-white/15 hover:text-white"
                />
              }
            >
              <X className="size-4" />
              <span className="sr-only">Close menu</span>
            </DialogPrimitive.Close>
          </div>
          <div onClick={() => setOpen(false)}>
            <SidebarNav isAdmin={isAdmin} onSignOut={onSignOut} />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
