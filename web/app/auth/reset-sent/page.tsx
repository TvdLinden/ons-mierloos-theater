import Link from 'next/link';

export default function ResetSentPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold mb-2 text-primary">Controleer je inbox</h1>
      </div>

      <div className="space-y-4 text-text-secondary">
        <p>
          Als er een account bestaat met dit e-mailadres, hebben we een link gestuurd om je
          wachtwoord opnieuw in te stellen.
        </p>

        <div className="bg-muted border-l-4 border-primary p-4 rounded">
          <p className="text-sm">
            <strong>Let op:</strong> De link is 1 uur geldig. Controleer ook je spam/ongewenste
            e-mail map als je de e-mail niet kunt vinden.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href="/auth/signin"
          className="block w-full text-center bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Terug naar inloggen
        </Link>
        <Link href="/" className="block w-full text-center text-primary hover:underline py-2">
          Terug naar home
        </Link>
      </div>
    </div>
  );
}
