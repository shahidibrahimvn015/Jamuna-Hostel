"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/types/database.types";
import {
  addTroubleshootingBlock,
  addTroubleshootingTip,
  deleteTroubleshootingBlock,
  deleteTroubleshootingTip,
  editTroubleshootingTip,
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
  const [editingTipId, setEditingTipId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const actionButtonClass =
    "rounded-[10px] border border-black/10 bg-[#F5EFE4] text-[#422400] shadow-md hover:bg-[#ECE3D0] hover:text-[#422400]";
  const inputClass =
    "rounded-[10px] border-white/50 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white";

  function startEditing(tip: Tip) {
    setEditingTipId(tip.id);
    setEditValue(tip.tip);
  }

  function cancelEditing() {
    setEditingTipId(null);
    setEditValue("");
  }

  function saveEditing(id: number) {
    const value = editValue;
    startTransition(async () => {
      const result = await editTroubleshootingTip(id, value);
      if (!result.error) {
        setEditingTipId(null);
        setEditValue("");
      }
    });
  }

  return (
    <div className="bg-brand-gradient flex flex-col gap-2 rounded-2xl p-4 text-white shadow-md">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{block.title}</h3>
        {isAdmin && (
          <Button
            size="sm"
            disabled={isPending}
            className={actionButtonClass}
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
        <p className="text-sm text-white/70">No tips added yet.</p>
      )}
      <ul className="flex flex-col gap-2">
        {tips.map((tip) =>
          editingTipId === tip.id ? (
            <li key={tip.id} className="flex items-center gap-2 text-sm">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className={inputClass}
                autoFocus
              />
              <Button
                size="sm"
                disabled={isPending || !editValue.trim()}
                className={actionButtonClass}
                onClick={() => saveEditing(tip.id)}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={cancelEditing}
              >
                Cancel
              </Button>
            </li>
          ) : (
            <li key={tip.id} className="flex items-start justify-between gap-2 text-sm text-white/90">
              <span>• {tip.tip}</span>
              {isAdmin && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    disabled={isPending}
                    className={actionButtonClass}
                    onClick={() => startEditing(tip)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    disabled={isPending}
                    className={actionButtonClass}
                    onClick={() => {
                      startTransition(async () => {
                        await deleteTroubleshootingTip(tip.id);
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </li>
          )
        )}
      </ul>

      {isAdmin && (
        <div className="flex gap-2 pt-1">
          <Input
            value={newTip}
            onChange={(e) => setNewTip(e.target.value)}
            placeholder="Add a tip to this block"
            className={inputClass}
          />
          <Button
            disabled={isPending || !newTip.trim()}
            className={actionButtonClass}
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
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        Basic Troubleshooting
      </h2>

      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No troubleshooting blocks added yet.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            tips={tips.filter((tip) => tip.block_id === block.id)}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {isAdmin && (
        <div className="flex gap-2 pt-1">
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
    </div>
  );
}
