import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6B0F2A', // darker deep red for better contrast
        secondary: '#FFD700', // gold/yellow from logo
        accent: '#000000', // black
        surface: '#FFFFFF', // white
        muted: '#F5F5F5', // light gray for subtle backgrounds
        border: '#E5E5E5', // light gray for borders
        textPrimary: '#1F2937', // dark gray for primary text
        textSecondary: '#6B7280', // medium gray for secondary text
        success: '#10B981', // green for success states
        error: '#EF4444', // red for errors
        warning: '#F59E0B', // amber for warnings
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.textPrimary'),
            '--tw-prose-headings': theme('colors.primary'),
            '--tw-prose-links': theme('colors.primary'),
            '--tw-prose-bold': theme('colors.textPrimary'),
            '--tw-prose-counters': theme('colors.textSecondary'),
            '--tw-prose-bullets': theme('colors.secondary'),
            '--tw-prose-hr': theme('colors.border'),
            '--tw-prose-quotes': theme('colors.textPrimary'),
            '--tw-prose-quote-borders': theme('colors.secondary'),
            '--tw-prose-captions': theme('colors.textSecondary'),
            '--tw-prose-code': theme('colors.primary'),
            '--tw-prose-pre-code': theme('colors.surface'),
            '--tw-prose-pre-bg': theme('colors.textPrimary'),
            '--tw-prose-th-borders': theme('colors.border'),
            '--tw-prose-td-borders': theme('colors.border'),
            maxWidth: 'none',
            color: 'var(--tw-prose-body)',
            lineHeight: '1.75',
            fontSize: '1rem',
            h1: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '700',
              fontSize: '2.25rem',
              lineHeight: '2.5rem',
              marginTop: '0',
              marginBottom: '1rem',
              fontFamily: theme('fontFamily.display').join(', '),
            },
            h2: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '700',
              fontSize: '1.875rem',
              lineHeight: '2.25rem',
              marginTop: '2rem',
              marginBottom: '1rem',
              fontFamily: theme('fontFamily.display').join(', '),
            },
            h3: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '600',
              fontSize: '1.5rem',
              lineHeight: '2rem',
              marginTop: '1.75rem',
              marginBottom: '0.75rem',
              fontFamily: theme('fontFamily.display').join(', '),
            },
            h4: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '600',
              fontSize: '1.25rem',
              lineHeight: '1.75rem',
              marginTop: '1.5rem',
              marginBottom: '0.5rem',
            },
            a: {
              color: 'var(--tw-prose-links)',
              textDecoration: 'underline',
              textDecorationColor: theme('colors.secondary'),
              textUnderlineOffset: '2px',
              fontWeight: '500',
              '&:hover': {
                color: theme('colors.secondary'),
                textDecorationColor: theme('colors.primary'),
              },
            },
            strong: {
              color: 'var(--tw-prose-bold)',
              fontWeight: '600',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.5rem',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.5rem',
            },
            'ul > li': {
              paddingLeft: '0.375rem',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            'ol > li': {
              paddingLeft: '0.375rem',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            'ul > li::marker': {
              color: 'var(--tw-prose-bullets)',
            },
            'ol > li::marker': {
              color: 'var(--tw-prose-counters)',
            },
            blockquote: {
              fontStyle: 'italic',
              color: 'var(--tw-prose-quotes)',
              borderLeftWidth: '4px',
              borderLeftColor: 'var(--tw-prose-quote-borders)',
              paddingLeft: '1.5rem',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
            code: {
              color: 'var(--tw-prose-code)',
              backgroundColor: theme('colors.muted'),
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'var(--tw-prose-pre-bg)',
              color: 'var(--tw-prose-pre-code)',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflowX: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              color: 'inherit',
              fontSize: 'inherit',
            },
            img: {
              borderRadius: '0.5rem',
              marginTop: '2rem',
              marginBottom: '2rem',
            },
            hr: {
              borderColor: 'var(--tw-prose-hr)',
              marginTop: '3rem',
              marginBottom: '3rem',
            },
            table: {
              width: '100%',
              tableLayout: 'auto',
              textAlign: 'left',
              marginTop: '2rem',
              marginBottom: '2rem',
            },
            thead: {
              borderBottomWidth: '2px',
              borderBottomColor: 'var(--tw-prose-th-borders)',
            },
            'thead th': {
              color: 'var(--tw-prose-headings)',
              fontWeight: '600',
              verticalAlign: 'bottom',
              paddingRight: '0.75rem',
              paddingBottom: '0.75rem',
              paddingLeft: '0.75rem',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: 'var(--tw-prose-td-borders)',
            },
            'tbody td': {
              verticalAlign: 'top',
              paddingTop: '0.75rem',
              paddingRight: '0.75rem',
              paddingBottom: '0.75rem',
              paddingLeft: '0.75rem',
            },
          },
        },
        lg: {
          css: {
            fontSize: '1.125rem',
            lineHeight: '1.75',
            h1: {
              fontSize: '2.5rem',
              lineHeight: '1',
            },
            h2: {
              fontSize: '2rem',
              lineHeight: '2.5rem',
            },
            h3: {
              fontSize: '1.75rem',
              lineHeight: '2.25rem',
            },
          },
        },
        xl: {
          css: {
            fontSize: '1.25rem',
            lineHeight: '1.8',
            h1: {
              fontSize: '3rem',
              lineHeight: '1',
            },
            h2: {
              fontSize: '2.25rem',
              lineHeight: '2.5rem',
            },
            h3: {
              fontSize: '2rem',
              lineHeight: '2.5rem',
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
