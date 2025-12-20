/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ExtendKcContext } from "keycloakify/login";
import type { KcEnvName, ThemeName } from "../kc.gen";

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {};
    // NOTE: Here you can declare more properties to extend the KcContext
    // See: https://docs.keycloakify.dev/faq-and-help/some-values-you-need-are-missing-from-in-kccontext
    supportPhone?: boolean;
    attemptedPhoneActivated?: boolean;
    attemptedPhoneNumber?: string;
    loginWithPhoneNumber?: boolean;
};

export type KcContextExtensionPerPage = {
    /**
     * Extra variables injected by the keycloak-phone-provider theme for registration.
     * These are not part of Keycloakify's default KcContext typing.
     */
    "register.ftl": {
        phoneNumberRequired?: boolean;
        verifyPhone?: boolean;
        registrationPhoneNumberAsUsername?: boolean;
    };

    /**
     * Custom pages provided by keycloak-phone-provider.
     */
    "login-sms-otp.ftl": {
        initSend?: boolean;
        expires?: number;
    };
    "login-sms-otp-config.ftl": {
        phoneNumber?: string;
    };
    "login-update-phone-number.ftl": {
        phoneNumber?: string;
    };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
