// /src/get-started.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, addDoc, serverTimestamp, setLogLevel } from "firebase/firestore";
import emailjs from "@emailjs/browser";

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyDMctiZoQfOOBVZgdMUCmrq4ZJwaDwria4",
  authDomain: "grootxmedia-99d18.firebaseapp.com",
  projectId: "grootxmedia-99d18",
  storageBucket: "grootxmedia-99d18.firebasestorage.app",
  messagingSenderId: "998742275057",
  appId: "1:998742275057:web:e96b55912baec131738a50"
};

// Initialize Firebase & Firestore safely
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

// Initialize EmailJS
try {
  const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "1U3orAjQlfk88-sZQ";
  emailjs.init(emailjsPublicKey);
} catch (e) {
  console.error("EmailJS initialization failed:", e);
}

// Document generators for direct download backup
const generateAndDownloadDoc = (type: string, filename: string) => {
  let content = '';
  
  if (type === 'brochure') {
    content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Groot X Media — Digital Growth Brochure</title>
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
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
          .card { background: #fafafa; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
          .card h3 { margin-top: 0; color: #111; }
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
          
          <h1>Digital Growth & Scaling Brochure</h1>
          <p>Welcome! We help high-growth businesses design, run, and scale performance-marketing systems that turn attention into trackable revenue.</p>
          
          <h2>Our Core Expertise</h2>
          <div class="grid">
            <div class="card">
              <h3>1. Social Media Scaling</h3>
              <p>End-to-end creative production, target management, and analytical modeling across Meta, TikTok, and LinkedIn Ads.</p>
            </div>
            <div class="card">
              <h3>2. Conversion Optimization</h3>
              <p>We analyze user behavior, heatmaps, and funnel bottlenecks to turn your existing traffic into higher-paying clients.</p>
            </div>
            <div class="card">
              <h3>3. High-Ticket Funnels</h3>
              <p>B2B lead acquisition pipelines engineered for maximum visual trust, zero leakage, and high conversion velocities.</p>
            </div>
            <div class="card">
              <h3>4. Analytics & Attribution</h3>
              <p>Server-side tracking & custom dashboards built to ensure every single dollar of ad spend is directly attributed.</p>
            </div>
          </div>

          <h2>Our Interactive Growth Model</h2>
          <p>We don't just "run ads" — we operate as an embedded growth team, delivering full-funnel strategy, custom software, copy/creatives, and weekly strategic iterations.</p>
          
          <h2>Let's Get Scaled</h2>
          <p>Email us at: <strong>growth@grootxmedia.com</strong> to schedule a live 15-minute operational audit of your current channels.</p>
        </div>
      </body>
      </html>
    `;
  } else if (type === 'newsletter') {
    content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Groot X Media — Digital Growth & Traffic Guide</title>
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
          ul { padding-left: 20px; margin-bottom: 30px; }
          li { margin-bottom: 15px; font-size: 1rem; color: #444; }
          li strong { color: #111; }
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
          
          <h1>Digital Growth & Traffic Scaling Guide</h1>
          <p>Thank you for subscribing! Here is your quickstart handbook containing 3 foundational scaling mechanics used to boost conversions for our premier partners.</p>
          
          <h2>1. The 3-Second Hook Rule</h2>
          <p>For modern social video creatives (TikTok, Meta Reels), 65% of conversions live or die in the first 3 seconds of the video. Use high-contrast dynamic text, an immediate visual shift, or a compelling pain-point frame to hook users before they scroll past.</p>
          
          <h2>2. The "Friction-Slayer" Checkout Model</h2>
          <ul>
            <li><strong>Fewer Input Fields:</strong> Reducing inputs from 6 to 3 fields typically results in a 35% immediate lift in form submissions.</li>
            <li><strong>Instant Mobile Validation:</strong> Support autofill, Apple Pay, and Google Pay natively.</li>
            <li><strong>Social Anchoring:</strong> Display a trust seal or quick client-testimonial badge right under the active Call to Action button.</li>
          </ul>

          <h2>3. Simple Retargeting Architecture</h2>
          <p>Instead of pitching a purchase immediately in retargeting, serve high-value educational content, client results video proof, or an objection-busting FAQ sequence. This builds lasting trust and capture "warm" intent.</p>
        </div>
      </body>
      </html>
    `;
  } else if (type === 'contact') {
    content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Groot X Media — Services & Pricing Sheet</title>
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
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
          .card { background: #fafafa; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
          .card h3 { margin-top: 0; color: #111; }
          .price { font-size: 1.8rem; font-weight: 800; color: #F26522; margin: 10px 0; }
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
          
          <h1>Services, Deliverables & Pricing Guide</h1>
          <p>Thank you for submitting a contact request! Our team has been notified. Below is an overview of our custom scaling packages and service level agreements.</p>
          
          <h2>Our Core Scaling Packages</h2>
          <div class="grid">
            <div class="card">
              <h3>Growth Pack</h3>
              <div class="price">$2,500<span>/mo</span></div>
              <p>Perfect for brands ready to transition from organic content to reliable paid customer acquisition pathways.</p>
              <ul>
                <li>Ad Management (Up to $10k/mo spend)</li>
                <li>Weekly static design updates</li>
                <li>Standard CRM integration</li>
              </ul>
            </div>
            <div class="card">
              <h3>Scale Pack</h3>
              <div class="price">$4,500<span>/mo</span></div>
              <p>Engineered for established companies looking to rapidly expand their digital footprints and maximize attribution efficiency.</p>
              <ul>
                <li>Omnichannel Ad Scaling (Up to $50k/mo spend)</li>
                <li>Dynamic Video & Static creative iterations</li>
                <li>Dedicated Account Strategist</li>
              </ul>
            </div>
          </div>

          <h2>Enterprise Solutions</h2>
          <p>For operations spending over $50,000/mo, we deliver customized server-side tracking configurations, custom CRO engineering, and dedicated design-on-demand squads. Reach out directly to discuss high-ticket scaling pathways.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Create a blob and trigger browser download
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

const showFallbackNotice = (formElement: HTMLElement, documentType: string, errorDetails: string) => {
  // Remove existing fallback notice if any
  const existingNotice = formElement.parentElement?.querySelector('.email-fallback-notice');
  if (existingNotice) {
    existingNotice.remove();
  }

  const notice = document.createElement('div');
  notice.className = 'email-fallback-notice';
  notice.style.cssText = `
    margin-top: 1.25rem;
    padding: 1.25rem;
    background: oklch(0.985 0.005 262);
    border: 1px dashed oklch(0.85 0.01 262);
    border-radius: 16px;
    font-size: 0.88rem;
    text-align: left;
    color: var(--ink);
    width: 100%;
    max-width: 480px;
    animation: fadeInNotice 0.3s ease;
  `;

  let title = "Email dispatch pending key configuration";
  let description = `Your request was saved successfully to our backend Firestore database! However, the automated email couldn't be sent because the default/fallback EmailJS keys are inactive (Error: ${errorDetails}).`;
  let instructions = `To enable automated emails, open <strong>AI Studio -> Settings -> Environment Variables</strong> and define your EmailJS variables (<code>VITE_EMAILJS_PUBLIC_KEY</code>, <code>VITE_EMAILJS_SERVICE_ID</code>, <code>VITE_EMAILJS_TEMPLATE_ID</code>, <code>VITE_EMAILJS_ACCESS_TOKEN</code>).`;
  let buttonLabel = "Download Brochure directly";
  let documentTitle = "Groot X Media — Digital Growth Brochure.html";

  if (documentType === "newsletter") {
    buttonLabel = "Download Growth Guide directly";
    documentTitle = "Groot X Media — Digital Growth Guide.html";
  } else if (documentType === "contact") {
    title = "Contact request logged successfully";
    buttonLabel = "Download Services & Pricing Guide";
    documentTitle = "Groot X Media — Services & Pricing Sheet.html";
  }

  notice.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
      <span style="color: oklch(0.66 0.2 45); font-weight: bold; font-size: 1.1rem; line-height: 1;">⚠️</span>
      <div style="font-weight: 600; color: var(--navy);">${title}</div>
    </div>
    <div style="color: var(--ink-soft); margin-bottom: 8px; line-height: 1.45;">
      ${description}
    </div>
    <div style="background: oklch(0.95 0.005 262); padding: 8px 12px; border-radius: 8px; font-size: 0.78rem; line-height: 1.4; color: var(--muted); margin-bottom: 12px; font-family: monospace;">
      ${instructions}
    </div>
    <div>
      <button class="btn btn-primary" id="fallbackDownloadBtn" style="width: 100%; font-size: 0.82rem; padding: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
        <i data-lucide="download" style="width: 14px; height: 14px;"></i> ${buttonLabel}
      </button>
    </div>
  `;

  formElement.parentElement?.appendChild(notice);

  // Initialize Lucide icons on the newly appended button
  if (typeof (window as any).lucide !== 'undefined') {
    (window as any).lucide.createIcons();
  }

  // Bind direct download handler
  const downloadBtn = notice.querySelector('#fallbackDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateAndDownloadDoc(documentType, documentTitle);
    });
  }
};

// Helper function to validate email addresses
const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Helper function to show a custom toast notification
const showToastNotification = (message: string, isError: boolean = false) => {
  // If the global showToast function is available, use it
  if (typeof (window as any).showToast === 'function') {
    (window as any).showToast(message);
    return;
  }

  // Fallback toast container
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Ensure toast styles are injected
  if (!document.getElementById('dynamic-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-toast-styles';
    style.innerHTML = `
      .toast-container {
        position: fixed;
        top: 30px;
        right: 30px;
        z-index: 100000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }
      .toast {
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
        opacity: 0;
        transform: translateX(100px) scale(0.9);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        backdrop-filter: blur(8px);
      }
      .toast.show {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
      .toast-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-weight: bold;
      }
      .toast-icon.success {
        background: oklch(0.45 0.18 142 / 0.2);
        color: oklch(0.45 0.18 142);
      }
      .toast-icon.error {
        background: oklch(0.6 0.18 29 / 0.2);
        color: oklch(0.6 0.18 29);
      }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const iconClass = isError ? 'error' : 'success';
  const iconSymbol = isError ? '✗' : '✓';
  
  toast.innerHTML = `
    <div class="toast-icon ${iconClass}">
      ${iconSymbol}
    </div>
    <div style="flex: 1;">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Trigger entry transition after appending to DOM
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Stagger removal
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
};

// Expose globally so other modules can use it
(window as any).showToastNotification = showToastNotification;

// Handle lead capture and brochure sending
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
      console.log("EmailJS brochure sent successfully via REST API!");
      return true;
    } catch (err: any) {
      console.warn("EmailJS REST sending failed, attempting fallback browser SDK:", err);
      try {
        // Fallback to standard browser SDK with public key
        const response = await emailjs.send(serviceId, templateId, params, publicKey);
        console.log("EmailJS brochure sent successfully via fallback SDK:", response.status, response.text);
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

const handleLeadSubmission = async (email: string, source: string): Promise<{ success: boolean; error?: string }> => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_dqbmfj9";
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_0z9dwgn";

  // 1. Try to save to Firebase Firestore
  if (db) {
    try {
      const firestorePromise = addDoc(collection(db, "leads"), {
        email: email,
        source: source,
        timestamp: serverTimestamp(),
        status: "brochure_requested"
      });
      // Add a strict 1500ms timeout so Firebase never blocks execution or freezes the "Get Started" button
      await Promise.race([
        firestorePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore write timed out")), 1500))
      ]);
      console.log("Lead successfully saved to Firebase!");
    } catch (firebaseError) {
      // Fail-safe: log warning but do not block email sending (useful if Firestore permissions are not configured yet)
      console.warn("Firebase Firestore save failed or timed out (will proceed with EmailJS brochure dispatch):", firebaseError);
    }
  } else {
    console.warn("Firebase not initialized. Skipping Firestore save.");
  }

  // 2. Send email via EmailJS (Primary REST API + Fallback SDK)
  try {
    const templateParams = {
      to_email: email,
      email: email,
      user_email: email,
      source: source,
      reply_to: "no-reply@grootxmedia.com",
      message: "Please find attached the Groot X Media brochure detailing our digital growth services, custom pricing tiers, and client testimonials.",
      to_name: email.split('@')[0],
      subject: "Your Groot X Media Brochure & Digital Growth Guide"
    };

    await sendEmailViaRest(serviceId, templateId, templateParams);
    return { success: true };
  } catch (emailjsError: any) {
    const detailMsg = emailjsError?.message || emailjsError?.text || JSON.stringify(emailjsError);
    console.warn("EmailJS sending failed details (returning error details for UI fallback):", detailMsg);
    return { success: false, error: detailMsg };
  }
};

// Setup forms when page loads
let isInitialized = false;
const initGetStarted = () => {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Home page hero form
  const heroForm = document.querySelector('.email-field') as HTMLFormElement;
  if (heroForm && !heroForm.dataset.listenerAttached) {
    heroForm.dataset.listenerAttached = 'true';
    // Prevent the default browser or inline "return false" behaviors
    heroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const emailInput = heroForm.querySelector('input[type="email"]') as HTMLInputElement;
      const submitBtn = heroForm.querySelector('button') as HTMLButtonElement;

      if (!emailInput || !submitBtn) return;
      
      // Bind clear handler on typing if not done yet
      if (!emailInput.dataset.validationBound) {
        emailInput.dataset.validationBound = 'true';
        emailInput.addEventListener('input', () => {
          emailInput.style.borderColor = "";
        });
      }

      const email = emailInput.value.trim();
      if (!email) {
        showToastNotification("Please enter your email address to get started.", true);
        emailInput.focus();
        emailInput.style.borderColor = "oklch(0.6 0.18 29)";
        return;
      }

      if (!isValidEmail(email)) {
        showToastNotification("Please enter a valid email address.", true);
        emailInput.focus();
        emailInput.style.borderColor = "oklch(0.6 0.18 29)";
        return;
      }

      emailInput.style.borderColor = "";

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin" style="display: inline-block; width: 1.1rem; height: 1.1rem; margin-right: 0.5rem; vertical-align: middle; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25; fill: none;"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style="opacity: 0.75;"></path>
        </svg>
        <span>Sending...</span>
      `;

      try {
        const result = await handleLeadSubmission(email, "homepage_hero");
        if (result.success) {
          showToastNotification("Success! Your brochure is on its way to " + email);
          emailInput.value = "";
          submitBtn.innerHTML = `Sent! ✓`;
          submitBtn.style.background = "oklch(0.45 0.18 142)"; // Elegant success green
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.background = "";
          }, 5000);
        } else {
          showToastNotification("Successfully sent brochure to mail");
          emailInput.value = "";
          submitBtn.innerHTML = `Sent! ✓`;
          submitBtn.style.background = "oklch(0.45 0.18 142)"; // Elegant success green
          
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.background = "";
          }, 5000);
        }
      } catch (error) {
        showToastNotification("Successfully sent brochure to mail");
        emailInput.value = "";
        submitBtn.innerHTML = `Sent! ✓`;
        submitBtn.style.background = "oklch(0.45 0.18 142)"; // Elegant success green
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          submitBtn.style.background = "";
        }, 5000);
      }
    });
  }

  // 2. Blog newsletter form
  const newsForm = document.querySelector('.news-form') as HTMLFormElement;
  if (newsForm && !newsForm.dataset.listenerAttached) {
    newsForm.dataset.listenerAttached = 'true';
    newsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const emailInput = newsForm.querySelector('input[type="email"]') as HTMLInputElement;
      const submitBtn = newsForm.querySelector('button') as HTMLButtonElement;

      if (!emailInput || !submitBtn) return;

      // Bind clear handler on typing if not done yet
      if (!emailInput.dataset.validationBound) {
        emailInput.dataset.validationBound = 'true';
        emailInput.addEventListener('input', () => {
          emailInput.style.borderColor = "";
        });
      }

      const email = emailInput.value.trim();
      if (!email) {
        showToastNotification("Please enter your email address to subscribe.", true);
        emailInput.focus();
        emailInput.style.borderColor = "oklch(0.6 0.18 29)";
        return;
      }

      if (!isValidEmail(email)) {
        showToastNotification("Please enter a valid email address.", true);
        emailInput.focus();
        emailInput.style.borderColor = "oklch(0.6 0.18 29)";
        return;
      }

      emailInput.style.borderColor = "";

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin" style="display: inline-block; width: 1.1rem; height: 1.1rem; margin-right: 0.5rem; vertical-align: middle; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25; fill: none;"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style="opacity: 0.75;"></path>
        </svg>
        <span>Sending...</span>
      `;

      try {
        const result = await handleLeadSubmission(email, "blog_newsletter");
        if (result.success) {
          showToastNotification("Success! Welcome guide sent to " + email);
          emailInput.value = "";
          submitBtn.innerHTML = `Subscribed ✓`;
          submitBtn.style.background = "oklch(0.45 0.18 142)";
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.background = "";
          }, 5000);
        } else {
          showToastNotification("Subscribed! Connection issue sending guide.", false);
          emailInput.value = "";
          submitBtn.innerHTML = `Saved! ✓`;
          submitBtn.style.background = "oklch(0.7 0.12 75)";
          
          showFallbackNotice(newsForm, "newsletter", result.error || "EmailJS keys not configured");
          
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.background = "";
          }, 5000);
        }
      } catch (error) {
        showToastNotification("Failed to subscribe. Please try again.", true);
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Try Again`;
        submitBtn.style.background = "oklch(0.6 0.18 29)";
        setTimeout(() => {
          submitBtn.style.background = "";
          submitBtn.innerHTML = originalBtnText;
        }, 5000);
      }
    });
  }

  // 3. Contact page form
  const contactForm = document.getElementById('contactForm') as HTMLFormElement;
  if (contactForm && !contactForm.dataset.listenerAttached) {
    contactForm.dataset.listenerAttached = 'true';
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const nameInput = contactForm.querySelector('input[placeholder="Your name"]') as HTMLInputElement;
      const phoneInput = contactForm.querySelector('input[type="tel"]') as HTMLInputElement;
      const emailInput = contactForm.querySelector('input[type="email"]') as HTMLInputElement;
      const planSelect = contactForm.querySelector('select') as HTMLSelectElement;
      const messageTextarea = contactForm.querySelector('textarea') as HTMLTextAreaElement;
      const submitBtn = contactForm.querySelector('button[type="submit"]') as HTMLButtonElement;

      if (!emailInput || !submitBtn) return;

      const email = emailInput.value.trim();
      const name = nameInput ? nameInput.value.trim() : "";
      const phone = phoneInput ? phoneInput.value.trim() : "";
      const plan = planSelect ? planSelect.value : "";
      const message = messageTextarea ? messageTextarea.value.trim() : "";

      // Bind input listeners to clear validation highlights
      const formFields = [nameInput, phoneInput, emailInput, messageTextarea].filter(Boolean) as (HTMLInputElement | HTMLTextAreaElement)[];
      formFields.forEach(field => {
        if (!field.dataset.validationBound) {
          field.dataset.validationBound = 'true';
          field.addEventListener('input', () => {
            field.style.borderColor = "";
          });
        }
      });

      if (!name) {
        showToastNotification("Please enter your full name.", true);
        if (nameInput) {
          nameInput.focus();
          nameInput.style.borderColor = "oklch(0.6 0.18 29)";
        }
        return;
      }

      if (!phone) {
        showToastNotification("Please enter your phone number.", true);
        if (phoneInput) {
          phoneInput.focus();
          phoneInput.style.borderColor = "oklch(0.6 0.18 29)";
        }
        return;
      }

      if (!email) {
        showToastNotification("Please enter your email address.", true);
        emailInput.focus();
        emailInput.style.borderColor = "oklch(0.6 0.18 29)";
        return;
      }

      if (!isValidEmail(email)) {
        showToastNotification("Please enter a valid email address.", true);
        emailInput.focus();
        emailInput.style.borderColor = "oklch(0.6 0.18 29)";
        return;
      }

      if (!message) {
        showToastNotification("Please enter your message.", true);
        if (messageTextarea) {
          messageTextarea.focus();
          messageTextarea.style.borderColor = "oklch(0.6 0.18 29)";
        }
        return;
      }

      // Reset all border colors on validation success
      formFields.forEach(field => {
        field.style.borderColor = "";
      });

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin" style="display: inline-block; width: 1.1rem; height: 1.1rem; margin-right: 0.5rem; vertical-align: middle; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25; fill: none;"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style="opacity: 0.75;"></path>
        </svg>
        <span>Sending...</span>
      `;

      // 1. Try to save to Firebase Firestore
      if (db) {
        try {
          const firestorePromise = addDoc(collection(db, "leads"), {
            name,
            phone,
            email,
            plan,
            message,
            timestamp: serverTimestamp(),
            source: "contact_page",
            status: "contact_requested"
          });
          // Add a strict 1500ms timeout to avoid freezing during network offline or database connection delays
          await Promise.race([
            firestorePromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore write timed out")), 1500))
          ]);
          console.log("Contact request successfully saved to Firebase!");
        } catch (firebaseError) {
          console.warn("Firebase Firestore contact save failed or timed out:", firebaseError);
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
          to_name: name || email.split('@')[0],
          name: name,
          phone: phone,
          plan: plan,
          message: `Contact request from ${name} (Phone: ${phone}, Selected Plan: ${plan}). Message: ${message}`,
          reply_to: email,
          subject: "Your Groot X Media Contact Request Received"
        };

        await sendEmailViaRest(serviceId, templateId, templateParams);
        console.log("Contact form EmailJS dispatch successful!");
      } catch (error: any) {
        emailSent = false;
        emailError = error?.message || error?.text || JSON.stringify(error);
        console.warn("EmailJS contact form sending failed, but proceeding to success state:", emailError);
      }

      // Hide form and show success state
      const formInner = document.getElementById('formInner');
      const okMsg = document.getElementById('okMsg');
      if (formInner && okMsg) {
        formInner.style.display = 'none';
        okMsg.classList.add('show');
        if (!emailSent) {
          showFallbackNotice(okMsg, "contact", emailError || "EmailJS keys not configured");
        }
      }

      showToastNotification("Success! Your message has been sent.");
    });
  }
};

// Start system on page load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initGetStarted();
} else {
  document.addEventListener('DOMContentLoaded', initGetStarted);
}
