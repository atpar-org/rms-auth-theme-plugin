/**
 * Registration page with manual form fields using shadcn/ui components.
 * Includes: Username, Password, Confirm Password, Email, First Name, Last Name, Phone Number
 */
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { useState } from "react";
import { useIsPasswordRevealed } from "keycloakify/tools/useIsPasswordRevealed";
import { clsx } from "keycloakify/tools/clsx";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "../components/CountrySelect";
import { DEFAULT_COUNTRY, type Country } from "../components/countries";
import { requestSmsCode, startCountdown } from "../lib/sms";
import { formatKcMessage } from "../lib/formatKcMessage";

type RegisterProps = PageProps<Extract<KcContext, { pageId: "register.ftl" }>, I18n>;

export default function Register(props: RegisterProps) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { msg, msgStr } = i18n;
    const { realm, url, messagesPerField } = kcContext;

    const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });

    // Phone verification settings
    const verifyPhone = kcContext.verifyPhone === true;

    // Safe message helpers
    const safeMsgStr = (key: string, fallback: string) => {
        try {
            return msgStr(key as never);
        } catch {
            return fallback;
        }
    };

    const safeMsg = (key: string, fallback: string) => {
        try {
            return msg(key as never);
        } catch {
            return fallback;
        }
    };

    const sendVerificationCodeLabel = safeMsgStr("sendVerificationCode", "Send code");
    const requiredPhoneNumberLabel = safeMsgStr("requiredPhoneNumber", "Phone number is required");

    // State
    const [sendButtonText, setSendButtonText] = useState<string>(sendVerificationCodeLabel);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
    const [localPhoneNumber, setLocalPhoneNumber] = useState<string>("");

    // Password visibility
    const { isPasswordRevealed: isPassword1Revealed, toggleIsPasswordRevealed: togglePassword1 } =
        useIsPasswordRevealed({ passwordInputId: "password" });
    const { isPasswordRevealed: isPassword2Revealed, toggleIsPasswordRevealed: togglePassword2 } =
        useIsPasswordRevealed({ passwordInputId: "password-confirm" });

    // E.164 phone number format
    const e164PhoneNumber = toE164(country, localPhoneNumber);

    async function sendVerificationCode() {
        setErrorMessage("");

        if (!e164PhoneNumber) {
            setErrorMessage(requiredPhoneNumberLabel);
            return;
        }

        if (sendButtonText !== sendVerificationCodeLabel) {
            return;
        }

        try {
            const { expiresIn } = await requestSmsCode({
                realmName: realm.name,
                endpoint: "registration-code",
                phoneNumber: e164PhoneNumber
            });

            startCountdown({
                seconds: expiresIn,
                onTick: setSendButtonText,
                onDone: () => setSendButtonText(sendVerificationCodeLabel)
            });
        } catch (e) {
            const raw = e instanceof Error ? e.message : msgStr("errorTitle");
            setErrorMessage(formatKcMessage(i18n, raw));
        }
    }

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            headerNode={msg("registerTitle")}
            displayInfo={false}
        >
            <form id="kc-register-form" action={url.registrationAction} method="post" className="space-y-4">
                {errorMessage !== "" && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errorMessage}
                    </div>
                )}

                {/* Username */}
                <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                    <Label htmlFor="username">
                        {msg("username")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        autoFocus
                        aria-invalid={messagesPerField.existsError("username")}
                    />
                    {messagesPerField.existsError("username") && (
                        <span
                            className="text-sm text-destructive"
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("username"))
                            }}
                        />
                    )}
                </div>

                {/* Password */}
                <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                    <Label htmlFor="password">
                        {msg("password")} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={isPassword1Revealed ? "text" : "password"}
                            autoComplete="new-password"
                            className="pr-10"
                            aria-invalid={messagesPerField.existsError("password")}
                        />
                        <button
                            type="button"
                            className="absolute right-0 top-0 h-full px-3 py-1 text-muted-foreground hover:text-foreground"
                            aria-label={msgStr(isPassword1Revealed ? "hidePassword" : "showPassword")}
                            onClick={togglePassword1}
                        >
                            {isPassword1Revealed ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                    {messagesPerField.existsError("password") && (
                        <span
                            className="text-sm text-destructive"
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("password"))
                            }}
                        />
                    )}
                </div>

                {/* Confirm Password */}
                <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                    <Label htmlFor="password-confirm">
                        {msg("passwordConfirm")} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="password-confirm"
                            name="password-confirm"
                            type={isPassword2Revealed ? "text" : "password"}
                            autoComplete="new-password"
                            className="pr-10"
                            aria-invalid={messagesPerField.existsError("password-confirm")}
                        />
                        <button
                            type="button"
                            className="absolute right-0 top-0 h-full px-3 py-1 text-muted-foreground hover:text-foreground"
                            aria-label={msgStr(isPassword2Revealed ? "hidePassword" : "showPassword")}
                            onClick={togglePassword2}
                        >
                            {isPassword2Revealed ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                    {messagesPerField.existsError("password-confirm") && (
                        <span
                            className="text-sm text-destructive"
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("password-confirm"))
                            }}
                        />
                    )}
                </div>

                {/* Email */}
                <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                    <Label htmlFor="email">
                        {msg("email")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={messagesPerField.existsError("email")}
                    />
                    {messagesPerField.existsError("email") && (
                        <span
                            className="text-sm text-destructive"
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("email"))
                            }}
                        />
                    )}
                </div>

                {/* First Name */}
                <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                    <Label htmlFor="firstName">
                        {msg("firstName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        aria-invalid={messagesPerField.existsError("firstName")}
                    />
                    {messagesPerField.existsError("firstName") && (
                        <span
                            className="text-sm text-destructive"
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("firstName"))
                            }}
                        />
                    )}
                </div>

                {/* Last Name */}
                <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                    <Label htmlFor="lastName">
                        {msg("lastName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        aria-invalid={messagesPerField.existsError("lastName")}
                    />
                    {messagesPerField.existsError("lastName") && (
                        <span
                            className="text-sm text-destructive"
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("lastName"))
                            }}
                        />
                    )}
                </div>

                {/* Phone Number */}
                <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                    <Label htmlFor="phoneNumberLocal">
                        {safeMsg("phoneNumber", "Phone number")} <span className="text-destructive">*</span>
                    </Label>
                    <input type="hidden" id="phoneNumber" name="phoneNumber" value={e164PhoneNumber} />
                    <div className="flex gap-2">
                        <CountrySelect className="w-[140px]" value={country} onChange={setCountry} />
                        <Input
                            id="phoneNumberLocal"
                            type="tel"
                            value={localPhoneNumber}
                            onChange={e => setLocalPhoneNumber(e.target.value)}
                            autoComplete="tel"
                            inputMode="tel"
                            placeholder="Mobile number"
                            aria-invalid={messagesPerField.existsError("phoneNumber")}
                        />
                    </div>
                    {messagesPerField.existsError("phoneNumber") && (
                        <span
                            className="text-sm text-destructive"
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("phoneNumber"))
                            }}
                        />
                    )}
                </div>

                {/* Verification Code (if phone verification is enabled) */}
                {verifyPhone && (
                    <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                        <Label htmlFor="code">{safeMsg("verificationCode", "Verification code")}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="code"
                                name="code"
                                type="text"
                                autoComplete="one-time-code"
                                aria-invalid={messagesPerField.existsError("registerCode", "code")}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="shrink-0"
                                disabled={sendButtonText !== sendVerificationCodeLabel}
                                onClick={sendVerificationCode}
                            >
                                {sendButtonText}
                            </Button>
                        </div>
                        {messagesPerField.existsError("registerCode", "code") && (
                            <span
                                className="text-sm text-destructive"
                                aria-live="polite"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(
                                        formatKcMessage(i18n, messagesPerField.getFirstError("registerCode", "code"))
                                    )
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    <Button asChild variant="link" size="sm" className="px-0">
                        <a href={url.loginUrl}>{msg("backToLogin")}</a>
                    </Button>
                    <Button type="submit">{msg("doRegister")}</Button>
                </div>
            </form>
        </Template>
    );
}

// Helper function to format E.164 phone number
function toE164(country: Country, local: string): string {
    const localDigits = (local ?? "").replace(/[^\d]/g, "");
    if (!localDigits) return "";
    return `+${country.dialCode}${localDigits}`;
}


// Eye icon component
function EyeIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

// Eye-off icon component
function EyeOffIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
    );
}
