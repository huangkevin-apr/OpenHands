import posthog from "posthog-js";
import { create } from "zustand";

interface ErrorMessageState {
  errorMessage: string | null;
}

interface ErrorMessageActions {
  setErrorMessage: (
    message: string,
    metadata?: Record<string, unknown>,
  ) => void;
  removeErrorMessage: () => void;
}

type ErrorMessageStore = ErrorMessageState & ErrorMessageActions;

const initialState: ErrorMessageState = {
  errorMessage: null,
};

export const useErrorMessageStore = create<ErrorMessageStore>((set) => ({
  ...initialState,

  setErrorMessage: (message: string, metadata?: Record<string, unknown>) => {
    // Track error to PostHog
    try {
      const error = new Error(message);
      posthog.captureException(error, {
        error_source: "error_banner",
        ...metadata,
      });
    } catch {
      // Silently fail if PostHog is not initialized
    }

    set(() => ({
      errorMessage: message,
    }));
  },

  removeErrorMessage: () =>
    set(() => ({
      errorMessage: null,
    })),
}));
