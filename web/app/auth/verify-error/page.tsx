import Link from 'next/link';

type VerifyErrorPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function VerifyErrorPage({ searchParams }: VerifyErrorPageProps) {
  const { reason } = await searchParams;

  const messages = {
    'missing-token': 'De verificatie link is ongeldig of ontbreekt.',
    'invalid-token': 'De verificatie link is ongeldig of verlopen.',
    'server-error': 'Er is een fout opgetreden bij het verifiëren van je e-mail.',
  };

  const message =
    reason && reason in messages
      ? messages[reason as keyof typeof messages]
      : 'Er is iets misgegaan.';

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-2 text-error">Verificatie mislukt</h1>
      </div>

      <div className="space-y-4 text-text-secondary">
        <p>{message}</p>

        <div className="bg-error/10 border-l-4 border-error p-4 rounded">
          <p className="text-sm text-error">
            <strong>Probleem?</strong> Controleer of je de juiste link hebt gebruikt of vraag een
            nieuwe verificatie e-mail aan.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href="/auth/resend-verification"
          className="block w-full text-center bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Nieuwe verificatie e-mail aanvragen
        </Link>
        <Link href="/" className="block w-full text-center text-primary hover:underline py-2">
          Terug naar home
        </Link>
      </div>
    </div>
  );
}
