import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center p-8", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800 mb-4", children: "Something went wrong" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Please refresh the page to continue" }), _jsx("button", { onClick: () => window.location.reload(), className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700", children: "Refresh Page" })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
