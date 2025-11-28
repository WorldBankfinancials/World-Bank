import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2, Clock, Shield } from "lucide-react";
export default function TransferProcessing() {
    const [, setLocation] = useLocation();
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setLocation("/transfer-pending");
                    }, 1000);
                    return 100;
                }
                return prev + 10;
            });
        }, 500);
        return () => clearInterval(interval);
    }, [setLocation]);
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md text-center", children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Loader2, { className: "w-8 h-8 text-blue-600 animate-spin" }) }), _jsx(CardTitle, { children: "Processing Transfer" }), _jsx("p", { className: "text-gray-600", children: "Please wait while we process your transaction" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-500", style: { width: `${progress}%` } }) }), _jsxs("p", { className: "text-sm text-gray-600", children: [progress, "% Complete"] })] }), _jsxs("div", { className: "space-y-3 text-left", children: [_jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx(Clock, { className: "w-4 h-4 text-blue-600" }), _jsx("span", { children: "Verifying transfer details..." })] }), _jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx(Shield, { className: "w-4 h-4 text-green-600" }), _jsx("span", { children: "Security validation complete" })] }), _jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx(Loader2, { className: "w-4 h-4 text-blue-600 animate-spin" }), _jsx("span", { children: "Processing transaction..." })] })] }), _jsx("div", { className: "bg-blue-50 p-3 rounded-lg text-sm text-blue-800", children: _jsx("p", { children: "Your transfer is being processed securely. This may take a few moments." }) })] })] }) }));
}
