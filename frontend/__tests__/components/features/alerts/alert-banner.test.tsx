import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { MemoryRouter } from "react-router";
import { AlertBanner } from "#/components/features/alerts/alert-banner";

// Mock react-i18next
vi.mock("react-i18next", async () => {
  const actual =
    await vi.importActual<typeof import("react-i18next")>("react-i18next");
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: { time?: string }) => {
        const translations: Record<string, string> = {
          MAINTENANCE$SCHEDULED_MESSAGE: `Scheduled maintenance will begin at ${options?.time || "{{time}}"}`,
          ALERT$FAULTY_MODELS_MESSAGE:
            "The following models are currently reporting errors:",
          "ERROR$TRANSLATED_KEY": "This is a translated error message",
        };
        return translations[key] || key;
      },
    }),
  };
});

describe("AlertBanner", () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe("Maintenance alerts", () => {
    it("renders maintenance banner with formatted time", () => {
      const startTime = "2024-01-15T10:00:00-05:00"; // EST timestamp

      const { container } = render(
        <MemoryRouter>
          <AlertBanner maintenanceStartTime={startTime} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).toBeInTheDocument();

      const svgIcon = container.querySelector("svg");
      expect(svgIcon).toBeInTheDocument();

      const button = within(banner!).queryByTestId("dismiss-button");
      expect(button).toBeInTheDocument();
    });

    it("handles invalid date gracefully", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const invalidTime = "invalid-date";

      render(
        <MemoryRouter>
          <AlertBanner maintenanceStartTime={invalidTime} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).not.toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    it("click on dismiss button removes banner", () => {
      const startTime = "2024-01-15T10:00:00-05:00";

      render(
        <MemoryRouter>
          <AlertBanner maintenanceStartTime={startTime} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      const button = within(banner!).queryByTestId("dismiss-button");

      act(() => {
        fireEvent.click(button!);
      });

      expect(banner).not.toBeInTheDocument();
    });

    it("banner reappears after dismissing on next maintenance event", () => {
      const startTime = "2024-01-15T10:00:00-05:00";
      const nextStartTime = "2025-01-15T10:00:00-05:00";

      const { rerender } = render(
        <MemoryRouter>
          <AlertBanner maintenanceStartTime={startTime} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      const button = within(banner!).queryByTestId("dismiss-button");

      act(() => {
        fireEvent.click(button!);
      });

      expect(banner).not.toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <AlertBanner maintenanceStartTime={nextStartTime} />
        </MemoryRouter>,
      );

      expect(screen.queryByTestId("alert-banner")).toBeInTheDocument();
    });
  });

  describe("Faulty models alerts", () => {
    it("renders banner with faulty models list", () => {
      const faultyModels = ["gpt-4", "claude-3"];

      render(
        <MemoryRouter>
          <AlertBanner faultyModels={faultyModels} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).toBeInTheDocument();

      expect(
        screen.getByText(/The following models are currently reporting errors:/),
      ).toBeInTheDocument();
      // Models are displayed in the order they are provided
      expect(screen.getByText(/gpt-4/)).toBeInTheDocument();
      expect(screen.getByText(/claude-3/)).toBeInTheDocument();
    });

    it("does not render banner when faulty models array is empty", () => {
      render(
        <MemoryRouter>
          <AlertBanner faultyModels={[]} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).not.toBeInTheDocument();
    });

    it("banner reappears when faulty models change", () => {
      const faultyModels = ["gpt-4"];

      const { rerender } = render(
        <MemoryRouter>
          <AlertBanner faultyModels={faultyModels} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      const button = within(banner!).queryByTestId("dismiss-button");

      act(() => {
        fireEvent.click(button!);
      });

      expect(banner).not.toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <AlertBanner faultyModels={["gpt-4", "claude-3"]} />
        </MemoryRouter>,
      );

      expect(screen.queryByTestId("alert-banner")).toBeInTheDocument();
    });
  });

  describe("Error message alerts", () => {
    it("renders banner with translated error message", () => {
      render(
        <MemoryRouter>
          <AlertBanner errorMessage="ERROR$TRANSLATED_KEY" />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).toBeInTheDocument();
      expect(
        screen.getByText("This is a translated error message"),
      ).toBeInTheDocument();
    });

    it("renders banner with raw error message when no translation exists", () => {
      const rawErrorMessage = "This is a raw error without translation";

      render(
        <MemoryRouter>
          <AlertBanner errorMessage={rawErrorMessage} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).toBeInTheDocument();
      expect(screen.getByText(rawErrorMessage)).toBeInTheDocument();
    });

    it("does not render banner when error message is empty", () => {
      render(
        <MemoryRouter>
          <AlertBanner errorMessage="" />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).not.toBeInTheDocument();
    });

    it("does not render banner when error message is null", () => {
      render(
        <MemoryRouter>
          <AlertBanner errorMessage={null} />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).not.toBeInTheDocument();
    });
  });

  describe("Multiple alerts", () => {
    it("renders all alerts when multiple conditions are present", () => {
      const startTime = "2024-01-15T10:00:00-05:00";
      const faultyModels = ["gpt-4"];
      const errorMessage = "ERROR$TRANSLATED_KEY";

      render(
        <MemoryRouter>
          <AlertBanner
            maintenanceStartTime={startTime}
            faultyModels={faultyModels}
            errorMessage={errorMessage}
          />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      expect(banner).toBeInTheDocument();

      expect(
        screen.getByText(/Scheduled maintenance will begin at/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The following models are currently reporting errors:/),
      ).toBeInTheDocument();
      expect(
        screen.getByText("This is a translated error message"),
      ).toBeInTheDocument();
    });

    it("dismissing hides all alerts", () => {
      const startTime = "2024-01-15T10:00:00-05:00";
      const faultyModels = ["gpt-4"];

      render(
        <MemoryRouter>
          <AlertBanner
            maintenanceStartTime={startTime}
            faultyModels={faultyModels}
          />
        </MemoryRouter>,
      );

      const banner = screen.queryByTestId("alert-banner");
      const button = within(banner!).queryByTestId("dismiss-button");

      act(() => {
        fireEvent.click(button!);
      });

      expect(banner).not.toBeInTheDocument();
    });
  });
});
