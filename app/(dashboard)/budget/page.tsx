import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { AddPortfolioForm } from "./AddPortfolioForm";
import { PortfolioSection } from "./PortfolioSection";

function currency(n: number) {
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default async function BudgetPage() {
  const { profile } = await getSessionProfile();
  const supabase = await createClient();

  const [
    { count: residentCount },
    { data: settings },
    { data: portfolios },
    { data: items },
  ] = await Promise.all([
    supabase.from("residents").select("*", { count: "exact", head: true }),
    supabase.from("hostel_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("secretary_portfolios").select("*").order("name"),
    supabase.from("budget_items").select("*"),
  ]);

  const isAdmin = profile?.role === "admin";
  const perHead = settings?.per_head_amount ?? 1500;
  const residents = settings?.total_resident_count_override ?? residentCount ?? 0;
  const totalBudget = residents * perHead;
  const totalSpent = (items ?? []).reduce((sum, i) => sum + i.spent, 0);
  const balance = totalBudget - totalSpent;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Semester Budget</h1>
        <p className="text-sm text-muted-foreground">
          {residents} resident(s) × {currency(perHead)} per head.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Total budget</p>
            <p className="text-lg font-semibold">{currency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total spent</p>
            <p className="text-lg font-semibold">{currency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-lg font-semibold">{currency(balance)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {(portfolios ?? []).map((portfolio) => (
          <PortfolioSection
            key={portfolio.id}
            portfolio={portfolio}
            items={(items ?? []).filter((i) => i.portfolio_id === portfolio.id)}
            isAdmin={isAdmin}
          />
        ))}
        {(portfolios ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            No secretary portfolios added yet.
          </p>
        )}
      </div>

      {isAdmin && <AddPortfolioForm />}
    </div>
  );
}
