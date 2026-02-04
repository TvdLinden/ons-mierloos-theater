import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="max-w-2xl text-center p-6">
        <h1 className="text-6xl font-extrabold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Pagina niet gevonden</h2>
        <p className="text-zinc-700 dark:text-zinc-300 mb-6">
          De pagina die je zoekt bestaat niet of is verplaatst. Controleer de URL of ga terug naar
          de homepagina.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-4 py-2 bg-primary text-white rounded-md">
            Naar home
          </Link>
          <Link href="/contact" className="px-4 py-2 border border-border rounded-md">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
