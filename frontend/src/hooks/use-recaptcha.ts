import { useEffect, useRef, useState } from "react";

interface UseRecaptchaOptions {
  siteKey: string | undefined;
  enabled?: boolean;
}

interface UseRecaptchaReturn {
  recaptchaLoaded: boolean;
  recaptchaError: boolean;
  widgetId: number | null;
  recaptchaRef: React.RefObject<HTMLDivElement | null>;
  getRecaptchaResponse: () => string | null;
  resetRecaptcha: () => void;
}

/**
 * Hook to load and manage Google reCAPTCHA v2
 * @param siteKey - The reCAPTCHA site key
 * @param enabled - Whether to load reCAPTCHA (default: true)
 * @returns Object with reCAPTCHA state and methods
 */
export function useRecaptcha({
  siteKey,
  enabled = true,
}: UseRecaptchaOptions): UseRecaptchaReturn {
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !siteKey || scriptLoadedRef.current) {
      return undefined;
    }

    // Check if script is already loaded
    if (window.grecaptcha) {
      setRecaptchaLoaded(true);
      scriptLoadedRef.current = true;
      return undefined;
    }

    // Load the reCAPTCHA script
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          setRecaptchaLoaded(true);
          scriptLoadedRef.current = true;
        });
      }
    };

    script.onerror = () => {
      setRecaptchaError(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector(
        'script[src*="recaptcha/api.js"]',
      );
      if (existingScript) {
        // Don't remove script as it might be used elsewhere
        // Just reset the state
        setRecaptchaLoaded(false);
        scriptLoadedRef.current = false;
      }
    };
  }, [siteKey, enabled]);

  // Render the reCAPTCHA widget when script is loaded
  useEffect(() => {
    if (
      !recaptchaLoaded ||
      !siteKey ||
      !recaptchaRef.current ||
      widgetId !== null
    ) {
      return;
    }

    if (window.grecaptcha && recaptchaRef.current) {
      try {
        const id = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: siteKey,
          callback: () => {
            // CAPTCHA completed successfully
          },
          "expired-callback": () => {
            // CAPTCHA expired
          },
          "error-callback": () => {
            // CAPTCHA error
          },
        });
        setWidgetId(id);
      } catch (error) {
        setRecaptchaError(true);
      }
    }
  }, [recaptchaLoaded, siteKey, widgetId]);

  const getRecaptchaResponse = (): string | null => {
    if (!window.grecaptcha || widgetId === null) {
      return null;
    }
    const response = window.grecaptcha.getResponse(widgetId);
    return response || null;
  };

  const resetRecaptcha = () => {
    if (window.grecaptcha && widgetId !== null) {
      window.grecaptcha.reset(widgetId);
    }
  };

  return {
    recaptchaLoaded,
    recaptchaError,
    widgetId,
    recaptchaRef,
    getRecaptchaResponse,
    resetRecaptcha,
  };
}
