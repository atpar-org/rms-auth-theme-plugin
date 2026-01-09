/* eslint-disable @typescript-eslint/no-unused-vars */
import { i18nBuilder } from "keycloakify/login";
import type { ThemeName } from "../kc.gen";

/**
 * @see: https://docs.keycloakify.dev/features/i18n
 *
 * Extra messages are required for custom message keys from the keycloak-phone-provider.
 * Without these, Keycloakify throws "Wrong assertion encountered" errors when
 * trying to look up unknown message keys.
 */
const { useI18n, ofTypeI18n } = i18nBuilder
    .withThemeName<ThemeName>()
    .withExtraMessages({
        en: {
            // Phone provider messages
            phoneNumber: "Phone number",
            requiredPhoneNumber: "Phone number is required.",
            sendVerificationCode: "Send code",
            verificationCode: "Verification code",
            authenticationCode: "Authentication code",
            invalidPhoneNumber: "Phone number is invalid",
            phoneNumberExists: "Phone number already registered",
            requiredVerificationCode: "Verification code is required.",
            phoneTokenCodeDoesNotMatch: "The verification code you entered is incorrect.",
            phoneTokenExpired: "The verification code has expired. Please request a new one.",
            phoneTokenHasExpired: "The verification code has expired. Please request a new one.",
            phoneTokenNotFound: "The verification code is invalid. Please request a new one.",
            abusedMessageService: "Too many code requests for your mobile number.",
            sendVerificationCodeFail: "Verification code send fail!",
            noOngoingVerificationProcess: "There is no ongoing verification process.",
            verificationCodeDoesNotMatch: "Informed verification code does not match ours.",
            phoneUserNotFound: "User not exists.",
            codeSent: "OTP code is sent to {0}",
            loginByPhone: "Phone",
            loginByPassword: "Password",
            usernameOrPhoneNumber: "Username or phone",
            usernameOrEmailOrPhoneNumber: "Username or email or phone",
            emailOrPhoneNumber: "Email or phone",
            updatePhoneNumber: "Update Your Mobile Number",
            configSms2Fa: "Configure SMS 2FA",
            authCodePhoneNumber: "Authentication code",
            updatePhoneNumberInfo: "Enter your mobile number and click to receive a code.",
            configSms2FaInfo: "Enter your mobile number and click to receive a code.",
            authCodeInfo: "Enter the authentication code you received on your mobile."
        }
    })
    .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };
