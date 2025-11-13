// src/components/ErrorBanner.jsx
// @ts-check

import React, { useState } from "react";
import { ApiError, TimeoutError } from "../api/functions";

/**
 * @typedef ErrorBannerProps
 * @property {ApiError | TimeoutError | Error | null} error
 * @property {() => void} [onRetry]
 * @property {boolean} [compact]
 */

/**
 * Simple error banner that understands ApiError / TimeoutError.
 *
 * @param {ErrorBannerProps} props
 */
export function ErrorBanner({ error, onRetry, compact }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  let title = "Something went wrong";
  let description = "Please try again.";

  if (error instanceof TimeoutError) {
    title = "The request is taking too long";
    description =
      "This might be a slow network or a busy server. You can try again in a moment.";
  } else if (error instanceof ApiError) {
    title = "There was a problem talking to the server";
    if (typeof error.status === "number") {
      description = `Server returned status ${error.status}. It may be temporary.`;
    } else {
      description = error.message || description;
    }
  } else if (error instanceof Error) {
    title = error.name || title;
    description = error.message || description;
  }

  const containerStyle = {
    padding: compact ? "0.5rem 0.75rem" : "0.75rem 1rem",
    borderRadius: 6,
    border: "1px solid #b91c1c",
    background: "#fef2f2",
    color: "#7f1d1d",
    fontSize: compact ? "0.85rem" : "0.9rem",
    marginTop: "0.75rem",
  };

  const buttonRowStyle = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
    flexWrap: "wrap",
  };

  const buttonStyle = {
    padding: "0.25rem 0.6rem",
    borderRadius: 4,
    border: "1px solid #7f1d1d",
    background: "#fff",
    color: "#7f1d1d",
    cursor: "pointer",
    fontSize: "0.8rem",
  };

  return (
    <div style={containerStyle}>
      <div style={{ fontWeight: 600, marginBottom: compact ? 0 : "0.2rem" }}>
        {title}
      </div>
      {!compact && <div>{description}</div>}

      <div style={buttonRowStyle}>
        {onRetry && (
          <button
            type="button"
            style={buttonStyle}
            onClick={() => onRetry()}
          >
            Try again
          </button>
        )}

        <button
          type="button"
          style={{ ...buttonStyle, borderStyle: "dashed" }}
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>
      </div>

      {showDetails && (
        <pre
          style={{
            marginTop: "0.5rem",
            whiteSpace: "pre-wrap",
            fontSize: "0.75rem",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {JSON.stringify(
            {
              name: error.name,
              message: error.message,
              // @ts-ignore
              status: error.status,
              // @ts-ignore
              url: error.url,
              // @ts-ignore
              context: error.context,
            },
            null,
            2
          )}
        </pre>
      )}
    </div>
  );
}
