import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankLogo } from "@/components/BankLogo";
import { Shield } from "lucide-react";
export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { signIn } = useAuth();
    const [, setLocation] = useLocation();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const result = await signIn(username, password);
            if (result.error) {
                setError(result.error);
            }
            else {
                setLocation("/admin-dashboard");
            }
        }
        catch (err) {
            setError("Login failed. Please try again.");
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx(BankLogo, { className: "w-16 h-16" }) }), _jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center justify-center gap-2 text-2xl", children: [_jsx(Shield, { className: "w-6 h-6" }), "Admin Access"] }), _jsx("p", { className: "text-gray-600 mt-2", children: "World Bank Administration Panel" })] })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "username", children: "Username" }), _jsx(Input, { id: "username", type: "text", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Enter admin username", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Enter admin password", required: true })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? "Signing In..." : "Access Admin Panel" })] }), _jsxs("div", { className: "mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md", children: [_jsx("p", { className: "text-sm text-yellow-800 font-medium", children: "\u26A0\uFE0F Secure Access Required" }), _jsx("p", { className: "text-sm text-yellow-700", children: "Contact your system administrator for admin credentials." })] })] })] }) }));
}
