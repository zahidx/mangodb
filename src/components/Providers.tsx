// ===========================================
// Providers — Wraps all context providers
// ===========================================
"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { CompareProvider } from "@/context/CompareContext";
import { LanguageProvider } from "@/context/LanguageContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <CompareProvider>
            {children}
          </CompareProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
