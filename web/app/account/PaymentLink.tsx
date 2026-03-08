'use client';

export function PaymentLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="inline-block mt-2 text-xs font-medium text-amber-700 underline underline-offset-2"
    >
      Betaling voltooien →
    </a>
  );
}
