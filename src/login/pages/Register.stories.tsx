import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "register.ftl" });

const meta = {
    title: "login/register.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <KcPageStory />
};

export const WithPhoneVerification: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                phoneNumberRequired: true,
                verifyPhone: true
            }}
        />
    )
};

export const WithPhoneNumberOnly: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                phoneNumberRequired: true,
                verifyPhone: false
            }}
        />
    )
};

export const WithValidationErrors: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                messagesPerField: {
                    existsError: (fieldName: string, ...otherFieldNames: string[]) => {
                        const fieldNames = [fieldName, ...otherFieldNames];
                        return fieldNames.includes("username") || fieldNames.includes("email");
                    },
                    get: (fieldName: string) => {
                        if (fieldName === "username") {
                            return "Username already exists.";
                        }
                        if (fieldName === "email") {
                            return "Invalid email address.";
                        }
                        return "";
                    }
                }
            }}
        />
    )
};
