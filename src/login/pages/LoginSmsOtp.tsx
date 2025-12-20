import type { PageProps } from "keycloakify/login/pages/PageProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { useEffect, useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSmsCode, startCountdown } from "../lib/sms";

export default function LoginSmsOtp(props: PageProps<Extract<KcContext, { pageId: "login-sms-otp.ftl" }>, I18n>) {
    const { kcContext, i18n, Template, doUseDefaultCss, classes } = props;

    const { msg, msgStr } = i18n;
    const { realm, url, messagesPerField } = kcContext;

    const [errorMessage, setErrorMessage] = useState<string>("");

    const sendVerificationCodeLabel = safeMsgStr(i18n, "sendVerificationCode", "Send code");
    const requiredPhoneNumberLabel = safeMsgStr(i18n, "requiredPhoneNumber", "Phone number is required");

    const [sendButtonText, setSendButtonText] = useState<string>(sendVerificationCodeLabel);

    async function sendVerificationCode() {
        setErrorMessage("");

        const phoneNumber = (kcContext.attemptedPhoneNumber ?? "").trim();
        if (!phoneNumber) {
            setErrorMessage(requiredPhoneNumberLabel);
            return;
        }

        if (sendButtonText !== sendVerificationCodeLabel) {
            return;
        }

        try {
            const { expiresIn } = await requestSmsCode({
                realmName: realm.name,
                endpoint: "otp-code",
                phoneNumber
            });

            startCountdown({
                seconds: expiresIn,
                onTick: setSendButtonText,
                onDone: () => setSendButtonText(sendVerificationCodeLabel)
            });
        } catch (e) {
            setErrorMessage(e instanceof Error ? e.message : msgStr("errorTitle"));
        }
    }

    useEffect(() => {
        if (kcContext.initSend !== true) {
            return;
        }
        const expires = kcContext.expires ?? 0;
        if (expires > 0) {
            startCountdown({
                seconds: expires,
                onTick: setSendButtonText,
                onDone: () => setSendButtonText(sendVerificationCodeLabel)
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            headerNode={safeMsg(i18n, "authCodePhoneNumber", "Authentication code")}
            displayInfo={true}
            infoNode={safeMsg(i18n, "authCodeInfo", "")}
            displayMessage={false}
        >
            <form id="kc-form-login" action={url.loginAction} method="post" className="space-y-4">
                {errorMessage !== "" && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errorMessage}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="code">{safeMsg(i18n, "authenticationCode", "Authentication code")}</Label>
                    <div className="flex gap-2">
                        <Input id="code" name="code" type="text" autoFocus autoComplete="one-time-code" />
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
                    {messagesPerField.existsError("code") && (
                        <span
                            className="text-sm text-destructive"
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("code"))
                            }}
                        />
                    )}
                </div>

                <div className="flex justify-end">
                    <Button type="submit" name="save">
                        {msg("doSubmit")}
                    </Button>
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


