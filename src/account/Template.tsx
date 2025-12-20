import { useEffect } from "react";
import type { TemplateProps } from "keycloakify/account/TemplateProps";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { useInitialize } from "keycloakify/account/Template.useInitialize";
import type { KcContext } from "./KcContext";
import type { I18n } from "./i18n";

export default function Template(props: TemplateProps<KcContext, I18n>) {
    const { kcContext, doUseDefaultCss, children } = props;

    useSetClassName({ qualifiedName: "html", className: doUseDefaultCss ? "kcHtmlClass" : "" });
    useSetClassName({ qualifiedName: "body", className: doUseDefaultCss ? "kcBodyClass" : "" });

    const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });

    useEffect(() => {
        // No-op, but keeps parity with login template pattern (and gives a hook for future page titles).
    }, []);

    if (!isReadyToRender) {
        return null;
    }

    return <div className="min-h-screen bg-background px-4 py-8">{children}</div>;
}


