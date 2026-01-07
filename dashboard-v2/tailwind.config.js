/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Map to CSS variables using rgb() wrapper for opacity support
                'main': 'rgb(var(--color-bg-main) / <alpha-value>)',
                'surface': 'rgb(var(--color-surface) / <alpha-value>)',
                'primary': 'rgb(var(--color-primary) / <alpha-value>)',
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
