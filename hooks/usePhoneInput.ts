import { useCallback, useState, type ChangeEvent } from "react";
import { normalizePhoneInput } from "@/components/utils/phone";

const usePhoneInput = (initialValue: string = "") => {
    const [phone, setPhone] = useState(normalizePhoneInput(initialValue));

    const handlePhoneChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setPhone(normalizePhoneInput(event.target.value));
        },
        []
    );

    const resetPhone = useCallback(
        () => setPhone(normalizePhoneInput(initialValue)),
        [initialValue]
    );

    return {
        phone,
        handlePhoneChange,
        resetPhone,
    };
};

export default usePhoneInput;
