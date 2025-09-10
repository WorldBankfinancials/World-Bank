import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSupabase } from "../lib/useSupabase";

const AddMoneyPage: React.FC = () => {
  const { userProfile } = useAuth();
  const supabase = useSupabase();

  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const handleAddMoney = async () => {
    if (!userProfile) return;
    if (amount <= 0) {
      setMessage("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userProfile.id,
          amount,
          type: "credit",
          status: "pending",
          created_at: new Date(),
        })
        .select();

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Transaction initiated successfully");
      }
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-money-page">
      <h1>Add Money</h1>
      <p>Current Balance: {userProfile?.balance || 0}</p>
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={handleAddMoney} disabled={loading}>
        {loading ? "Processing..." : "Add Money"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddMoneyPage;
