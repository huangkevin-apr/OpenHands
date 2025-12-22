import { act, renderHook, waitFor, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecaptcha } from "#/hooks/use-recaptcha";
import React from "react";

describe("useRecaptcha", () => {
  let mockGrecaptcha: {
    ready: (callback: () => void) => void;
    render: (
      element: HTMLElement,
      options: {
        sitekey: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      },
    ) => number;
    getResponse: (widgetId?: number) => string;
    reset: (widgetId?: number) => void;
  };
  let mockScript: HTMLScriptElement;

  beforeEach(() => {
    // Mock grecaptcha API
    mockGrecaptcha = {
      ready: vi.fn((callback: () => void) => callback()),
      render: vi.fn(() => 1),
      getResponse: vi.fn(() => ""),
      reset: vi.fn(),
    };

    // Mock script element - create a real script element so it can be appended to DOM
    const originalCreateElement = document.createElement.bind(document);
    mockScript = originalCreateElement("script") as HTMLScriptElement;

    // Mock DOM methods
    vi.stubGlobal("grecaptcha", undefined);
    vi.spyOn(document, "createElement").mockImplementation(
      (tagName: string) => {
        if (tagName === "script") {
          return mockScript;
        }
        return originalCreateElement(tagName);
      },
    );
    vi.spyOn(document.head, "appendChild").mockImplementation(
      vi.fn((node: Node) => node),
    );
    vi.spyOn(document, "querySelector").mockReturnValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should return initial state when siteKey is undefined", () => {
    // Arrange & Act
    const { result } = renderHook(() => useRecaptcha({ siteKey: undefined }));

    // Assert
    expect(result.current.recaptchaLoaded).toBe(false);
    expect(result.current.recaptchaError).toBe(false);
    expect(result.current.widgetId).toBe(null);
    expect(result.current.recaptchaRef.current).toBe(null);
    expect(document.createElement).not.toHaveBeenCalledWith("script");
  });

  it("should not load script when enabled is false", () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useRecaptcha({ siteKey: "test-site-key", enabled: false }),
    );

    // Assert
    expect(result.current.recaptchaLoaded).toBe(false);
    expect(document.createElement).not.toHaveBeenCalledWith("script");
  });

  it("should load script when siteKey is provided and grecaptcha not available", () => {
    // Arrange
    vi.stubGlobal("grecaptcha", undefined);

    // Act
    renderHook(() => useRecaptcha({ siteKey: "test-site-key" }));

    // Assert
    expect(document.createElement).toHaveBeenCalledWith("script");
    expect(mockScript.src).toBe(
      "https://www.google.com/recaptcha/api.js?render=explicit",
    );
    expect(mockScript.async).toBe(true);
    expect(mockScript.defer).toBe(true);
    expect(document.head.appendChild).toHaveBeenCalledWith(mockScript);
  });

  it("should render widget when grecaptcha is already available", async () => {
    // Arrange
    vi.stubGlobal("grecaptcha", mockGrecaptcha);

    const TestComponent = () => {
      const { recaptchaRef, recaptchaLoaded, widgetId } = useRecaptcha({
        siteKey: "test-site-key",
      });
      return <div ref={recaptchaRef} data-testid="recaptcha-container" />;
    };

    // Act
    render(<TestComponent />);

    // Assert
    await waitFor(() => {
      expect(mockGrecaptcha.render).toHaveBeenCalled();
    });
    const renderCall = vi.mocked(mockGrecaptcha.render).mock.calls[0];
    expect(renderCall[1]).toMatchObject({
      sitekey: "test-site-key",
      callback: expect.any(Function),
      "expired-callback": expect.any(Function),
      "error-callback": expect.any(Function),
    });
  });

  it("should set error state when script fails to load", async () => {
    // Arrange
    vi.stubGlobal("grecaptcha", undefined);

    const { result } = renderHook(() =>
      useRecaptcha({ siteKey: "test-site-key" }),
    );

    // Act - simulate script error
    act(() => {
      if (mockScript.onerror) {
        mockScript.onerror(new Event("error"));
      }
    });

    // Assert
    await waitFor(() => {
      expect(result.current.recaptchaError).toBe(true);
    });
    expect(result.current.recaptchaLoaded).toBe(false);
  });

  it("should return response token when widget is ready", async () => {
    // Arrange
    const mockToken = "recaptcha-token-123";
    mockGrecaptcha.getResponse = vi.fn(() => mockToken);
    vi.stubGlobal("grecaptcha", mockGrecaptcha);

    const TestComponent = () => {
      const { recaptchaRef, getRecaptchaResponse } = useRecaptcha({
        siteKey: "test-site-key",
      });
      return (
        <div>
          <div ref={recaptchaRef} data-testid="recaptcha-container" />
          <button
            onClick={() => {
              const response = getRecaptchaResponse();
              // Store response for testing
              (window as any).testResponse = response;
            }}
          >
            Get Response
          </button>
        </div>
      );
    };

    // Act
    const { getByRole } = render(<TestComponent />);

    await waitFor(() => {
      expect(mockGrecaptcha.render).toHaveBeenCalled();
    });

    act(() => {
      getByRole("button").click();
    });

    // Assert
    expect((window as any).testResponse).toBe(mockToken);
    expect(mockGrecaptcha.getResponse).toHaveBeenCalledWith(1);
    delete (window as any).testResponse;
  });

  it("should return null when widget is not ready", () => {
    // Arrange
    vi.stubGlobal("grecaptcha", undefined);

    const { result } = renderHook(() =>
      useRecaptcha({ siteKey: "test-site-key" }),
    );

    // Act
    const response = result.current.getRecaptchaResponse();

    // Assert
    expect(response).toBe(null);
  });

  it("should reset widget when resetRecaptcha is called", async () => {
    // Arrange
    vi.stubGlobal("grecaptcha", mockGrecaptcha);

    const TestComponent = () => {
      const { recaptchaRef, resetRecaptcha } = useRecaptcha({
        siteKey: "test-site-key",
      });
      return (
        <div>
          <div ref={recaptchaRef} data-testid="recaptcha-container" />
          <button onClick={resetRecaptcha}>Reset</button>
        </div>
      );
    };

    // Act
    const { getByRole } = render(<TestComponent />);

    await waitFor(() => {
      expect(mockGrecaptcha.render).toHaveBeenCalled();
    });

    act(() => {
      getByRole("button").click();
    });

    // Assert
    expect(mockGrecaptcha.reset).toHaveBeenCalledWith(1);
  });

  it("should handle widget render error gracefully", async () => {
    // Arrange
    mockGrecaptcha.render = vi.fn(() => {
      throw new Error("Render failed");
    });
    vi.stubGlobal("grecaptcha", mockGrecaptcha);

    const TestComponent = () => {
      const { recaptchaRef, recaptchaError } = useRecaptcha({
        siteKey: "test-site-key",
      });
      return (
        <div>
          <div ref={recaptchaRef} data-testid="recaptcha-container" />
          {recaptchaError && <div data-testid="error">Error occurred</div>}
        </div>
      );
    };

    // Act
    const { getByTestId } = render(<TestComponent />);

    // Assert
    await waitFor(() => {
      expect(getByTestId("error")).toBeInTheDocument();
    });
  });

  it("should cleanup script reference on unmount", () => {
    // Arrange
    const existingScript = document.createElement("script");
    vi.spyOn(document, "querySelector").mockReturnValue(existingScript);

    const { unmount } = renderHook(() =>
      useRecaptcha({ siteKey: "test-site-key" }),
    );

    // Act
    unmount();

    // Assert
    expect(document.querySelector).toHaveBeenCalledWith(
      'script[src*="recaptcha/api.js"]',
    );
  });
});
