/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: 'var(--primary-color, #3b82f6)',
                'primary-dark': 'var(--primary-dark, #2563eb)',
                secondary: 'var(--secondary-color, #64748b)',
                background: 'var(--background-color, #f9fafb)',
                text: 'var(--text-color, #1f2937)',
            },
            fontFamily: {
                sans: [
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Arial',
                    'sans-serif',
                ],
            },
            boxShadow: {
                'input-focus': '0 0 0 3px rgba(59, 130, 246, 0.25)',
            },
        },
    },
    plugins: [],
};
