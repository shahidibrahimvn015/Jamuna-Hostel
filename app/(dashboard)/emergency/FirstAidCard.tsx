"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/types/database.types";
import { updateFirstAidInfo } from "./actions";

type FirstAidInfo = Database["public"]["Tables"]["first_aid_info"]["Row"];

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>First-Aid Kit</CardTitle>
        {isAdmin && !editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="font-medium">Contents</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {info?.contents || "Not added yet."}
              </p>
            </div>
            <div>
              <p className="font-medium">Usage guidelines</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
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
              <Label htmlFor="contents">Kit contents</Label>
              <Textarea
                id="contents"
                name="contents"
                defaultValue={info?.contents ?? ""}
                rows={6}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="guidelines">Usage guidelines</Label>
              <Textarea
                id="guidelines"
                name="guidelines"
                defaultValue={info?.guidelines ?? ""}
                rows={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
