"use client";

export default function AdsterraScripts() {
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  if (!adsEnabled) return null;

  const popunderUrl = process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_URL;
  const socialBarUrl = process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_URL;

  if (!popunderUrl && !socialBarUrl) return null;

  return (
    <>
      {popunderUrl && <script src={popunderUrl} async />}
      {socialBarUrl && <script src={socialBarUrl} async />}
    </>
  );
}
