import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useLocalStorage } from "@uidotdev/usehooks";
import { FaTriangleExclamation } from "react-icons/fa6";
import CloseIcon from "#/icons/close.svg?react";
import { cn } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";

interface AlertBannerProps {
  maintenanceStartTime?: string | null;
  faultyModels?: string[];
  errorMessage?: string | null;
}

export function AlertBanner({
  maintenanceStartTime,
  faultyModels,
  errorMessage,
}: AlertBannerProps) {
  const { t } = useTranslation();
  const [dismissedAt, setDismissedAt] = useLocalStorage<string | null>(
    "alert_banner_dismissed_at",
    null,
  );

  const { pathname } = useLocation();

  // Convert EST timestamp to user's local timezone
  const formatMaintenanceTime = (estTimeString: string): string => {
    try {
      // Parse the EST timestamp
      // If the string doesn't include timezone info, assume it's EST
      let dateToFormat: Date;

      if (
        estTimeString.includes("T") &&
        (estTimeString.includes("-05:00") ||
          estTimeString.includes("-04:00") ||
          estTimeString.includes("EST") ||
          estTimeString.includes("EDT"))
      ) {
        // Already has timezone info
        dateToFormat = new Date(estTimeString);
      } else {
        // Assume EST and convert to UTC for proper parsing
        // EST is UTC-5, EDT is UTC-4, but we'll assume EST for simplicity
        const estDate = new Date(estTimeString);
        if (Number.isNaN(estDate.getTime())) {
          throw new Error("Invalid date");
        }
        dateToFormat = estDate;
      }

      // Format to user's local timezone
      return dateToFormat.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch (error) {
      // Fallback to original string if parsing fails
      // eslint-disable-next-line no-console
      console.warn("Failed to parse maintenance time:", error);
      return estTimeString;
    }
  };

  const localTime = maintenanceStartTime
    ? formatMaintenanceTime(maintenanceStartTime)
    : null;

  // Generate a unique identifier for the current alert state
  const alertIdentifier = useMemo(() => {
    const parts: string[] = [];
    if (localTime) {
      parts.push(`maintenance:${localTime}`);
    }
    if (faultyModels && faultyModels.length > 0) {
      parts.push(`faulty:${faultyModels.sort().join(",")}`);
    }
    if (errorMessage) {
      parts.push(`error:${errorMessage}`);
    }
    return parts.join("|");
  }, [localTime, faultyModels, errorMessage]);

  const hasMaintenanceAlert =
    maintenanceStartTime &&
    !Number.isNaN(new Date(maintenanceStartTime).getTime());
  const hasFaultyModels = faultyModels && faultyModels.length > 0;
  const hasErrorMessage = errorMessage && errorMessage.trim().length > 0;

  const hasAnyAlert = hasMaintenanceAlert || hasFaultyModels || hasErrorMessage;

  const isBannerVisible = useMemo(() => {
    if (!hasAnyAlert) {
      return false;
    }
    return dismissedAt !== alertIdentifier;
  }, [dismissedAt, alertIdentifier, hasAnyAlert]);

  // Try to translate error message, fallback to raw message
  const translatedErrorMessage = useMemo(() => {
    if (!errorMessage) return null;

    // Check if the error message is a translation key (e.g., "ERROR$SOME_KEY")
    const translated = t(errorMessage as I18nKey);
    // If translation returns the same key, it means no translation exists
    if (translated === errorMessage) {
      return errorMessage;
    }
    return translated;
  }, [errorMessage, t]);

  if (!isBannerVisible) {
    return null;
  }

  const renderMessages = () => {
    const messages: React.ReactNode[] = [];

    if (hasMaintenanceAlert && localTime) {
      messages.push(
        <p key="maintenance" className="text-sm font-medium">
          {t(I18nKey.MAINTENANCE$SCHEDULED_MESSAGE, { time: localTime })}
        </p>,
      );
    }

    if (hasFaultyModels) {
      messages.push(
        <p key="faulty-models" className="text-sm font-medium">
          {t(I18nKey.ALERT$FAULTY_MODELS_MESSAGE)} {faultyModels!.join(", ")}
        </p>,
      );
    }

    if (hasErrorMessage && translatedErrorMessage) {
      messages.push(
        <p key="error-message" className="text-sm font-medium">
          {translatedErrorMessage}
        </p>,
      );
    }

    return messages;
  };

  return (
    <div
      data-testid="alert-banner"
      className={cn(
        "bg-primary text-[#0D0F11] p-4 rounded",
        "flex flex-row items-center justify-between m-1",
        pathname === "/" && "mt-3 mr-3",
      )}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <FaTriangleExclamation className="text-white align-middle" />
        </div>
        <div className="ml-3 flex flex-col gap-1">{renderMessages()}</div>
      </div>

      <button
        type="button"
        data-testid="dismiss-button"
        onClick={() => setDismissedAt(alertIdentifier)}
        className={cn(
          "bg-[#0D0F11] rounded-full w-5 h-5 flex items-center justify-center cursor-pointer",
        )}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
