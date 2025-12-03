import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-primary">
      <h1 className="text-4xl font-bold mb-4">Niet gemachtigd</h1>
      <p className="text-lg mb-8">Je hebt geen toestemming om deze pagina te bekijken.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-surface rounded font-semibold hover:bg-secondary"
      >
        Terug naar home
      </Link>
    </div>
  );
}
