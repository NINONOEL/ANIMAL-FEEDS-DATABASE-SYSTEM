/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        sans:    ['Poppins', 'sans-serif'],
      },
      colors: {
        /* ── Exact colors from pinky.jpg ──────────────────────
         *  p1  #E6789A   deep rose    (darkest)
         *  p2  #F08CA9   medium rose
         *  p3  #F5A6BD   light pink
         *  p4  #F9C1D3   palest pink
         *  + derived darker shades for sidebar / text
         * ─────────────────────────────────────────────────── */
        'p1':    '#E6789A',
        'p2':    '#F08CA9',
        'p3':    '#F5A6BD',
        'p4':    '#F9C1D3',
        'p-dark':  '#C45A7E',
        'p-deep':  '#9E3560',
        'p-text':  '#7A2648',
        'p-bg':    '#FBF7F8',
        'p-card':  '#FFF8FB',
        'p-border':'#F5A6BD',
      },
    },
  },
  plugins: [],
}
