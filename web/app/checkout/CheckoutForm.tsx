'use client';

import React, { useEffect, useState } from 'react';
import { useActionState } from 'react';
import ShoppingCart from '@/components/ShoppingCart';
import { useCart } from '@/components/CartContext';
import { validateEmail, normalizeEmail } from '@ons-mierloos-theater/shared/utils/emailValidation';
import { processCheckout, type CheckoutState } from './actions';

type CheckoutFormProps = {
  userName?: string | null;
  userEmail?: string | null;
};

export default function CheckoutForm({ userName, userEmail }: CheckoutFormProps) {
  const { items, removeFromCart, updateQuantity, updateWheelchairAccess } = useCart();
  const [state, formAction, isPending] = useActionState<CheckoutState, FormData>(
    processCheckout,
    {},
  );
  const [couponCode, setCouponCode] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [name, setName] = useState(userName || '');

  // Redirect to Mollie payment page when payment URL is received
  useEffect(() => {
    if (state.paymentUrl) {
      window.location.href = state.paymentUrl;
    }
  }, [state.paymentUrl]);

  // Validate email on blur to avoid annoying users while typing
  const handleEmailBlur = () => {
    const result = validateEmail(email);
    setEmailError(result.error);
    if (result.isValid) {
      setEmail(result.normalized);
    }
  };

  // Clear error when user starts typing again
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError(undefined);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = state.discountAmount || 0;
  const total = subtotal - discount;

  return (
    <div className="w-full max-w-xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Afrekenen</h1>
      <p className="mb-6 text-zinc-700">Rond je bestelling af en betaal je kaartjes.</p>
      <ShoppingCart
        items={items}
        onRemove={removeFromCart}
        onChangeQuantity={updateQuantity}
        onChangeWheelchairAccess={updateWheelchairAccess}
        showCheckoutButton={false}
        showTotal={false}
        showTitle={false}
      />

      {/* Coupon and totals section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
        {!state.couponApplied ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Couponcode"
              className="flex-1 px-3 py-2 border border-border rounded text-sm uppercase"
              style={{ textTransform: 'uppercase' }}
            />
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('checkout-form') as HTMLFormElement;
                if (form) {
                  const formData = new FormData(form);
                  formData.set('action', 'apply-coupon');
                  formData.set('couponCode', couponCode);
                  formAction(formData);
                }
              }}
              disabled={!couponCode || isPending}
              className="px-6 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Toepassen
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-800">Coupon toegepast:</span>
              <span className="text-sm font-mono font-bold text-green-900">{state.couponCode}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCouponCode('');
                const form = document.getElementById('checkout-form') as HTMLFormElement;
                if (form) {
                  const formData = new FormData(form);
                  formData.set('action', 'remove-coupon');
                  formAction(formData);
                }
              }}
              disabled={isPending}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Verwijderen
            </button>
          </div>
        )}

        {state.couponError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
            {state.couponError}
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotaal:</span>
            <span className="font-medium">€{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Korting:</span>
              <span className="font-medium">-€{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
            <span>Totaal:</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form id="checkout-form" action={formAction} className="space-y-6 mt-8">
        {state.error && <div className="p-3 bg-red-100 text-red-800 rounded">{state.error}</div>}
        {state.success && (
          <div className="p-3 bg-green-100 text-green-800 rounded">
            Bestelling succesvol verwerkt!
          </div>
        )}
        <input type="hidden" name="cartItems" value={JSON.stringify(items)} />
        <input type="hidden" name="appliedCoupon" value={state.couponCode || ''} />
        <input type="hidden" name="action" value="checkout" />
        <input
          type="text"
          name="name"
          placeholder="Naam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-3 border rounded"
        />
        <div>
          <input
            type="email"
            name="email"
            placeholder="E-mailadres"
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            required
            className={`w-full p-3 border rounded ${
              emailError ? 'border-red-500' : 'border-border'
            }`}
            aria-invalid={emailError ? 'true' : 'false'}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {emailError}
            </p>
          )}
        </div>
        <div className="flex items-start gap-3 p-4 bg-accent/10 rounded">
          <input
            type="checkbox"
            id="newsletter-subscribe"
            name="subscribeNewsletter"
            className="mt-1 w-4 h-4 text-accent focus:ring-accent border-secondary rounded"
          />
          <label htmlFor="newsletter-subscribe" className="text-sm cursor-pointer">
            Ik wil graag updates ontvangen over nieuwe voorstellingen en speciale aanbiedingen via
            de nieuwsbrief.
          </label>
        </div>
        <button
          type="submit"
          disabled={isPending || items.length === 0 || !!emailError}
          className="px-6 py-3 bg-primary text-surface rounded font-bold hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Bezig...' : 'Naar betalen'}
        </button>
      </form>
    </div>
  );
}
