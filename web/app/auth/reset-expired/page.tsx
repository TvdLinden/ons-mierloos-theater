import Link from 'next/link';

export default function ResetExpiredPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">⏰</div>
        <h1 className="text-2xl font-bold mb-2 text-error">Link verlopen</h1>
      </div>

      <div className="space-y-4 text-text-secondary">
        <p>
          Deze wachtwoord reset link is verlopen of ongeldig. Reset links zijn 1 uur geldig na
          aanvraag.
        </p>

        <div className="bg-error/10 border-l-4 border-error p-4 rounded">
          <p className="text-sm text-error">
            <strong>Verlopen?</strong> Je kunt een nieuwe reset link aanvragen.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href="/auth/forgot-password"
          className="block w-full text-center bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Nieuwe reset link aanvragen
        </Link>
        <Link href="/" className="block w-full text-center text-primary hover:underline py-2">
          Terug naar home
        </Link>
      </div>
    </div>
  );
}
