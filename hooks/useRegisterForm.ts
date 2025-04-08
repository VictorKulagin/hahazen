import { useState } from "react";

// Интерфейс для данных формы
interface FormState {
    username: string;
    password: string;
    email: string;
    name: string;
    lastName: string;
}

// Хук для управления состоянием формы
export function useRegisterForm() {
    const [formState, setFormState] = useState<FormState>({
        username: "",
        password: "",
        email: "",
        name: "",
        lastName: "",
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
