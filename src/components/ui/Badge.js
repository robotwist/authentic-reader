import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const Badge = ({ text, icon: Icon, className = '', variant = 'default' }) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full';
    const variantClasses = {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return (_jsxs("span", { className: `${baseClasses} ${variantClasses[variant]} ${className}`, children: [Icon && _jsx(Icon, { className: "w-3 h-3" }), text] }));
};
