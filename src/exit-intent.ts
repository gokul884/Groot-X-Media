// /src/exit-intent.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, addDoc, serverTimestamp, setLogLevel } from "firebase/firestore";
import emailjs from "@emailjs/browser";

const firebaseConfig = {
  apiKey: "AIzaSyDMctiZoQfOOBVZgdMUCmrq4ZJwaDwria4",
  authDomain: "grootxmedia-99d18.firebaseapp.com",
  projectId: "grootxmedia-99d18",
  storageBucket: "grootxmedia-99d18.firebasestorage.app",
  messagingSenderId: "998742275057",
  appId: "1:998742275057:web:e96b55912baec131738a50"
};

// Initialize Firebase safely
let app;
let db: any = null;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Configure log level and long polling to prevent gRPC stream timeout warnings in sandboxed environments
  try {
    setLogLevel("error");
  } catch (e) {
    console.warn("Could not set Firestore log level:", e);
  }

  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (e) {
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// Initialize EmailJS safely
try {
  const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "1U3orAjQlfk88-sZQ";
  emailjs.init(emailjsPublicKey);
} catch (e) {
  console.error("EmailJS initialization failed:", e);
}

// Direct download backup generator
const generateAndDownloadDoc = (type: string, filename: string) => {
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Groot X Media — CRO & Marketing Audit Checklist</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Poppins', sans-serif; background: #fafafa; color: #1e1e24; margin: 0; padding: 40px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 50px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #eee; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #F26522; padding-bottom: 30px; }
        .logo { font-size: 2.2rem; font-weight: 800; color: #F26522; text-decoration: none; display: inline-block; }
        .logo span { color: #1e1e24; }
        .tagline { font-size: 0.9rem; font-weight: 600; letter-spacing: 0.2em; color: #666; margin-top: 5px; text-transform: uppercase; }
        h1 { color: #111; font-size: 2rem; margin-top: 30px; font-weight: 800; }
        h2 { color: #F26522; font-size: 1.4rem; margin-top: 30px; border-left: 4px solid #F26522; padding-left: 15px; }
        p { color: #444; font-size: 1rem; margin-bottom: 20px; }
        .checklist-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
        .checkbox { width: 20px; height: 20px; border: 2px solid #F26522; border-radius: 4px; flex-shrink: 0; display: inline-block; cursor: pointer; }
        .text { font-size: 1rem; color: #444; }
        .text strong { color: #111; }
        .btn-print { background: #F26522; color: white; border: none; padding: 12px 24px; font-size: 1rem; border-radius: 30px; cursor: pointer; font-weight: 600; margin-bottom: 30px; display: inline-block; text-decoration: none; }
        .btn-print:hover { background: #e05413; }
        @media print { .btn-print { display: none; } body { padding: 0; background: white; } .container { box-shadow: none; border: none; padding: 0; } }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 20px;">
        <button class="btn-print" onclick="window.print()">Print or Save as PDF</button>
      </div>
      <div class="container">
        <div class="header">
          <div class="logo">GROOT <span>X</span> MEDIA</div>
          <div class="tagline">— Your Growth Partner —</div>
        </div>
        
        <h1>CRO & Marketing Audit Checklist</h1>
        <p>Conduct a complete self-audit of your current marketing, conversion funnel, and visual landing experience to identify massive optimization opportunities.</p>
        
        <h2>1. Conversion & Landing Experience</h2>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div class="text"><strong>Frictionless Header:</strong> Hero section clearly articulates your core offer in under 5 seconds of loading.</div>
        </div>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div class="text"><strong>Above-The-Fold CTA:</strong> High-contrast call-to-action button visible immediately on load without scrolling.</div>
        </div>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div class="text"><strong>Social Evidence:</strong> Customer faces, testimonial stats, or prominent rating stars shown immediately under the primary hero callout.</div>
        </div>

        <h2>2. Page Loading & Optimization</h2>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div class="text"><strong>Instant LCP:</strong> Main visual elements load in less than 2.0s on standard mobile connections.</div>
        </div>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div class="text"><strong>Image Weight:</strong> All static marketing files are compressed using WebP format.</div>
        </div>

        <h2>3. Social Advertising Systems</h2>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div class="text"><strong>Continuous Creative Testing:</strong> Testing at least 3 distinct copy hooks and visual variations every single week.</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const showFallbackNotice = (containerElement: HTMLElement, errorDetails: string) => {
  const existingNotice = containerElement.querySelector('.email-fallback-notice');
  if (existingNotice) {
    existingNotice.remove();
  }

  const notice = document.createElement('div');
  notice.className = 'email-fallback-notice';
  notice.style.cssText = `
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: oklch(0.985 0.005 262);
    border: 1px dashed oklch(0.85 0.01 262);
    border-radius: 16px;
    font-size: 0.82rem;
    text-align: left;
    color: var(--ink);
    width: 100%;
    animation: fadeInNotice 0.3s ease;
  `;

  notice.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
      <span style="color: oklch(0.66 0.2 45); font-weight: bold; font-size: 1rem; line-height: 1;">⚠️</span>
      <div style="font-weight: 600; color: var(--navy); font-size: 0.86rem;">Email dispatch pending key configuration</div>
    </div>
    <div style="color: var(--ink-soft); margin-bottom: 6px; line-height: 1.4;">
      Your request was saved successfully! However, the automated email couldn't be sent because the default/fallback EmailJS keys are inactive (Error: ${errorDetails}).
    </div>
    <div style="background: oklch(0.95 0.005 262); padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; line-height: 1.35; color: var(--muted); margin-bottom: 10px; font-family: monospace;">
      To enable automated emails, open <strong>AI Studio -> Settings -> Environment Variables</strong> and define: <code>VITE_EMAILJS_PUBLIC_KEY</code>.
    </div>
    <div>
      <button class="btn btn-primary" id="fallbackDownloadBtn" style="width: 100%; font-size: 0.78rem; padding: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; border: none; border-radius: 8px; background: var(--orange); color: white; font-weight: bold;">
        Download Audit Checklist directly
      </button>
    </div>
  `;

  // Insert before the "Done" button if possible
  const doneBtn = containerElement.querySelector('#exit-intent-success-close-btn');
  if (doneBtn) {
    containerElement.insertBefore(notice, doneBtn);
  } else {
    containerElement.appendChild(notice);
  }

  const downloadBtn = notice.querySelector('#fallbackDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateAndDownloadDoc('audit', 'Groot X Media — CRO & Marketing Audit Checklist.html');
    });
  }
};

const sendEmailViaRest = async (serviceId: string, templateId: string, params: any) => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "1U3orAjQlfk88-sZQ";
  const accessToken = import.meta.env.VITE_EMAILJS_ACCESS_TOKEN || "sw4iJHzH9BfWEE00f4lli";

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: accessToken,
    template_params: params
  };

  const emailPromise = (async () => {
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`EmailJS REST API error: ${res.status} - ${text}`);
      }
      console.log("EmailJS audit request sent successfully via REST API!");
      return true;
    } catch (err: any) {
      console.warn("EmailJS REST sending failed, attempting fallback browser SDK:", err);
      try {
        const response = await emailjs.send(serviceId, templateId, params, publicKey);
        console.log("EmailJS audit request sent successfully via fallback SDK:", response.status, response.text);
        return true;
      } catch (fallbackErr: any) {
        const restErrorMsg = err?.message || JSON.stringify(err);
        const fallbackErrorMsg = fallbackErr?.text || fallbackErr?.message || JSON.stringify(fallbackErr);
        throw new Error(`EmailJS sending failed: [REST Error: ${restErrorMsg}] [SDK Error: ${fallbackErrorMsg}]`);
      }
    }
  })();

  // Add a strict 4000ms timeout for the entire EmailJS process
  return await Promise.race([
    emailPromise,
    new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error("EmailJS sending timed out after 4000ms")), 4000))
  ]);
};

/**
 * Groot X Media - Exit-Intent Lead Capture System
 * Offers a premium, high-converting complimentary marketing audit.
 * Fully self-contained styles, HTML injection, and triggers.
 */

const injectExitIntentStyles = () => {
  const styleId = 'exit-intent-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* Overlay Backdrop */
    .exit-intent-overlay {
      position: fixed;
      inset: 0;
      background: oklch(0.12 0.03 262 / 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 2147483647; /* Ensure it floats above everything else, including header and chat widgets */
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 20px;
    }
    .exit-intent-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* Modal Container */
    .exit-intent-modal {
      background: var(--card, #ffffff);
      border: 1px solid var(--line, oklch(0.92 0.006 262));
      border-radius: 24px;
      width: 100%;
      max-width: 580px;
      padding: 40px;
      position: relative;
      box-shadow: 0 30px 70px -15px oklch(0.15 0.04 262 / 0.3);
      transform: scale(0.9) translateY(30px);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      color: var(--ink, oklch(0.28 0.05 262));
      overflow: hidden;
      font-family: 'Poppins', system-ui, sans-serif;
    }
    .exit-intent-overlay.active .exit-intent-modal {
      transform: scale(1) translateY(0);
    }

    /* Background blobs for visual intrigue */
    .exit-intent-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.12;
      z-index: 0;
      pointer-events: none;
    }

    /* Custom Close button */
    .exit-intent-close {
      position: absolute;
      top: 24px;
      right: 24px;
      border: none;
      background: oklch(0.96 0.01 262);
      cursor: pointer;
      color: var(--muted, oklch(0.58 0.02 262));
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 10;
    }
    .exit-intent-close:hover {
      background: var(--orange, oklch(0.66 0.2 45));
      color: #ffffff;
      transform: scale(1.1) rotate(90deg);
    }
    .exit-intent-close:active {
      transform: scale(0.95);
    }

    /* Content and Typography */
    .exit-intent-content {
      position: relative;
      z-index: 1;
    }
    .exit-intent-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: oklch(0.66 0.2 45 / 0.1);
      border: 1px solid oklch(0.66 0.2 45 / 0.25);
      border-radius: 99px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--orange, oklch(0.66 0.2 45));
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .exit-intent-title {
      font-size: 1.8rem;
      font-weight: 800;
      line-height: 1.25;
      color: var(--ink, oklch(0.28 0.05 262));
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .exit-intent-title .highlight {
      color: var(--orange, oklch(0.66 0.2 45));
    }
    .exit-intent-desc {
      font-size: 0.94rem;
      color: var(--ink-soft, oklch(0.4 0.04 262));
      margin-bottom: 26px;
      line-height: 1.55;
    }

    /* Bullet List Cards */
    .exit-intent-bullets {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 28px;
    }
    .exit-intent-bullet {
      display: flex;
      gap: 14px;
      background: var(--card-2, oklch(0.98 0.006 262));
      border: 1px solid var(--line, oklch(0.92 0.006 262));
      padding: 14px 18px;
      border-radius: 14px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .exit-intent-bullet:hover {
      transform: translateX(4px);
      border-color: oklch(0.66 0.2 45 / 0.3);
    }
    .exit-intent-bullet-icon {
      color: var(--orange, oklch(0.66 0.2 45));
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }
    .exit-intent-bullet-text h4 {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--ink, oklch(0.28 0.05 262));
      margin-bottom: 2px;
    }
    .exit-intent-bullet-text p {
      font-size: 0.82rem;
      color: var(--muted, oklch(0.58 0.02 262));
      line-height: 1.4;
    }

    /* Forms & Fields */
    .exit-intent-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .exit-intent-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 480px) {
      .exit-intent-row {
        grid-template-columns: 1fr;
      }
      .exit-intent-modal {
        padding: 30px 20px;
      }
      .exit-intent-title {
        font-size: 1.45rem;
      }
    }
    .exit-intent-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .exit-intent-field label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ink-soft, oklch(0.4 0.04 262));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .exit-intent-field input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid var(--line, oklch(0.92 0.006 262));
      border-radius: 12px;
      background: var(--card-2, oklch(0.98 0.006 262));
      color: var(--ink, oklch(0.28 0.05 262));
      font-family: inherit;
      font-size: 0.94rem;
      transition: all 0.25s ease;
    }
    .exit-intent-field input:focus {
      outline: none;
      border-color: var(--orange, oklch(0.66 0.2 45));
      box-shadow: 0 0 0 4px oklch(0.66 0.2 45 / 0.15);
      background: var(--card, #ffffff);
    }
    .exit-intent-submit {
      width: 100%;
      padding: 14px 28px;
      background: var(--orange, oklch(0.66 0.2 45));
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 0.98rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 10px 24px -10px oklch(0.66 0.2 45 / 0.7);
    }
    .exit-intent-submit:hover {
      background: var(--orange-deep, oklch(0.6 0.2 42));
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -10px oklch(0.66 0.2 45 / 0.85);
    }
    .exit-intent-submit:active {
      transform: translateY(0);
    }
    .exit-intent-submit svg {
      transition: transform 0.2s ease;
    }
    .exit-intent-submit:hover svg {
      transform: translateX(4px);
    }

    /* Trust indicators */
    .exit-intent-footer-text {
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted, oklch(0.58 0.02 262));
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    /* Success State View */
    .exit-intent-success-container {
      display: none;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px 0;
    }
    .exit-intent-success-container.active {
      display: flex;
      animation: exitIntentFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .exit-intent-success-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: oklch(0.85 0.18 140 / 0.15);
      border: 2px solid oklch(0.62 0.17 140);
      color: oklch(0.62 0.17 140);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px oklch(0.62 0.17 140 / 0.25);
      animation: exitIntentPulse 2s infinite;
    }
    @keyframes exitIntentPulse {
      0% { box-shadow: 0 0 0 0 oklch(0.62 0.17 140 / 0.4); }
      70% { box-shadow: 0 0 0 12px oklch(0.62 0.17 140 / 0); }
      100% { box-shadow: 0 0 0 0 oklch(0.62 0.17 140 / 0); }
    }
    .exit-intent-success-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--ink, oklch(0.28 0.05 262));
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    .exit-intent-success-desc {
      font-size: 0.95rem;
      color: var(--ink-soft, oklch(0.4 0.04 262));
      line-height: 1.6;
      margin-bottom: 28px;
      max-width: 440px;
    }
    .exit-intent-success-desc strong {
      color: var(--orange, oklch(0.66 0.2 45));
      font-weight: 600;
    }
    .exit-intent-success-btn {
      padding: 12px 30px;
      background: var(--orange, oklch(0.66 0.2 45));
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 10px 24px -10px oklch(0.66 0.2 45 / 0.5);
    }
    .exit-intent-success-btn:hover {
      background: var(--orange-deep, oklch(0.6 0.2 42));
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -10px oklch(0.66 0.2 45 / 0.75);
    }

    /* Spinning animation for submit button loading */
    @keyframes exitIntentSpin {
      to { transform: rotate(360deg); }
    }
    .exit-intent-spinner {
      animation: exitIntentSpin 1s linear infinite;
    }

    /* Fade In Anim */
    @keyframes exitIntentFadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
};

const createExitIntentHTML = () => {
  if (document.getElementById('exit-intent-popup')) return;

  const overlay = document.createElement('div');
  overlay.id = 'exit-intent-popup';
  overlay.className = 'exit-intent-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="exit-intent-modal">
      <!-- Background Decorative Blobs -->
      <div class="exit-intent-blob" style="width: 220px; height: 220px; background: var(--blob-orange, oklch(0.84 0.12 55)); top: -60px; right: -60px;"></div>
      <div class="exit-intent-blob" style="width: 180px; height: 180px; background: var(--blob-navy, oklch(0.74 0.09 262)); bottom: -60px; left: -60px;"></div>

      <!-- Close Button -->
      <button class="exit-intent-close" id="exit-intent-close-btn" aria-label="Close complimentary offer">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- Step 1: Claim Offer Form -->
      <div class="exit-intent-content" id="exit-intent-form-state">
        <div class="exit-intent-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
            <polygon points="12 2 2 7 12 12 12 2"></polygon>
            <path d="M2 17h20"></path>
          </svg>
          Complimentary Resource
        </div>
        
        <h3 class="exit-intent-title">Wait! Claim Your Free <span class="highlight">Marketing Audit</span></h3>
        <p class="exit-intent-desc">Before you head out, our growth engineers will scan your website & competitor landscapes to build a high-impact roadmap for ₹0.</p>
        
        <div class="exit-intent-bullets">
          <div class="exit-intent-bullet">
            <div class="exit-intent-bullet-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="exit-intent-bullet-text">
              <h4>SEO & Performance Scan</h4>
              <p>Uncover search visibility bottlenecks and loading-speed leaks affecting your ranking.</p>
            </div>
          </div>
          
          <div class="exit-intent-bullet">
            <div class="exit-intent-bullet-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="exit-intent-bullet-text">
              <h4>Conversion Rate (CRO) Checklist</h4>
              <p>Actionable user interface recommendations to instantly double your inbound leads.</p>
            </div>
          </div>
        </div>

        <form class="exit-intent-form" id="exit-intent-form-element">
          <div class="exit-intent-row">
            <div class="exit-intent-field">
              <label for="exit-fullname">Full Name</label>
              <input type="text" id="exit-fullname" placeholder="E.g., Ishaan Sen" required />
            </div>
            <div class="exit-intent-field">
              <label for="exit-email">Business Email</label>
              <input type="email" id="exit-email" placeholder="you@company.com" required />
            </div>
          </div>
          
          <div class="exit-intent-field">
            <label for="exit-website">Website URL</label>
            <input type="url" id="exit-website" placeholder="https://example.com" required />
          </div>
          
          <button type="submit" class="exit-intent-submit" id="exit-intent-submit-btn">
            Claim My Free Audit
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </form>

        <div class="exit-intent-footer-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          🔒 No credit card required. 100% confidential. No spam, ever.
        </div>
      </div>

      <!-- Step 2: Success State View -->
      <div class="exit-intent-success-container" id="exit-intent-success-state">
        <div class="exit-intent-success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        
        <h3 class="exit-intent-success-title">Your Audit is Scheduled!</h3>
        <p class="exit-intent-success-desc" id="exit-intent-success-desc-text">
          Thank you, <strong>Name</strong>! Our senior growth strategist is already compiling a custom SEO, speed, and conversion breakdown for <strong>website.com</strong>. We will email the report directly to <strong>email@domain.com</strong> within 24 hours.
        </p>
        
        <button class="exit-intent-success-btn" id="exit-intent-success-close-btn">Done</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
};

const initExitIntentSystem = () => {
  // Completely disabled as per user request to remove complementary resource and startup popups.
  return;
  injectExitIntentStyles();
  createExitIntentHTML();

  const overlay = document.getElementById('exit-intent-popup');
  const closeBtn = document.getElementById('exit-intent-close-btn');
  const successCloseBtn = document.getElementById('exit-intent-success-close-btn');
  const formState = document.getElementById('exit-intent-form-state');
  const successState = document.getElementById('exit-intent-success-state');
  const formElement = document.getElementById('exit-intent-form-element') as HTMLFormElement;
  const successDescText = document.getElementById('exit-intent-success-desc-text');

  if (!overlay || !closeBtn || !successCloseBtn || !formState || !successState || !formElement || !successDescText) {
    return;
  }

  const showModal = () => {
    // Frequency control: At most once per user session
    if (sessionStorage.getItem('groot_exit_audit_shown') === 'true') {
      return;
    }
    overlay.classList.add('active');
    sessionStorage.setItem('groot_exit_audit_shown', 'true');
  };

  const hideModal = () => {
    overlay.classList.remove('active');
  };

  // Close triggers
  closeBtn.addEventListener('click', hideModal);
  successCloseBtn.addEventListener('click', hideModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      hideModal();
    }
  });

  // Desktop Exit-Intent Trigger: Mouse leaves top of page
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 30) {
      showModal();
    }
  });

  // Desktop Alternative Exit-Intent Trigger: Quick movement towards the top boundary
  let lastY = 0;
  document.addEventListener('mousemove', (e) => {
    const currentY = e.clientY;
    const velocityY = currentY - lastY;
    lastY = currentY;

    // Fast upward acceleration very close to top
    if (currentY < 15 && velocityY < -15) {
      showModal();
    }
  });

  // Mobile Friendly Trigger Fallback: User scrolls deeply or stays for 15s
  let mobileTriggered = false;
  
  const triggerMobileTimer = setTimeout(() => {
    if (window.innerWidth <= 768 && !mobileTriggered) {
      mobileTriggered = true;
      showModal();
    }
  }, 15000); // 15 seconds dwell time

  window.addEventListener('scroll', () => {
    if (mobileTriggered) return;
    
    // Check scroll percentage
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrollPos = window.scrollY || window.pageYOffset;
    
    const scrollPercent = (scrollPos + clientHeight) / scrollHeight;
    if (scrollPercent > 0.8) {
      mobileTriggered = true;
      clearTimeout(triggerMobileTimer);
      
      // Trigger on mobile devices specifically on scroll
      if (window.innerWidth <= 768) {
        setTimeout(showModal, 800);
      }
    }
  });

  // Form Submission Handler with real Firebase + EmailJS integrations
  formElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('exit-fullname') as HTMLInputElement;
    const emailInput = document.getElementById('exit-email') as HTMLInputElement;
    const websiteInput = document.getElementById('exit-website') as HTMLInputElement;
    const submitBtn = document.getElementById('exit-intent-submit-btn');

    if (!nameInput || !emailInput || !websiteInput || !submitBtn) return;

    const fullname = nameInput.value.trim();
    const email = emailInput.value.trim();
    let website = websiteInput.value.trim();

    // Clean up website label for display
    let displayWebsite = website;
    try {
      if (!displayWebsite.startsWith('http://') && !displayWebsite.startsWith('https://')) {
        displayWebsite = 'https://' + displayWebsite;
      }
      const urlObj = new URL(displayWebsite);
      displayWebsite = urlObj.hostname;
    } catch (_) {
      // Fallback if parsing fails
    }

    // Set loading spinner state on CTA button
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg class="exit-intent-spinner" style="width: 18px; height: 18px; animation: exitIntentSpin 1s linear infinite; margin-right: 8px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Submitting Request...
    `;
    submitBtn.setAttribute('disabled', 'true');

    // 1. Try to save to Firebase Firestore
    if (db) {
      try {
        const firestorePromise = addDoc(collection(db, "leads"), {
          name: fullname,
          email: email,
          website: website,
          timestamp: serverTimestamp(),
          source: "exit_intent_audit",
          status: "audit_requested"
        });
        // Add a strict 1500ms timeout to prevent Firestore writes from blocking or hanging on connection issues
        await Promise.race([
          firestorePromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore write timed out")), 1500))
        ]);
        console.log("Exit audit lead saved to Firebase!");
      } catch (firebaseError) {
        console.warn("Firebase Firestore exit lead save failed or timed out:", firebaseError);
      }
    } else {
      console.warn("Firebase not initialized. Skipping Firestore save.");
    }

    // 2. Send email via EmailJS (Primary REST API + Fallback SDK)
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_dqbmfj9";
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_0z9dwgn";

    let emailSent = true;
    let emailError = "";

    try {
      const templateParams = {
        to_email: email,
        email: email,
        user_email: email,
        to_name: fullname,
        name: fullname,
        website: website,
        reply_to: "no-reply@grootxmedia.com",
        message: `Complimentary digital audit requested for website: ${website}. Our team is working on your audit!`,
        subject: "Your Free Groot X Media Marketing Audit & CRO Checklist"
      };

      await sendEmailViaRest(serviceId, templateId, templateParams);
      console.log("EmailJS brochure/audit dispatch successful!");
    } catch (emailjsError: any) {
      emailSent = false;
      emailError = emailjsError?.message || emailjsError?.text || JSON.stringify(emailjsError);
      console.warn("EmailJS exit form sending failed details (gracefully ignoring to avoid blocking user feedback):", emailError);
    }

    // Dynamic confirmation response
    successDescText.innerHTML = `
      Thank you, <strong>${escapeHTMLEntities(fullname)}</strong>! Our growth strategists have queued <strong>${escapeHTMLEntities(displayWebsite)}</strong> for a complete performance review. We will email your custom audit report directly to <strong>${escapeHTMLEntities(email)}</strong> within 24 hours.
    `;

    // Transition views smoothly
    formState.style.display = 'none';
    successState.classList.add('active');

    if (!emailSent) {
      showFallbackNotice(successState, emailError || "EmailJS keys not configured");
    }

    // Trigger custom success Toast message on page if it exists
    if (typeof (window as any).showToastNotification === 'function') {
      (window as any).showToastNotification(
        emailSent ? 'Marketing audit scheduled successfully!' : 'Request logged! Connection issue sending report.',
        !emailSent
      );
    } else if (typeof (window as any).showToast === 'function') {
      (window as any).showToast('Marketing audit scheduled successfully!');
    } else {
      // Fallback custom styled toast if no global handler loaded yet
      const fallbackNotify = (window as any).showToastNotification || (window as any).showToast;
      if (!fallbackNotify) {
        // Create manual element fallback
        let container = document.getElementById('toastContainer');
        if (!container) {
          container = document.createElement('div');
          container.id = 'toastContainer';
          container.className = 'toast-container';
          document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.style.cssText = `
          display: flex;
          align-items: center;
          gap: 12px;
          background: oklch(0.2 0.04 243 / 0.95);
          border: 1px solid oklch(1 0 0 / 0.15);
          color: #fff;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 0.92rem;
          font-weight: 500;
          box-shadow: 0 10px 30px oklch(0.1 0.02 243 / 0.5);
          pointer-events: auto;
          backdrop-filter: blur(8px);
        `;
        toast.innerHTML = `
          <div style="width: 28px; height: 28px; border-radius: 50%; background: ${emailSent ? 'oklch(0.45 0.18 142 / 0.2)' : 'oklch(0.6 0.18 29 / 0.2)'}; color: ${emailSent ? 'oklch(0.45 0.18 142)' : 'oklch(0.6 0.18 29)'}; display: grid; place-items: center; font-weight: bold;">
            ${emailSent ? '✓' : '✗'}
          </div>
          <div style="flex: 1;">${emailSent ? 'Marketing audit scheduled successfully!' : 'Request logged! Connection issue sending report.'}</div>
        `;
        container.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 400);
        }, 4000);
      }
    }
  });
};

const escapeHTMLEntities = (str: string) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Start system on page load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initExitIntentSystem();
} else {
  document.addEventListener('DOMContentLoaded', initExitIntentSystem);
}
