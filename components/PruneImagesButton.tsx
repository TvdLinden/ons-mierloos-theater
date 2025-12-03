'use client';

import { useState } from 'react';

export function PruneImagesButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePrune = async () => {
    if (!confirm('Weet je zeker dat je ongebruikte afbeeldingen wilt verwijderen?')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/prune-images', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij opschonen van afbeeldingen');
      }

      setMessage(data.message || `${data.deletedCount} afbeeldingen verwijderd`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePrune}
        disabled={loading}
        className="block w-full px-6 py-4 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors text-left"
      >
        {loading ? 'Bezig met opschonen...' : 'Ongebruikte Afbeeldingen Verwijderen'}
      </button>
      {message && <p className="mt-2 text-green-700 font-medium">{message}</p>}
      {error && <p className="mt-2 text-red-700 font-medium">{error}</p>}
      <p className="mt-2 text-textSecondary">
        Verwijdert afbeeldingen die niet gekoppeld zijn aan voorstellingen.
      </p>
    </div>
  );
}
