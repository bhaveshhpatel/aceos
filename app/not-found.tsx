import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found',
};

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            gap: '1rem',
            color: '#111',
          }}
        >
          <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: 0 }}>404</h1>
          <p style={{ fontSize: '1rem', color: '#666', margin: 0 }}>
            This page doesn&apos;t exist.
          </p>
          <Link
            href="/"
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1.25rem',
              background: '#3355ff',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
