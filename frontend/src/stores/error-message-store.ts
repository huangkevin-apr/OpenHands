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
    // Track error to PostHog if initialized
    if (posthog.__loaded) {
      posthog.capture("error_banner_displayed", {
        error_message: message,
        error_source: "error_banner",
        ...metadata,
      });
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
