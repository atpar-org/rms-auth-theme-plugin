import type { I18n } from "../i18n";

const FALLBACK_BY_KEY: Record<string, string> = {
    // Keycloak phone-provider (commonly seen)
    phoneTokenCodeDoesNotMatch: "The verification code you entered is incorrect.",
    phoneTokenExpired: "The verification code has expired. Please request a new one.",
    phoneTokenHasExpired: "The verification code has expired. Please request a new one.",
    phoneTokenNotFound: "The verification code is invalid. Please request a new one.",

    // Our custom/friendly fallbacks
    requiredPhoneNumber: "Phone number is required.",
    invalidPhoneNumber: "Please enter a valid phone number."
};

function looksLikeMessageKey(s: string): boolean {
    // Most KC message keys are plain tokens with no spaces.
    // Keep it permissive (allow dots/underscores/dashes).
    return /^[A-Za-z0-9._-]+$/.test(s);
}

/**
 * Turn raw Keycloak messages into user-friendly text.
 * - If the value looks like a message key, try translating via i18n first.
 * - If translation is missing, fall back to our mapping.
 * - Otherwise return the original (already human-readable, or HTML).
 */
export function formatKcMessage(i18n: I18n, raw: string | undefined | null): string {
    const s = String(raw ?? "").trim();
    if (s === "") return "";

    // If it contains HTML or looks like a full sentence, keep it.
    if (s.includes("<") || !looksLikeMessageKey(s)) {
        return s;
    }

    // Try to resolve through i18n (if your realm provides the message bundle).
    try {
        const translated = i18n.msgStr(s as never);
        if (translated && translated.trim() !== "" && translated !== s) {
            return translated;
        }
    } catch {
        // ignore
    }

    return FALLBACK_BY_KEY[s] ?? s;
}






