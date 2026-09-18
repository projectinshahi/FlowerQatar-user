import Script from "next/script";

/**
 * Loads Google's website translator, restricted to English and Arabic.
 *
 * The widget's own "Select Language" dropdown is NOT shown. Google's markup can't be styled
 * to match the site and it used to float over the page bottom-left; instead the container is
 * kept in the DOM but visually hidden (the API needs a real element to mount into), and
 * <LanguageToggle> drives the hidden <select> it creates. See globals.css for the rules that
 * hide the widget chrome and the injected top banner.
 */
export default function GoogleTranslate() {
  return (
    <>
      {/* `inert`: the widget is visually hidden and aria-hidden, but Google's "Select Language"
          link inside it was still a keyboard tab stop, an invisible control. The storefront's
          own EN/AR switch drives translation, so nothing needs to reach this by keyboard. */}
      <div id="google_translate_element" aria-hidden="true" inert />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`window.googleTranslateElementInit = function () {
          // element.js publishes window.google.translate before TranslateElement finishes
          // loading, so this callback can be reached while the constructor is still missing.
          // Bail instead of throwing — the caller retries.
          var T = window.google && window.google.translate && window.google.translate.TranslateElement;
          if (!T || !T.InlineLayout) return false;
          new T(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,ar',
              layout: T.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
          return true;
        };`}
      </Script>
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
