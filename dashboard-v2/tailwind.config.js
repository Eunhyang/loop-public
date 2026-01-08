/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/react-tailwindcss-datepicker/dist/**/*.js",
    ],
    theme: {
        extend: {
            colors: {
                // Map to CSS variables using rgb() wrapper for opacity support
                'main': 'rgb(var(--color-bg-main) / <alpha-value>)',
                'surface': 'rgb(var(--color-surface) / <alpha-value>)',
                'primary': 'rgb(var(--color-primary) / <alpha-value>)',
                'primary-glow': 'rgba(99, 102, 241, 0.5)',

                // Track Colors
                'track-1': 'rgb(var(--color-track-1) / <alpha-value>)',
                'track-2': 'rgb(var(--color-track-2) / <alpha-value>)',
                'track-3': 'rgb(var(--color-track-3) / <alpha-value>)',
                'track-4': 'rgb(var(--color-track-4) / <alpha-value>)',
                'track-5': 'rgb(var(--color-track-5) / <alpha-value>)',
                'track-6': 'rgb(var(--color-track-6) / <alpha-value>)',
                'track-default': 'rgb(var(--color-track-default) / <alpha-value>)',

                // Track Accent Colors
                'track-1-accent': 'rgb(var(--color-track-1-accent) / <alpha-value>)',
                'track-2-accent': 'rgb(var(--color-track-2-accent) / <alpha-value>)',
                'track-3-accent': 'rgb(var(--color-track-3-accent) / <alpha-value>)',
                'track-4-accent': 'rgb(var(--color-track-4-accent) / <alpha-value>)',
                'track-5-accent': 'rgb(var(--color-track-5-accent) / <alpha-value>)',
                'track-6-accent': 'rgb(var(--color-track-6-accent) / <alpha-value>)',
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
