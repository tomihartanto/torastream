"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "torastream-cookie-consent";

/**
 * Banner persetujuan cookie (comply with GDPR-like / UU PDP Indonesia).
 * Tampil sekali, simpan pilihan di localStorage.
 * Hanya memuat script iklan setelah pengguna setuju.
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!stored) setShow(true);
    } catch {
      // localStorage tidak tersedia (mis. SSR / private browsing)
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    setShow(false);
    // Trigger event agar komponen iklan tahu persetujuan diberikan
    window.dispatchEvent(new Event("cookie-consent-accepted"));
  }

  function decline() {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Pemberitahuan Cookie"
      className="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-zinc-900/95 p-5 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-zinc-300">
            Kami menggunakan cookie untuk meningkatkan pengalaman Anda dan menayangkan iklan.
            Dengan melanjutkan, Anda menyetujui{" "}
            <Link href="/cookies" className="text-blue-400 underline hover:text-blue-300">
              Kebijakan Cookie
            </Link>{" "}
            kami.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={decline}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
            >
              Tolak
            </button>
            <button
              onClick={accept}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Setuju
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
