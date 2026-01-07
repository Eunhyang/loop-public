/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'dark-bg': '#0f1115',
                'glass-border': 'rgba(255, 255, 255, 0.08)',
                'glass-surface': 'rgba(20, 20, 25, 0.7)',
                'primary': '#6366f1',
                'primary-glow': 'rgba(99, 102, 241, 0.5)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
