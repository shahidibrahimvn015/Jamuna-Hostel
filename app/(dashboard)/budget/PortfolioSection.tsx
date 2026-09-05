"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/types/database.types";
import {
  createBudgetItem,
  deleteBudgetItem,
  getBillUrl,
  updateBudgetItem,
} from "./actions";

type BudgetItem = Database["public"]["Tables"]["budget_items"]["Row"];
type Portfolio = Database["public"]["Tables"]["secretary_portfolios"]["Row"];

function currency(n: number) {
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function ViewBillButton({ path }: { path: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="link"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await getBillUrl(path);
          if (result.url) window.open(result.url, "_blank");
        });
      }}
    >
      View bill
    </Button>
  );
}

function ItemFormFields({ defaultItem }: { defaultItem?: BudgetItem }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="item">Item</Label>
        <Input id="item" name="item" defaultValue={defaultItem?.item} required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="budget">Budget</Label>
        <Input
          id="budget"
          name="budget"
          type="number"
          step="0.01"
          min={0}
          defaultValue={defaultItem?.budget ?? 0}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="spent">Spent</Label>
        <Input
          id="spent"
          name="spent"
          type="number"
          step="0.01"
          min={0}
          defaultValue={defaultItem?.spent ?? 0}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="bill">
          Bill PDF {defaultItem?.bill_path ? "(replace)" : "(optional)"}
        </Label>
        <Input id="bill" name="bill" type="file" accept="application/pdf" />
      </div>
    </div>
  );
}

function EditItemDialog({ item }: { item: BudgetItem }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {item.item}</DialogTitle>
        </DialogHeader>
        <form
          action={(formData) => {
            startTransition(async () => {
              const result = await updateBudgetItem(item.id, formData);
              setError(result.error);
              if (!result.error) setOpen(false);
            });
          }}
          className="flex flex-col gap-3"
        >
          <ItemFormFields defaultItem={item} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await deleteBudgetItem(item.id);
                  setOpen(false);
                });
              }}
            >
              Delete
            </Button>
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddItemForm({ portfolioId }: { portfolioId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formData.set("portfolio_id", String(portfolioId));
        startTransition(async () => {
          const result = await createBudgetItem(formData);
          setError(result.error);
          if (!result.error) formRef.current?.reset();
        });
      }}
      className="flex flex-wrap items-end gap-2 pt-2"
    >
      <Input name="item" placeholder="Item" required className="w-40" />
      <Input
        name="budget"
        type="number"
        step="0.01"
        min={0}
        placeholder="Budget"
        className="w-28"
      />
      <Input
        name="spent"
        type="number"
        step="0.01"
        min={0}
        placeholder="Spent"
        className="w-28"
      />
      <Input name="bill" type="file" accept="application/pdf" className="w-52" />
      <Button type="submit" disabled={isPending}>
        Add item
      </Button>
      {error && <p className="text-sm text-destructive w-full">{error}</p>}
    </form>
  );
}

export function PortfolioSection({
  portfolio,
  items,
  isAdmin,
}: {
  portfolio: Portfolio;
  items: BudgetItem[];
  isAdmin: boolean;
}) {
  const totals = items.reduce(
    (acc, item) => {
      acc.budget += item.budget;
      acc.spent += item.spent;
      acc.balance += item.balance;
      return acc;
    },
    { budget: 0, spent: 0, balance: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{portfolio.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Bill</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.item}</TableCell>
                <TableCell>{currency(item.budget)}</TableCell>
                <TableCell>{currency(item.spent)}</TableCell>
                <TableCell>{currency(item.balance)}</TableCell>
                <TableCell>
                  {item.bill_path ? (
                    <ViewBillButton path={item.bill_path} />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <EditItemDialog item={item} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">
                {currency(totals.budget)}
              </TableCell>
              <TableCell className="font-medium">
                {currency(totals.spent)}
              </TableCell>
              <TableCell className="font-medium">
                {currency(totals.balance)}
              </TableCell>
              <TableCell />
              {isAdmin && <TableCell />}
            </TableRow>
          </TableFooter>
        </Table>

        {isAdmin && <AddItemForm portfolioId={portfolio.id} />}
      </CardContent>
    </Card>
  );
}
