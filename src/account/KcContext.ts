/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ExtendKcContext } from "keycloakify/account";
import type { KcEnvName, ThemeName } from "../kc.gen";

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {};

    /**
     * Some account templates (and custom extensions) expose realm name.
     * It's not always present in Keycloakify's default account typing.
     */
    realm?: {
        name?: string;
    };
};

export type KcContextExtensionPerPage = {
    "account.ftl": {
        account: {
            attributes?: {
                phoneNumber?: string;
            };
        };
    };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;


