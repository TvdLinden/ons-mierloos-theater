import Link from 'next/link';

export default function ResetSuccessPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2 text-success">Wachtwoord gewijzigd!</h1>
      </div>

      <div className="space-y-4 text-text-secondary">
        <p>Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord.</p>

        <div className="bg-success/10 border-l-4 border-success p-4 rounded">
          <p className="text-sm text-success">
            <strong>Gelukt!</strong> Je account is beveiligd met je nieuwe wachtwoord.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href="/auth/signin"
          className="block w-full text-center bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Inloggen
        </Link>
        <Link href="/" className="block w-full text-center text-primary hover:underline py-2">
          Terug naar home
        </Link>
      </div>
    </div>
  );
}
