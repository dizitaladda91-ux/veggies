const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const { globalRateLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorMiddleware');
const routesV1 = require('./routes/v1');
const ApiError = require('./utils/apiError');
const { writeHealthSnapshot } = require('./monitoring/healthcheck');
const referralService = require('./services/referralService');
const fs = require('fs');
const path = require('path');

const app = express();

// Render sits in front of this service and supplies X-Forwarded-For. Trusting
// one proxy lets express-rate-limit identify the original client correctly.
app.set('trust proxy', config.trustProxy);

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '').toLowerCase();

      const isAllowed =
        config.corsOrigins.some((allowed) => {
          if (allowed === '*') return true;
          const normAllowed = allowed.toLowerCase().replace(/\/+$/, '');
          if (normAllowed === normalizedOrigin) return true;
          if (normAllowed.startsWith('*.') && normalizedOrigin.endsWith(normAllowed.slice(1))) return true;
          return false;
        }) ||
        (config.env !== 'production' &&
          (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')));

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

// Body parser & Cookie parser
const razorpayWebhookPath = `${config.apiPrefix || ''}/payments/webhook`;
app.use(razorpayWebhookPath, express.raw({ type: '*/*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
app.use(globalRateLimiter);

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Works even when the affiliate API is deployed without the portal SPA.
// The portal's React route remains supported, but shared links now have a
// server-side redirect fallback as well.
app.get('/ref/:code', async (req, res, next) => {
  try {
    const result = await referralService.trackClick({
      referralCode: req.params.code,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      referrerUrl: req.get('referrer'),
    });
    return res.redirect(302, result.valid ? result.targetUrl : config.storefrontUrl);
  } catch (error) {
    return next(error);
  }
});

// Serve Storefront Auto-Discount SDK Script
app.get(['/veggie-storefront-discount.js', '/alora-storefront-discount.js'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // This file is intentionally embedded by the separate Veggie storefront
  // origin. Helmet's default same-origin policy otherwise blocks the browser
  // from executing it even though CORS is enabled.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Type', 'application/javascript');
  // The script controls checkout pricing display, so storefront visitors
  // should receive updates immediately after a deployment.
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  // This supplement handles prices injected asynchronously by the Shop page
  // and keeps the referral in every same-site navigation.
  const storefrontSdk = `(function () {
    'use strict';
    var params = new URLSearchParams(window.location.search);
    var ref = params.get('ref') || params.get('referral') || params.get('affiliate') || params.get('coupon') || params.get('coupon_code') || params.get('discount_code') || localStorage.getItem('veggie_ref_code') || sessionStorage.getItem('veggie_ref_code');
    if (!ref) return;
    var clickId = params.get('clickId') || params.get('click_id') || localStorage.getItem('veggie_click_id') || sessionStorage.getItem('veggie_click_id') || '';
    localStorage.setItem('veggie_ref_code', ref);
    sessionStorage.setItem('veggie_ref_code', ref);
    if (clickId) { localStorage.setItem('veggie_click_id', clickId); sessionStorage.setItem('veggie_click_id', clickId); }
    document.cookie = 'veggie_ref_code=' + encodeURIComponent(ref) + '; path=/; max-age=2592000; SameSite=Lax';
    var discount = 10;
    window.dispatchEvent(new CustomEvent('veggie:referral-ready', { detail: { refCode: ref, referralCode: ref, clickId: clickId, discountPercent: discount } }));
    function keepReferral(event) {
      var link = event.target.closest && event.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) return;
      try {
        var destination = new URL(href, window.location.origin);
        if (destination.origin === window.location.origin && !destination.searchParams.has('ref')) {
          destination.searchParams.set('ref', ref);
          link.href = destination.toString();
        }
      } catch (_) {}
    }
    function discountedPrices() {
      document.querySelectorAll('body *').forEach(function (element) {
        if (element.children.length || element.dataset.veggiePriceApplied || ['DEL', 'S', 'STRIKE'].includes(element.tagName)) return;
        if (window.getComputedStyle(element).textDecorationLine.includes('line-through')) return;
        var match = element.textContent.trim().match(/^(?:₹|Rs\\.?|INR)\\s*(\\d[\\d,]*(?:\\.\\d{1,2})?)$/i);
        if (!match) return;
        var amount = Number(match[1].replace(/,/g, ''));
        if (!Number.isFinite(amount) || amount <= 0) return;
        var finalAmount = Math.round(amount * (100 - discount)) / 100;
        element.dataset.veggiePriceApplied = 'true';
        element.dataset.veggieOriginalPrice = element.textContent.trim();
        element.textContent = '₹' + finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        var badge = document.createElement('span');
        badge.className = 'veggie-discount-badge';
        badge.textContent = '10% OFF';
        badge.style.cssText = 'display:inline-block;margin-left:6px;padding:2px 6px;border-radius:999px;background:#dcfce7;color:#166534;font:700 11px/1.35 system-ui,sans-serif;vertical-align:middle;white-space:nowrap;';
        element.insertAdjacentElement('afterend', badge);
      });
    }
    document.addEventListener('click', keepReferral, true);
    var run = function () { setTimeout(discountedPrices, 0); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
    new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
  })();`;
  const sdkPath = path.join(__dirname, '../../frontend/public/veggie-storefront-discount.js');
  if (fs.existsSync(sdkPath)) {
    const baseSdk = fs.readFileSync(sdkPath, 'utf8');
    return res.send(`${baseSdk}\n${storefrontSdk}`);
  }

  // Render can deploy only backend/, where frontend/public is unavailable.
  // Do not redirect to another host: a redirect can serve a stale SDK.
  return res.send(storefrontSdk);
});

// Root endpoint
app.get('/', (req, res, next) => {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
  res.status(200).json({
    success: true,
    application: 'Affiliate Management API',
    version: '1.0.0',
    environment: config.env,
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  return require('./database').query('SELECT 1')
    .then(() => {
      const payload = {
        status: 'UP',
        database: 'UP',
        environment: config.env,
        timestamp: new Date().toISOString(),
        uptime: process.uptime().toFixed(2),
      };
      writeHealthSnapshot('UP', payload);
      return res.status(200).json(payload);
    })
    .catch((error) => {
      const payload = {
        status: 'DOWN',
        database: 'DOWN',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
      writeHealthSnapshot('DOWN', payload);
      return res.status(503).json(payload);
    });
});

app.get('/docs', (req, res) => {
  const docsPath = path.join(__dirname, 'docs', 'openapi.json');
  if (fs.existsSync(docsPath)) {
    return res.sendFile(docsPath);
  }
  return res.status(404).json({ message: 'OpenAPI document not found' });
});

// API Routes — e.g. /api/v1/auth/login or /auth/login
if (config.apiPrefix) {
  app.use(config.apiPrefix, routesV1);
} else {
  app.use(routesV1);
}

// Serve static frontend build assets and handle SPA client-side routing fallback
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/health') || req.originalUrl.startsWith('/docs') || (config.apiPrefix && req.originalUrl.startsWith(config.apiPrefix))) {
      return next(ApiError.notFound(`Cannot find route ${req.originalUrl} on this server`));
    }
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Handle 404 for unhandled API requests
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find route ${req.originalUrl} on this server`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
