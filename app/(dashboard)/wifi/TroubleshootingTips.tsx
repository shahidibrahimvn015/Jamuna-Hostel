"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/types/database.types";
import {
  addTroubleshootingBlock,
  addTroubleshootingTip,
  deleteTroubleshootingBlock,
  deleteTroubleshootingTip,
} from "./actions";

type Block = Database["public"]["Tables"]["wifi_troubleshooting_blocks"]["Row"];
type Tip = Database["public"]["Tables"]["wifi_troubleshooting_tips"]["Row"];

function BlockCard({
  block,
  tips,
  isAdmin,
}: {
  block: Block;
  tips: Tip[];
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [newTip, setNewTip] = useState("");

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-surface-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{block.title}</h3>
        {isAdmin && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteTroubleshootingBlock(block.id);
              });
            }}
          >
            Remove block
          </Button>
        )}
      </div>

      {tips.length === 0 && (
        <p className="text-sm text-muted-foreground">No tips added yet.</p>
      )}
      <ul className="flex flex-col gap-2">
        {tips.map((tip) => (
          <li key={tip.id} className="flex items-start justify-between gap-2 text-sm">
            <span>• {tip.tip}</span>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await deleteTroubleshootingTip(tip.id);
                  });
                }}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>

      {isAdmin && (
        <div className="flex gap-2 pt-1">
          <Input
            value={newTip}
            onChange={(e) => setNewTip(e.target.value)}
            placeholder="Add a tip to this block"
          />
          <Button
            disabled={isPending || !newTip.trim()}
            onClick={() => {
              const tipText = newTip;
              startTransition(async () => {
                const result = await addTroubleshootingTip(block.id, tipText);
                if (!result.error) setNewTip("");
              });
            }}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

export function TroubleshootingTips({
  blocks,
  tips,
  isAdmin,
}: {
  blocks: Block[];
  tips: Tip[];
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [newBlockTitle, setNewBlockTitle] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Troubleshooting</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {blocks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No troubleshooting blocks added yet.
          </p>
        )}
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            tips={tips.filter((tip) => tip.block_id === block.id)}
            isAdmin={isAdmin}
          />
        ))}

        {isAdmin && (
          <div className="flex gap-2 pt-2">
            <Input
              value={newBlockTitle}
              onChange={(e) => setNewBlockTitle(e.target.value)}
              placeholder="New block title (e.g. Router Issues)"
            />
            <Button
              disabled={isPending || !newBlockTitle.trim()}
              onClick={() => {
                const title = newBlockTitle;
                startTransition(async () => {
                  const result = await addTroubleshootingBlock(title);
                  if (!result.error) setNewBlockTitle("");
                });
              }}
            >
              Add block
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
