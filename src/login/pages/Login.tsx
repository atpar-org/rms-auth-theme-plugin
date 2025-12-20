/**
 * Combined Username + Password login page (login.ftl) with optional WebAuthn passkey support.
 * Renders standard login form plus conditional passkey authenticator section.
 */
import type { JSX } from "keycloakify/tools/JSX";
import { useState } from "react";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { useIsPasswordRevealed } from "keycloakify/tools/useIsPasswordRevealed";
import { clsx } from "keycloakify/tools/clsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { getKcClsx, type KcClsx } from "keycloakify/login/lib/kcClsx";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { useScript } from "keycloakify/login/pages/Login.useScript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const {
        social,
        realm,
        url,
        usernameHidden,
        login,
        auth,
        registrationDisabled,
        messagesPerField,
        enableWebAuthnConditionalUI,
        authenticators
    } = kcContext;

    const { msg, msgStr } = i18n;

    // Storybook uses mocked i18n messages; your realm adds custom keys (loginByPhone, sendVerificationCode, ...)
    // that won't exist in Storybook. Keycloakify asserts when a key is missing, so we provide safe fallbacks.
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

    const supportPhone = kcContext.supportPhone === true;
    const defaultPhoneActivated = supportPhone && !usernameHidden ? kcContext.attemptedPhoneActivated ?? true : false;
    const [phoneActivated, setPhoneActivated] = useState<boolean>(defaultPhoneActivated);
    const [phoneNumber, setPhoneNumber] = useState<string>(kcContext.attemptedPhoneNumber ?? "");
    const sendVerificationCodeLabel = safeMsgStr("sendVerificationCode", "Send code");
    const requiredPhoneNumberLabel = safeMsgStr("requiredPhoneNumber", "Phone number is required");
    const [sendButtonText, setSendButtonText] = useState<string>(sendVerificationCodeLabel);
    const [errorMessage, setErrorMessage] = useState<string>("");

    function startTimer(seconds: number) {
        if (seconds <= 0) {
            setSendButtonText(sendVerificationCodeLabel);
            return;
        }
        const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
        const secondsStr = String(seconds % 60).padStart(2, "0");
        setSendButtonText(`${minutes}:${secondsStr}`);
        window.setTimeout(() => startTimer(seconds - 1), 1000);
    }

    async function sendVerificationCode() {
        setErrorMessage("");

        const trimmed = phoneNumber.trim();
        if (!trimmed) {
            setErrorMessage(requiredPhoneNumberLabel);
            return;
        }

        // Prevent spamming while timer is active.
        if (sendButtonText !== sendVerificationCodeLabel) {
            return;
        }

        try {
            const res = await fetch(
                `${window.location.origin}/realms/${encodeURIComponent(realm.name)}/sms/authentication-code?phoneNumber=${encodeURIComponent(
                    trimmed
                )}`
            );

            if (!res.ok) {
                // Try to read Keycloak style error response.
                const maybeJson = await res.json().catch(() => undefined);
                const message =
                    typeof maybeJson?.error === "string"
                        ? maybeJson.error
                        : msgStr("errorTitle"); // fallback (built-in key)
                setErrorMessage(message);
                return;
            }

            const data = (await res.json()) as { expires_in?: number };
            startTimer(Number(data.expires_in ?? 0));
        } catch {
            setErrorMessage(msgStr("errorTitle"));
        }
    }

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

    const webAuthnButtonId = "authenticateWebAuthnButton";

    useScript({
        webAuthnButtonId,
        kcContext,
        i18n
    });

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!messagesPerField.existsError("username", "password")}
            headerNode={msg("loginAccountTitle")}
            displayInfo={realm.password && realm.registrationAllowed && !registrationDisabled}
            infoNode={
                <div id="kc-registration-container">
                    <div id="kc-registration">
                        <span>
                            {msg("noAccount")}{" "}
                            <a tabIndex={8} href={url.registrationUrl}>
                                {msg("doRegister")}
                            </a>
                        </span>
                    </div>
                </div>
            }
            socialProvidersNode={
                <>
                    {realm.password && social?.providers !== undefined && social.providers.length !== 0 && (
                        <div id="kc-social-providers" className={kcClsx("kcFormSocialAccountSectionClass")}>
                            <hr />
                            <h2>{msg("identity-provider-login-label")}</h2>
                            <ul className={kcClsx("kcFormSocialAccountListClass", social.providers.length > 3 && "kcFormSocialAccountListGridClass")}>
                                {social.providers.map((...[p, , providers]) => (
                                    <li key={p.alias}>
                                        <a
                                            id={`social-${p.alias}`}
                                            className={kcClsx(
                                                "kcFormSocialAccountListButtonClass",
                                                providers.length > 3 && "kcFormSocialAccountGridItem"
                                            )}
                                            type="button"
                                            href={p.loginUrl}
                                        >
                                            {p.iconClasses && <i className={clsx(kcClsx("kcCommonLogoIdP"), p.iconClasses)} aria-hidden="true"></i>}
                                            <span
                                                className={clsx(kcClsx("kcFormSocialAccountNameClass"), p.iconClasses && "kc-social-icon-text")}
                                                dangerouslySetInnerHTML={{ __html: kcSanitize(p.displayName) }}
                                            ></span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            }
        >
            <div id="kc-form">
                <div id="kc-form-wrapper">
                    {realm.password && (
                        <form
                            id="kc-form-login"
                            onSubmit={() => {
                                setIsLoginButtonDisabled(true);
                                return true;
                            }}
                            action={url.loginAction}
                            method="post"
                        >
                            {!usernameHidden && supportPhone && (
                                <>
                                    <Tabs
                                        value={phoneActivated ? "phone" : "password"}
                                        onValueChange={value => setPhoneActivated(value === "phone")}
                                        className="w-full"
                                    >
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="phone">
                                                {safeMsg("loginByPhone", "Phone")}
                                            </TabsTrigger>
                                            <TabsTrigger value="password">
                                                {safeMsg("loginByPassword", "Password")}
                                            </TabsTrigger>
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

                            {/* Password login */}
                            {(!supportPhone || usernameHidden || !phoneActivated) && (
                                <>
                                    {!usernameHidden && (
                                        <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                                            <Label htmlFor="username" className={kcClsx("kcLabelClass")}>
                                                {!realm.loginWithEmailAllowed
                                                    ? msg("username")
                                                    : !realm.registrationEmailAsUsername
                                                      ? kcContext.loginWithPhoneNumber
                                                          ? safeMsg("usernameOrEmailOrPhoneNumber", "Username or email or phone")
                                                          : msg("usernameOrEmail")
                                                      : msg("email")}
                                            </Label>
                                            <Input
                                                tabIndex={2}
                                                id="username"
                                                className={kcClsx("kcInputClass")}
                                                name="username"
                                                defaultValue={login.username ?? ""}
                                                type="text"
                                                autoFocus={!supportPhone || !phoneActivated}
                                                autoComplete="off"
                                                aria-invalid={messagesPerField.existsError("username", "password")}
                                            />
                                            {messagesPerField.existsError("username", "password") && (
                                                <span
                                                    id="input-error"
                                                    className={clsx(
                                                        kcClsx("kcInputErrorMessageClass"),
                                                        "text-sm text-destructive"
                                                    )}
                                                    aria-live="polite"
                                                    dangerouslySetInnerHTML={{
                                                        __html: kcSanitize(
                                                            messagesPerField.getFirstError("username", "password")
                                                        )
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                                        <Label htmlFor="password" className={kcClsx("kcLabelClass")}>
                                            {msg("password")}
                                        </Label>
                                        <PasswordWrapper kcClsx={kcClsx} i18n={i18n} passwordInputId="password">
                                            <Input
                                                tabIndex={3}
                                                id="password"
                                                className={kcClsx("kcInputClass")}
                                                name="password"
                                                type="password"
                                                autoComplete="off"
                                                aria-invalid={messagesPerField.existsError("username", "password")}
                                            />
                                        </PasswordWrapper>
                                        {usernameHidden && messagesPerField.existsError("username", "password") && (
                                            <span
                                                id="input-error"
                                                className={clsx(
                                                    kcClsx("kcInputErrorMessageClass"),
                                                    "text-sm text-destructive"
                                                )}
                                                aria-live="polite"
                                                dangerouslySetInnerHTML={{
                                                    __html: kcSanitize(
                                                        messagesPerField.getFirstError("username", "password")
                                                    )
                                                }}
                                            />
                                        )}
                                    </div>

                                    <div
                                        className={clsx(
                                            kcClsx("kcFormGroupClass", "kcFormSettingClass"),
                                            "flex items-center justify-between gap-4"
                                        )}
                                    >
                                        <div id="kc-form-options" className="flex items-center">
                                            {realm.rememberMe && !usernameHidden && (
                                                <label
                                                    htmlFor="rememberMe"
                                                    className="flex items-center space-x-2 text-sm font-normal"
                                                >
                                                    <Checkbox
                                                        tabIndex={5}
                                                        id="rememberMe"
                                                        name="rememberMe"
                                                        defaultChecked={!!login.rememberMe}
                                                    />
                                                    <span>{msg("rememberMe")}</span>
                                                </label>
                                            )}
                                        </div>
                                        <div className={kcClsx("kcFormOptionsWrapperClass")}>
                                            {realm.resetPasswordAllowed && (
                                                <Button
                                                    asChild
                                                    variant="link"
                                                    size="sm"
                                                    className="px-0 text-sm font-normal"
                                                    tabIndex={6}
                                                >
                                                    <a href={url.loginResetCredentialsUrl}>{msg("doForgotPassword")}</a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Phone login */}
                            {supportPhone && !usernameHidden && phoneActivated && (
                                <div className="space-y-4">
                                    <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                                        <Label htmlFor="phoneNumber" className={kcClsx("kcLabelClass")}>
                                            {safeMsg("phoneNumber", "Phone number")}
                                        </Label>
                                        <Input
                                            tabIndex={2}
                                            type="text"
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            autoFocus
                                            autoComplete="off"
                                            aria-invalid={messagesPerField.existsError("code", "phoneNumber")}
                                        />
                                        {messagesPerField.existsError("code", "phoneNumber") && (
                                            <span
                                                id="input-error"
                                                className={clsx(
                                                    kcClsx("kcInputErrorMessageClass"),
                                                    "text-sm text-destructive"
                                                )}
                                                aria-live="polite"
                                                dangerouslySetInnerHTML={{
                                                    __html: kcSanitize(
                                                        messagesPerField.getFirstError("phoneNumber", "code")
                                                    )
                                                }}
                                            />
                                        )}
                                    </div>

                                    <div className={clsx(kcClsx("kcFormGroupClass"), "space-y-2")}>
                                        <Label htmlFor="code" className={kcClsx("kcLabelClass")}>
                                            {safeMsg("verificationCode", "Verification code")}
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                tabIndex={3}
                                                type="text"
                                                id="code"
                                                name="code"
                                                autoComplete="off"
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

                            <div
                                id="kc-form-buttons"
                                className={clsx(
                                    kcClsx("kcFormGroupClass"),
                                    "flex justify-center",
                                    supportPhone && !usernameHidden && phoneActivated ? "mt-4" : undefined
                                )}
                            >
                                <input
                                    type="hidden"
                                    id="id-hidden-input"
                                    name="credentialId"
                                    value={auth.selectedCredential}
                                />

                                <Button
                                    type="submit"
                                    tabIndex={7}
                                    disabled={isLoginButtonDisabled}
                                    name="login"
                                >
                                    {msg("doLogIn")}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            {enableWebAuthnConditionalUI && (
                <>
                    <form id="webauth" action={url.loginAction} method="post">
                        <input type="hidden" id="clientDataJSON" name="clientDataJSON" />
                        <input type="hidden" id="authenticatorData" name="authenticatorData" />
                        <input type="hidden" id="signature" name="signature" />
                        <input type="hidden" id="credentialId" name="credentialId" />
                        <input type="hidden" id="userHandle" name="userHandle" />
                        <input type="hidden" id="error" name="error" />
                    </form>

                    {authenticators !== undefined && authenticators.authenticators.length !== 0 && (
                        <>
                            <form id="authn_select" className={kcClsx("kcFormClass")}>
                                {authenticators.authenticators.map((authenticator, i) => (
                                    <input key={i} type="hidden" name="authn_use_chk" readOnly value={authenticator.credentialId} />
                                ))}
                            </form>
                        </>
                    )}
                    <br />

                    <input
                        id={webAuthnButtonId}
                        type="button"
                        className={kcClsx("kcButtonClass", "kcButtonDefaultClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                        value={msgStr("passkey-doAuthenticate")}
                    />
                </>
            )}
        </Template>
    );
}

function PasswordWrapper(props: { kcClsx: KcClsx; i18n: I18n; passwordInputId: string; children: JSX.Element }) {
    const { kcClsx, i18n, passwordInputId, children } = props;

    const { msgStr } = i18n;

    const { isPasswordRevealed, toggleIsPasswordRevealed } = useIsPasswordRevealed({ passwordInputId });

    return (
        <div className={kcClsx("kcInputGroup")}>
            {children}
            <button
                type="button"
                className={kcClsx("kcFormPasswordVisibilityButtonClass")}
                aria-label={msgStr(isPasswordRevealed ? "hidePassword" : "showPassword")}
                aria-controls={passwordInputId}
                onClick={toggleIsPasswordRevealed}
            >
                <i className={kcClsx(isPasswordRevealed ? "kcFormPasswordVisibilityIconHide" : "kcFormPasswordVisibilityIconShow")} aria-hidden />
            </button>
        </div>
    );
}
