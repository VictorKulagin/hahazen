import { useState } from "react";

// Интерфейс для данных формы
interface FormState {
    name: string;
    address: string;
    phone: string;
    email: string;
}

// Хук для управления состоянием формы
export function companiesAddForm() {
    const [formState, setFormState] = useState<FormState>({
        name: "",
        address: "",
        phone: "",
        email: "",
    });

    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState((prevState) => ({
            ...prevState,
            [id]: value,
        }));
    };

    return {
        formState,
        handleInputChange,
        error,
        setError,
        success,
        setSuccess,
        isLoading,
        setIsLoading,
    };
}
