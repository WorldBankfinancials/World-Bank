import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from "wouter";
import { useEffect } from 'react';
export function ProtectedRoute({ children }) {
    try {
        var authContext = useAuth();
    }
    catch (error) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsxs("svg", { className: "w-8 h-8 text-white animate-spin", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "WORLD BANK" }), _jsx("p", { className: "text-gray-600", children: "Initializing secure session..." })] }) }));
    }
    const { user, loading } = authContext;
    const [, setLocation] = useLocation();
    useEffect(() => {
        if (!loading && !user) {
            setLocation('/login');
        }
    }, [user, loading, setLocation]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsxs("svg", { className: "w-8 h-8 text-white animate-spin", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "WORLD BANK" }), _jsx("p", { className: "text-gray-600", children: "Loading your secure banking session..." })] }) }));
    }
    if (!user) {
        return null;
    }
    return _jsx(_Fragment, { children: children });
}
