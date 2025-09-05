// client/src/pages/add-money.tsx
import { useState } from "react";
import { useUser, useAccount } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function AddMoneyPage() {
  const { data: authUser } = useUser();
  const userId = authUser?.id ?? null;
  const { data: account } = useAccount(userId);
  const qc = useQueryClient();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("debit_card");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleAdd = async () => {
    setMsg(null);
    if (!userId) return setMsg("Sign in first");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setMsg("Enter valid amount");

    setLoading(true);
    try {
      await supabase.from("transactions").insert([{
        from_user_id: null,
        to_user_id: userId,
        amount: amt,
        type: "credit",
        status: "completed",
        description: `Add money via ${method}`
      }]);

      const newBalance = (account?.balance ?? 0) + amt;
      await supabase.from("accounts").update({ balance: newBalance }).eq("id", account?.id);

      qc.invalidateQueries({ queryKey: ["account", userId] });
      qc.invalidateQueries({ queryKey: ["transactions", userId] });

      setMsg(`Added $${amt.toFixed(2)} to your account.`);
      setAmount("");
    } catch (err: any) {
      setMsg(err.message || "Failed to add money");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader><CardTitle>Add Money</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Amount</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          </div>

          <div>
            <Label>Method</Label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full p-2 border rounded">
              <option value="debit_card">Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
          </div>

          {msg && <div className="text-sm text-gray-700">{msg}</div>}

          <Button onClick={handleAdd} disabled={loading} className="w-full">{loading ? "Processing..." : "Add Money"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
