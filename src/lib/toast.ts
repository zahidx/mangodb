// ===========================================
// MangoDB Toast Helpers — Pre-styled notifications
// ===========================================
// Usage: import { showSuccess, showError } from "@/lib/toast";
// Or use the original toast directly for loading/ids.

import toast from "react-hot-toast";

const successStyle = {
  background: "#ecfdf5",
  color: "#065f46",
  border: "1px solid #a7f3d0",
  borderRadius: "10px",
  boxShadow: "0 8px 32px rgba(5, 150, 105, 0.15)",
  fontSize: "13px",
  fontWeight: 600,
  padding: "12px 16px",
};

const errorStyle = {
  background: "#fef2f2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  boxShadow: "0 8px 32px rgba(220, 38, 38, 0.15)",
  fontSize: "13px",
  fontWeight: 600,
  padding: "12px 16px",
};

const loadingStyle = {
  background: "#f0f9ff",
  color: "#075985",
  border: "1px solid #bae6fd",
  borderRadius: "10px",
  boxShadow: "0 8px 32px rgba(14, 165, 233, 0.15)",
  fontSize: "13px",
  fontWeight: 600,
  padding: "12px 16px",
};

const infoStyle = {
  background: "#f5f3ff",
  color: "#5b21b6",
  border: "1px solid #ddd6fe",
  borderRadius: "10px",
  boxShadow: "0 8px 32px rgba(139, 92, 246, 0.15)",
  fontSize: "13px",
  fontWeight: 600,
  padding: "12px 16px",
};

export function showSuccess(message: string) {
  toast.success(message, { style: successStyle });
}

export function showError(message: string) {
  toast.error(message, { style: errorStyle });
}

export function showInfo(message: string) {
  toast(message, {
    icon: "ℹ️",
    style: infoStyle,
  });
}

export function showLoading(message: string) {
  return toast.loading(message, { style: loadingStyle });
}

export function dismissToast(toastId: string) {
  toast.dismiss(toastId);
}

export { toast };

