import type { JSX } from "keycloakify/tools/JSX";
import type { LazyOrNot } from "keycloakify/tools/LazyOrNot";
import type { UserProfileFormFieldsProps } from "keycloakify/login/UserProfileFormFieldsProps";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSmsCode, startCountdown } from "../lib/sms";
import { formatKcMessage } from "../lib/formatKcMessage";

type RegisterProps = PageProps<Extract<KcContext, { pageId: "register.ftl" }>, I18n> & {
    UserProfileFormFields: LazyOrNot<(props: UserProfileFormFieldsProps) => JSX.Element>;
    doMakeUserConfirmPassword: boolean;
};

export default function Register(props: RegisterProps) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes, UserProfileFormFields, doMakeUserConfirmPassword } =
        props;

    const { msg, msgStr } = i18n;
    const { realm, url, messagesPerField } = kcContext;

    const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });

    const phoneNumberRequired = kcContext.phoneNumberRequired === true;
    const verifyPhone = kcContext.verifyPhone === true;

    const sendVerificationCodeLabel = safeMsgStr(i18n, "sendVerificationCode", "Send code");
    const requiredPhoneNumberLabel = safeMsgStr(i18n, "requiredPhoneNumber", "Phone number is required");

    const [sendButtonText, setSendButtonText] = useState<string>(sendVerificationCodeLabel);
    const [errorMessage, setErrorMessage] = useState<string>("");

    async function sendVerificationCode() {
        setErrorMessage("");

        const input = document.getElementById("phoneNumber") as HTMLInputElement | null;
        const trimmed = (input?.value ?? "").trim();

        if (!trimmed) {
            setErrorMessage(requiredPhoneNumberLabel);
            input?.focus();
            return;
        }

        if (sendButtonText !== sendVerificationCodeLabel) {
            return;
        }

        try {
            const { expiresIn } = await requestSmsCode({
                realmName: realm.name,
                endpoint: "registration-code",
                phoneNumber: trimmed
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
            <form id="kc-register-form" action={kcContext.url.registrationAction} method="post" className="space-y-4">
                {phoneNumberRequired && errorMessage !== "" && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errorMessage}
                    </div>
                )}

                <UserProfileFormFields
                    kcContext={kcContext}
                    i18n={i18n}
                    kcClsx={kcClsx}
                    onIsFormSubmittableValueChange={() => {}}
                    doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                />

                {phoneNumberRequired && (
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">{safeMsg(i18n, "phoneNumber", "Phone number")}</Label>
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            autoComplete="tel"
                            aria-invalid={messagesPerField.existsError("phoneNumber")}
                        />
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
                )}

                {phoneNumberRequired && verifyPhone && (
                    <div className="space-y-2">
                        <Label htmlFor="code">{safeMsg(i18n, "verificationCode", "Verification code")}</Label>
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

                <div className="flex items-center justify-between gap-3">
                    <Button asChild variant="link" size="sm" className="px-0">
                        <a href={url.loginUrl}>{msg("backToLogin")}</a>
                    </Button>
                    <Button type="submit">{msg("doRegister")}</Button>
                </div>
            </form>
        </Template>
    );
}

function safeMsgStr(i18n: I18n, key: string, fallback: string) {
    try {
        return i18n.msgStr(key as never);
    } catch {
        return fallback;
    }
}

function safeMsg(i18n: I18n, key: string, fallback: string) {
    try {
        return i18n.msg(key as never);
    } catch {
        return fallback;
    }
}


