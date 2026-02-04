import Link from 'next/link';

export default function VerifyPendingPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold mb-2 text-primary">Controleer je inbox</h1>
      </div>

      <div className="space-y-4 text-text-secondary">
        <p>
          We hebben een verificatie e-mail naar je gestuurd. Klik op de link in de e-mail om je
          account te activeren.
        </p>

        <div className="bg-muted border-l-4 border-primary p-4 rounded">
          <p className="text-sm">
            <strong>Let op:</strong> De link is 24 uur geldig. Controleer ook je spam/ongewenste
            e-mail map als je de e-mail niet kunt vinden.
          </p>
        </div>

        <p className="text-sm">
          Heb je de e-mail niet ontvangen?{' '}
          <Link href="/auth/resend-verification" className="text-primary hover:underline">
            Stuur opnieuw
          </Link>
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-primary hover:underline">
          Terug naar home
        </Link>
      </div>
    </div>
  );
}
