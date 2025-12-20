import type { PageProps } from "keycloakify/login/pages/PageProps";
import { useEffect, useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSmsCode, startCountdown } from "../lib/sms";

export default function LoginSmsOtpConfig(
    props: PageProps<Extract<KcContext, { pageId: "login-sms-otp-config.ftl" }>, I18n>
) {
    const { kcContext, i18n, Template, doUseDefaultCss, classes } = props;

    const { msg, msgStr } = i18n;
    const { realm, url } = kcContext;

    const sendVerificationCodeLabel = safeMsgStr(i18n, "sendVerificationCode", "Send code");
    const requiredPhoneNumberLabel = safeMsgStr(i18n, "requiredPhoneNumber", "Phone number is required");

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>(kcContext.phoneNumber ?? "");
    const [sendButtonText, setSendButtonText] = useState<string>(sendVerificationCodeLabel);

    async function sendVerificationCode(pn?: string) {
        setErrorMessage("");

        const trimmed = (pn ?? phoneNumber).trim();
        if (!trimmed) {
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
                phoneNumber: trimmed,
                kind: "configure"
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
        if ((kcContext.phoneNumber ?? "").trim() === "") {
            return;
        }

        // Mirror the FTL behavior: if phoneNumber is already known, send code immediately.
        void sendVerificationCode(kcContext.phoneNumber);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            headerNode={safeMsg(i18n, "configSms2Fa", "Configure SMS 2FA")}
            displayInfo={true}
            infoNode={safeMsg(i18n, "configSms2FaInfo", "")}
            displayMessage={false}
        >
            <form id="kc-form-login" action={url.loginAction} method="post" className="space-y-4">
                {errorMessage !== "" && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errorMessage}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">{safeMsg(i18n, "phoneNumber", "Phone number")}</Label>
                    <div className="flex gap-2">
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            autoFocus={(kcContext.phoneNumber ?? "") === ""}
                            autoComplete="tel"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            disabled={sendButtonText !== sendVerificationCodeLabel}
                            onClick={() => void sendVerificationCode()}
                        >
                            {sendButtonText}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="code">{safeMsg(i18n, "verificationCode", "Verification code")}</Label>
                    <Input
                        id="code"
                        name="code"
                        type="text"
                        autoFocus={(kcContext.phoneNumber ?? "") !== ""}
                        autoComplete="one-time-code"
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" name="save" disabled={sendButtonText === sendVerificationCodeLabel}>
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


