import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trackReferralClick } from '../services/referralService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const RedirectRef = () => {
  const { code } = useParams();
  const storefrontUrl = (import.meta.env.VITE_STOREFRONT_URL || 'https://veggieradiance.com').replace(/\/$/, '');

  useEffect(() => {
    const processClick = async () => {
      try {
        if (code) {
          localStorage.setItem('affiliate_ref_code', code);
          const result = await trackReferralClick(code);

          // Invalid or inactive links must never unlock the storefront offer.
          if (!result?.valid) {
            window.location.replace(storefrontUrl);
            return;
          }

          if (result?.clickId) localStorage.setItem('affiliate_click_id', result.clickId);
          const discountVal = result?.discountPercent || 10;
          localStorage.setItem('affiliate_discount_percent', String(discountVal));

          let redirectUrl = result?.targetUrl;
          if (!redirectUrl || !redirectUrl.startsWith('http')) {
            const urlObj = new URL(storefrontUrl);
            urlObj.searchParams.set('ref', code);
            urlObj.searchParams.set('discount', String(discountVal));
            if (result?.clickId) urlObj.searchParams.set('clickId', result.clickId);
            redirectUrl = urlObj.toString();
          }

          window.location.replace(redirectUrl);
        } else {
          window.location.replace(storefrontUrl);
        }
      } catch (err) {
        console.error('Failed to record click event', err);
        try {
          const fallbackUrl = new URL(storefrontUrl);
          if (code) {
            fallbackUrl.searchParams.set('ref', code);
            fallbackUrl.searchParams.set('discount', '10');
          }
          window.location.replace(fallbackUrl.toString());
        } catch (e) {
          window.location.replace(storefrontUrl);
        }
      }
    };
    processClick();
  }, [code, storefrontUrl]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner />
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Redirecting via referral partner...
      </p>
    </div>
  );
};
