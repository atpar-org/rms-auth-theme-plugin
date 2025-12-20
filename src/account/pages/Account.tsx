import type { PageProps } from "keycloakify/account/pages/PageProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
    interface Window {
        grecaptcha?: {
            render: (container: HTMLElement | string, params: { sitekey: string }) => number;
            getResponse: (widgetId?: number) => string;
        };
    }
}

export default function Account(props: PageProps<Extract<KcContext, { pageId: "account.ftl" }>, I18n>) {
    const { kcContext, i18n, Template, doUseDefaultCss, classes } = props;
    const { msg } = i18n;

    const { url, account, stateChecker, messagesPerField } = kcContext;

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [sendButtonText, setSendButtonText] = useState<string>(safeMsgStr(i18n, "sendVerificationCode", "Send code"));
    const initSendButtonText = safeMsgStr(i18n, "sendVerificationCode", "Send code");

    const [recaptchaKey, setRecaptchaKey] = useState<string>("");
    const recaptchaWidgetIdRef = useRef<number | undefined>(undefined);
    const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

    const actionUrl = useMemo(() => getPhoneAccountActionUrl(url.accountUrl), [url.accountUrl]);
    const realmBaseUrl = useMemo(() => getRealmBaseUrlFromAccountUrl(url.accountUrl), [url.accountUrl]);

    useEffect(() => {
        if (!realmBaseUrl) {
            return;
        }

        void (async () => {
            try {
                const res = await fetch(`${realmBaseUrl}/recaptcha/key`, { method: "GET" });
                if (!res.ok) {
                    return;
                }
                const data = (await res.json()) as { capacha_key?: string };
                if (typeof data.capacha_key === "string" && data.capacha_key.trim() !== "") {
                    setRecaptchaKey(data.capacha_key);
                }
            } catch {
                // If recaptcha isn't configured, we just won't show it.
            }
        })();
    }, [realmBaseUrl]);

    useEffect(() => {
        if (!recaptchaKey) {
            return;
        }

        const scriptId = "recaptcha-script";
        if (document.getElementById(scriptId)) {
            renderRecaptchaIfPossible();
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.async = true;
        script.defer = true;
        script.src = "https://www.recaptcha.net/recaptcha/api.js?render=explicit";
        script.onload = () => {
            renderRecaptchaIfPossible();
        };
        document.body.appendChild(script);

        function renderRecaptchaIfPossible() {
            if (!recaptchaContainerRef.current) {
                return;
            }
            if (!window.grecaptcha) {
                return;
            }
            if (recaptchaWidgetIdRef.current !== undefined) {
                return;
            }

            recaptchaWidgetIdRef.current = window.grecaptcha.render(recaptchaContainerRef.current, {
                sitekey: recaptchaKey
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recaptchaKey]);

    function startSimpleCountdown(seconds: number) {
        if (seconds <= 0) {
            setSendButtonText(initSendButtonText);
            return;
        }
        setSendButtonText(String(seconds));
        window.setTimeout(() => startSimpleCountdown(seconds - 1), 1000);
    }

    async function sendVerificationCode() {
        setErrorMessage("");

        if (!realmBaseUrl) {
            setErrorMessage("Cannot determine realm base URL from accountUrl");
            return;
        }

        const pnInput = document.getElementById("user.attributes.phoneNumber") as HTMLInputElement | null;
        const phoneNumber = (pnInput?.value ?? "").trim();
        if (!phoneNumber) {
            setErrorMessage(safeMsgStr(i18n, "requirePhoneNumber", "Phone number is required"));
            pnInput?.focus();
            return;
        }

        let recaptchaResponse = "";
        if (recaptchaKey) {
            recaptchaResponse = window.grecaptcha?.getResponse(recaptchaWidgetIdRef.current) ?? "";
            if (!recaptchaResponse) {
                setErrorMessage(safeMsgStr(i18n, "requireRecaptcha", "Recaptcha is required"));
                return;
            }
        }

        if (sendButtonText !== initSendButtonText) {
            return;
        }

        // Mirror FTL: always start 60s cooldown immediately.
        startSimpleCountdown(60);

        try {
            const body = new URLSearchParams();
            body.set("phoneNumber", phoneNumber);
            body.set("kind", "updatePhoneNumber");
            if (recaptchaResponse) {
                body.set("g-recaptcha-response", recaptchaResponse);
            }

            await fetch(`${realmBaseUrl}/verification_codes`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body.toString()
            });
        } catch (e) {
            setErrorMessage(
                e instanceof Error ? e.message : safeMsgStr(i18n, "errorTitle", "Error")
            );
        }
    }

    return (
        <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={doUseDefaultCss} classes={classes} active="account">
            <Card className="mx-auto w-full max-w-3xl">
                <CardHeader>
                    <CardTitle>{msg("editAccountHtmlTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {errorMessage !== "" && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    )}

                    {kcContext.message && (
                        <div
                            className="rounded-md border px-4 py-3 text-sm"
                            dangerouslySetInnerHTML={{ __html: kcSanitize(kcContext.message.summary) }}
                        />
                    )}

                    <form id="kc-account-form" action={actionUrl} method="post" className="space-y-6">
                        <input type="hidden" id="stateChecker" name="stateChecker" value={stateChecker} />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="username">
                                    {msg("username")} {kcContext.realm.editUsernameAllowed ? <span>*</span> : null}
                                </Label>
                                <Input
                                    id="username"
                                    name="username"
                                    defaultValue={account.username ?? ""}
                                    disabled={!kcContext.realm.editUsernameAllowed}
                                    aria-invalid={messagesPerField.exists("username")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    {msg("email")} <span>*</span>
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    defaultValue={account.email ?? ""}
                                    autoFocus
                                    aria-invalid={messagesPerField.exists("email")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="firstName">
                                    {msg("firstName")} <span>*</span>
                                </Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    defaultValue={account.firstName ?? ""}
                                    aria-invalid={messagesPerField.exists("firstName")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">
                                    {msg("lastName")} <span>*</span>
                                </Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    defaultValue={account.lastName ?? ""}
                                    aria-invalid={messagesPerField.exists("lastName")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user.attributes.phoneNumber">{safeMsg(i18n, "phoneNumber", "Phone number")}</Label>
                            <Input
                                id="user.attributes.phoneNumber"
                                name="user.attributes.phoneNumber"
                                defaultValue={kcContext.account.attributes?.phoneNumber ?? ""}
                                aria-invalid={messagesPerField.exists("user.attributes.phoneNumber")}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-end">
                            <div className="space-y-2">
                                <Label htmlFor="verificationCode">{safeMsg(i18n, "verificationCode", "Verification code")}</Label>
                                <Input id="verificationCode" name="verificationCode" />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="md:mb-0"
                                disabled={sendButtonText !== initSendButtonText}
                                onClick={() => void sendVerificationCode()}
                            >
                                {sendButtonText}
                            </Button>
                        </div>

                        {recaptchaKey && <div ref={recaptchaContainerRef} id="recaptcha_element" />}

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            {kcContext.referrer?.url && (
                                <Button asChild variant="link" className="px-0 sm:mr-auto">
                                    <a href={kcContext.referrer.url}>{msg("backToApplication")}</a>
                                </Button>
                            )}

                            <Button type="submit" name="submitAction" value="Save">
                                {msg("doSave")}
                            </Button>
                            <Button type="submit" variant="outline" name="submitAction" value="Cancel">
                                {msg("doCancel")}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </Template>
    );
}

function getPhoneAccountActionUrl(accountUrl: string): string {
    // Typical: https://host/auth/realms/<realm>/account/
    const m = accountUrl.replace(/\/+$/, "").match(/^(.*)\/account$/);
    if (m) {
        return `${m[1]}/phone_account/`;
    }
    return `${accountUrl.replace(/\/+$/, "")}/phone_account/`;
}

function getRealmBaseUrlFromAccountUrl(accountUrl: string): string | undefined {
    try {
        const u = new URL(accountUrl);
        const idx = u.pathname.indexOf("/realms/");
        if (idx === -1) {
            return undefined;
        }
        const rest = u.pathname.slice(idx + "/realms/".length);
        const realmName = rest.split("/")[0];
        const prefix = u.pathname.slice(0, idx);
        return `${u.origin}${prefix}/realms/${realmName}`;
    } catch {
        return undefined;
    }
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


