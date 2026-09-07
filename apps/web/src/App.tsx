import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { LandingPage } from "@/pages/landing-page";
import { DocsPage } from "@/pages/docs-page";

/**
 * On navigation, jump to the hash target if there is one (so "/#markets" from
 * another page lands on that section), otherwise scroll to the top of the new
 * page. Respects the browser's reduced-motion behavior via CSS.
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
  return (
    <>
      <ScrollManager />
      <SiteHeader />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
      <SiteFooter />
    </>
  );
}
