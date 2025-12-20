export function startCountdown(params: {
    seconds: number;
    onTick: (label: string) => void;
    onDone: () => void;
}) {
    const { seconds, onTick, onDone } = params;

    const step = (s: number) => {
        if (s <= 0) {
            onDone();
            return;
        }

        const minutes = String(Math.floor(s / 60)).padStart(2, "0");
        const secondsStr = String(s % 60).padStart(2, "0");
        onTick(`${minutes}:${secondsStr}`);

        window.setTimeout(() => step(s - 1), 1000);
    };

    step(seconds);
}

export async function requestSmsCode(params: {
    realmName: string;
    endpoint:
        | "authentication-code"
        | "registration-code"
        | "reset-code"
        | "otp-code"
        | "verification-code";
    phoneNumber: string;
    kind?: string;
}): Promise<{ expiresIn: number }> {
    const { realmName, endpoint, phoneNumber, kind } = params;

    const url = new URL(
        `${window.location.origin}/realms/${encodeURIComponent(realmName)}/sms/${endpoint}`
    );
    url.searchParams.set("phoneNumber", phoneNumber);
    if (kind !== undefined) {
        url.searchParams.set("kind", kind);
    }

    const res = await fetch(url.toString(), { method: "GET" });

    if (!res.ok) {
        const maybeJson = await res.json().catch(() => undefined);
        const error =
            typeof maybeJson?.error === "string"
                ? maybeJson.error
                : `Request failed with status ${res.status}`;
        throw new Error(error);
    }

    const data = (await res.json()) as { expires_in?: number };

    return { expiresIn: Number(data.expires_in ?? 0) };
}


