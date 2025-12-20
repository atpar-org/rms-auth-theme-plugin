import type { PageProps } from "keycloakify/login/pages/PageProps";
import { clsx } from "keycloakify/tools/clsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requestSmsCode, startCountdown } from "../lib/sms";

export default function LoginResetPassword(
    props: PageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>, I18n>
) {
    const { kcContext, i18n, Template, doUseDefaultCss, classes } = props;

    const { msg, msgStr } = i18n;
    const { realm, url, auth, messagesPerField } = kcContext;

    const supportPhone = kcContext.supportPhone === true;
    const defaultPhoneActivated = supportPhone ? kcContext.attemptedPhoneActivated ?? false : false;
    const [phoneActivated, setPhoneActivated] = useState(defaultPhoneActivated);
    const [phoneNumber, setPhoneNumber] = useState(kcContext.attemptedPhoneNumber ?? "");

    const sendVerificationCodeLabel = safeMsgStr(i18n, "sendVerificationCode", "Send code");
    const requiredPhoneNumberLabel = safeMsgStr(i18n, "requiredPhoneNumber", "Phone number is required");

    const [sendButtonText, setSendButtonText] = useState(sendVerificationCodeLabel);
    const [errorMessage, setErrorMessage] = useState<string>("");

    async function sendVerificationCode() {
        setErrorMessage("");

        const trimmed = phoneNumber.trim();
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
                endpoint: "reset-code",
                phoneNumber: trimmed
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

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            headerNode={msg("emailForgotTitle")}
            displayInfo={true}
            displayMessage={false}
            infoNode={
                <>
                    {realm.duplicateEmailsAllowed ? msg("emailInstructionUsername") : msg("emailInstruction")}
                    {supportPhone ? ` ${safeMsg(i18n, "phoneInstruction", "")}` : null}
                </>
            }
        >
            <form id="kc-reset-password-form" action={url.loginAction} method="post" className="space-y-4">
                {supportPhone && (
                    <>
                        <Tabs
                            value={phoneActivated ? "phone" : "usernameOrEmail"}
                            onValueChange={value => setPhoneActivated(value === "phone")}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="usernameOrEmail">{msg("usernameOrEmail")}</TabsTrigger>
                                <TabsTrigger value="phone">{safeMsg(i18n, "phoneNumber", "Phone number")}</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <input type="hidden" id="phoneActivated" name="phoneActivated" value={String(phoneActivated)} />
                    </>
                )}

                {errorMessage !== "" && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errorMessage}
                    </div>
                )}

                {!phoneActivated && (
                    <div className="space-y-2">
                        <Label htmlFor="username">{msg("usernameOrEmail")}</Label>
                        <Input
                            type="text"
                            id="username"
                            name="username"
                            defaultValue={auth.attemptedUsername ?? ""}
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
                )}

                {supportPhone && phoneActivated && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">{safeMsg(i18n, "phoneNumber", "Phone number")}</Label>
                            <Input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                autoFocus
                                aria-invalid={messagesPerField.existsError("code", "phoneNumber")}
                                autoComplete="tel"
                            />
                            {messagesPerField.existsError("code", "phoneNumber") && (
                                <span
                                    className="text-sm text-destructive"
                                    aria-live="polite"
                                    dangerouslySetInnerHTML={{
                                        __html: kcSanitize(messagesPerField.getFirstError("phoneNumber", "code"))
                                    }}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">{safeMsg(i18n, "verificationCode", "Verification code")}</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    id="code"
                                    name="code"
                                    autoComplete="one-time-code"
                                    aria-invalid={messagesPerField.existsError("code", "phoneNumber")}
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
                        </div>
                    </div>
                )}

                <div className={clsx("flex items-center justify-between gap-3")}>
                    <Button asChild variant="link" size="sm" className="px-0">
                        <a href={url.loginUrl}>{msg("backToLogin")}</a>
                    </Button>
                    <Button type="submit">{msg("doSubmit")}</Button>
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


