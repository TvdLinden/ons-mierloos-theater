'use client';

import React, { useEffect, useState } from 'react';
import { useActionState } from 'react';
import ShoppingCart from '@/components/ShoppingCart';
import { Button } from '@/components/ui/button';
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
    <div
      className="page-parchment min-h-screen pb-20 lg:pb-0"
      style={{ backgroundColor: 'var(--color-parchment)' }}
    >
      <div className="bg-white h-8" />

      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8">
          <h1
            className="text-4xl md:text-5xl font-bold uppercase leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Afrekenen
          </h1>
          <p className="text-muted-foreground mt-2">Rond je bestelling af en betaal je kaartjes.</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left: order summary */}
          <div className="lg:w-[55%] border border-border bg-white p-6 lg:p-8 shadow-lg">
            <h2
              className="text-lg font-bold uppercase mb-5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Bestelling
            </h2>

            <ShoppingCart
              items={items}
              onRemove={removeFromCart}
              onChangeQuantity={updateQuantity}
              onChangeWheelchairAccess={updateWheelchairAccess}
              showCheckoutButton={false}
              showTotal={false}
              showTitle={false}
              inputVariant="public"
            />

            {/* Coupon */}
            <div className="mt-6 pt-5 border-t border-border space-y-3">
              {!state.couponApplied ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Couponcode"
                    className="flex-1 px-3 py-2 border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <Button
                    type="button"
                    variant="maroon"
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
                  >
                    Toepassen
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-success/10 border border-success/30 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Coupon toegepast:</span>
                    <span className="text-sm font-mono font-bold">{state.couponCode}</span>
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
                    className="text-sm text-destructive hover:opacity-80 transition-opacity"
                  >
                    Verwijderen
                  </button>
                </div>
              )}

              {state.couponError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-2">
                  {state.couponError}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotaal</span>
                <span className="font-medium">€{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Korting</span>
                  <span className="font-medium">-€{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-border pt-3 mt-3">
                <span>Totaal</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right: personal details + submit */}
          <div className="lg:w-[45%] border border-border bg-white p-6 lg:p-8 shadow-lg">
            <h2
              className="text-lg font-bold uppercase mb-5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Uw gegevens
            </h2>

            <form id="checkout-form" action={formAction} className="space-y-5">
              {state.error && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 text-sm">
                  {state.error}
                </div>
              )}
              {state.success && (
                <div className="p-3 bg-success/10 text-success border border-success/20 text-sm">
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
                className="w-full p-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className={`w-full p-3 border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    emailError ? 'border-destructive' : 'border-border'
                  }`}
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                {emailError && (
                  <p id="email-error" className="mt-1 text-sm text-destructive">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted">
                <input
                  type="checkbox"
                  id="newsletter-subscribe"
                  name="subscribeNewsletter"
                  className="mt-0.5 w-4 h-4 border-border"
                />
                <label
                  htmlFor="newsletter-subscribe"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Ik wil graag updates ontvangen over nieuwe voorstellingen en speciale aanbiedingen
                  via de nieuwsbrief.
                </label>
              </div>

              <Button
                type="submit"
                variant="maroon"
                size="lg"
                disabled={isPending || items.length === 0 || !!emailError}
                className="w-full"
              >
                {isPending ? 'Bezig...' : 'Naar betalen'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
