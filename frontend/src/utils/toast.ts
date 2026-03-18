export const TOAST_EVENT_NAME = "faritany:toast";

export function emitToast(detail) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail }));
}

