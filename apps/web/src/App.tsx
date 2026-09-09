import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { captureRefFromUrl } from "@/lib/referral";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { LandingPage } from "@/pages/landing-page";
import { DocsPage } from "@/pages/docs-page";
import { DashboardPage } from "@/pages/dashboard-page";

/**
 * On navigation, jump to the hash target if there is one (so "/#markets" from
 * another page lands on that section), otherwise scroll to the top of the new
 * page.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default function App() {
  const { pathname } = useLocation();

  // Stash any inbound referral code on first load, before anything else.
  useEffect(() => {
    captureRefFromUrl();
  }, []);
  // The dashboard is the "app" surface — it carries its own chrome, so the
  // marketing header/footer are hidden there.
  const isApp = pathname.startsWith("/dashboard");

  return (
    <>
      <ScrollManager />
      {!isApp && <SiteHeader />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
      {!isApp && <SiteFooter />}
    </>
  );
}
