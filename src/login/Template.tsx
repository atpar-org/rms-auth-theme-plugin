import { useEffect } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { TemplateProps } from "keycloakify/login/TemplateProps";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { useInitialize } from "keycloakify/login/Template.useInitialize";
import type { I18n } from "./i18n";
import type { KcContext } from "./KcContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { formatKcMessage } from "./lib/formatKcMessage";
import atparLogo from "./assets/atpar_logo.jpg";
export default function Template(props: TemplateProps<KcContext, I18n>) {
    const {
        displayInfo = false,
        displayMessage = true,
        displayRequiredFields = false,
        headerNode,
        socialProvidersNode = null,
        infoNode = null,
        documentTitle,
        bodyClassName,
        kcContext,
        i18n,
        doUseDefaultCss,
        classes,
        children
    } = props;

    const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });

    const { msg, msgStr, currentLanguage, enabledLanguages } = i18n;

    const { realm, auth, url, message, isAppInitiatedAction } = kcContext;

    useEffect(() => {
        document.title = documentTitle ?? msgStr("loginTitle", realm.displayName);
    }, []);

    useSetClassName({
        qualifiedName: "html",
        className: kcClsx("kcHtmlClass")
    });

    useSetClassName({
        qualifiedName: "body",
        className: bodyClassName ?? kcClsx("kcBodyClass")
    });

    const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });

    if (!isReadyToRender) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex items-center justify-center">
                    <img src={atparLogo} alt="aPAR Logo" className="max-w-md w-full h-auto" />
                </div>
                <Card className="w-full shadow-lg border">
                    <CardHeader className="space-y-4">
                    {enabledLanguages.length > 1 && (
                        <div className="flex justify-end">
                            <div id="kc-locale">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            role="combobox"
                                            className="h-8 px-3 text-xs font-normal text-muted-foreground"
                                            tabIndex={1}
                                            id="kc-current-locale-link"
                                            aria-label={msgStr("languages")}
                                            aria-haspopup="listbox"
                                            aria-controls="language-switch1"
                                        >
                                            <span>{currentLanguage.label}</span>
                                            <ChevronDown className="ml-1 h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="min-w-[7rem] p-0">
                                        <ul
                                            role="listbox"
                                            tabIndex={-1}
                                            aria-labelledby="kc-current-locale-link"
                                            id="language-switch1"
                                            className="max-h-60 overflow-auto py-1 text-sm"
                                        >
                                            {enabledLanguages.map(({ languageTag, label, href }: { languageTag: string; label: string; href: string }, i: number) => (
                                                <li key={languageTag} role="none">
                                                    <a
                                                        role="option"
                                                        aria-selected={currentLanguage.languageTag === languageTag}
                                                        id={`language-${i + 1}`}
                                                        href={href}
                                                        className="flex cursor-pointer select-none items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                                    >
                                                        {label}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                    {(() => {
                        const node = !(auth !== undefined && auth.showUsername && !auth.showResetCredentials) ? (
                            <div>
                                <CardTitle className="text-2xl font-semibold tracking-tight">
                                    {headerNode}
                                </CardTitle>
                            </div>
                        ) : (
                            <div id="kc-username" className={kcClsx("kcFormGroupClass")}>
                                <label id="kc-attempted-username">{auth.attemptedUsername}</label>
                                <a
                                    id="reset-login"
                                    href={url.loginRestartFlowUrl}
                                    aria-label={msgStr("restartLoginTooltip")}
                                >
                                    <div className="kc-login-tooltip">
                                        <i className={kcClsx("kcResetFlowIcon")}></i>
                                        <span className="kc-tooltip-text">{msg("restartLoginTooltip")}</span>
                                    </div>
                                </a>
                            </div>
                        );

                        if (displayRequiredFields) {
                            return (
                                <div className={kcClsx("kcContentWrapperClass")}>
                                    <div className={clsx(kcClsx("kcLabelWrapperClass"), "subtitle")}>
                                        <span className="subtitle">
                                            <span className="required">*</span>
                                            {msg("requiredFields")}
                                        </span>
                                    </div>
                                    <div className="col-md-10">{node}</div>
                                </div>
                            );
                        }

                        return node;
                    })()}
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* App-initiated actions should not see warning messages about the need to complete the action during login. */}
                    {displayMessage && message !== undefined && (message.type !== "warning" || !isAppInitiatedAction) && (
                        <div
                            className={clsx(
                                "rounded-md border px-4 py-3 text-sm",
                                `alert-${message.type}`,
                                kcClsx("kcAlertClass"),
                                `pf-m-${message?.type === "error" ? "danger" : message.type}`
                            )}
                        >
                            <div className="pf-c-alert__icon">
                                {message.type === "success" && <span className={kcClsx("kcFeedbackSuccessIcon")}></span>}
                                {message.type === "warning" && <span className={kcClsx("kcFeedbackWarningIcon")}></span>}
                                {message.type === "error" && <span className={kcClsx("kcFeedbackErrorIcon")}></span>}
                                {message.type === "info" && <span className={kcClsx("kcFeedbackInfoIcon")}></span>}
                            </div>
                            <span
                                className={kcClsx("kcAlertTitleClass")}
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(formatKcMessage(i18n, message.summary))
                                }}
                            />
                        </div>
                    )}
                    {children}
                    {auth !== undefined && auth.showTryAnotherWayLink && (
                        <form id="kc-select-try-another-way-form" action={url.loginAction} method="post">
                            <div className={kcClsx("kcFormGroupClass")}>
                                <input type="hidden" name="tryAnotherWay" value="on" />
                                <a
                                    href="#"
                                    id="try-another-way"
                                    onClick={() => {
                                        document.forms["kc-select-try-another-way-form" as never].requestSubmit();
                                        return false;
                                    }}
                                >
                                    {msg("doTryAnotherWay")}
                                </a>
                            </div>
                        </form>
                    )}
                    {socialProvidersNode}
                </CardContent>
                {displayInfo && (
                    <CardFooter className="flex justify-center">
                        <div id="kc-info" className={kcClsx("kcSignUpClass")}>
                            <div id="kc-info-wrapper" className={kcClsx("kcInfoAreaWrapperClass")}>
                                {infoNode}
                            </div>
                        </div>
                    </CardFooter>
                )}
                </Card>
            </div>
        </div>
    );
}
