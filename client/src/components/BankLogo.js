import { jsx as _jsx } from "react/jsx-runtime";
export function BankLogo({ className = "w-10 h-10" }) {
    return (_jsx("img", { src: "/world-bank-logo.jpeg", alt: "World Bank Logo", className: `${className} object-contain`, onError: (e) => {
            const target = e.target;
            target.src = "https://via.placeholder.com/120x120/3B82F6/FFFFFF?text=WB";
        } }));
}
