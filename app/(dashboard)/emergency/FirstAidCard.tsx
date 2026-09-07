"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/types/database.types";
import { updateFirstAidInfo } from "./actions";

type FirstAidInfo = Database["public"]["Tables"]["first_aid_info"]["Row"];

const actionButtonClass =
  "rounded-[10px] border border-black/10 bg-[#F5EFE4] text-[#422400] shadow-md hover:bg-[#ECE3D0] hover:text-[#422400]";
const inputClass =
  "rounded-[10px] border-white/50 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white";

export function FirstAidCard({
  info,
  isAdmin,
}: {
  info: FirstAidInfo | null;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="bg-brand-gradient flex flex-col gap-4 rounded-2xl p-5 text-white shadow-md">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">First-Aid Kit</h2>
        {isAdmin && !editing && (
          <Button size="sm" className={actionButtonClass} onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="font-medium">Contents</p>
            <p className="whitespace-pre-wrap text-white/80">
              {info?.contents || "Not added yet."}
            </p>
          </div>
          <div>
            <p className="font-medium">Usage guidelines</p>
            <p className="whitespace-pre-wrap text-white/80">
              {info?.guidelines || "Not added yet."}
            </p>
          </div>
        </div>
      ) : (
        <form
          action={(formData) => {
            startTransition(async () => {
              const result = await updateFirstAidInfo(formData);
              setError(result.error);
              if (!result.error) setEditing(false);
            });
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="contents" className="text-white/90">
              Kit contents
            </Label>
            <Textarea
              id="contents"
              name="contents"
              defaultValue={info?.contents ?? ""}
              rows={6}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="guidelines" className="text-white/90">
              Usage guidelines
            </Label>
            <Textarea
              id="guidelines"
              name="guidelines"
              defaultValue={info?.guidelines ?? ""}
              rows={6}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-white/90">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className={actionButtonClass}>
              Save
            </Button>
            <Button
              type="button"
              disabled={isPending}
              className={actionButtonClass}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
