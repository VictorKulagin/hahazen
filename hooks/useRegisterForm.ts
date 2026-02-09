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

    /*const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState((prevState) => ({
            ...prevState,
            [id]: value,
        }));
    };*/

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;

        let newValue = value;

        // Убираем пробелы только у email
        if (id === "email") {
            newValue = value.replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, "").toLowerCase();
        }

        if (id === "password") {
            // убираем пробелы только в конце (вставка / случайные)
            newValue = value.replace(/[\s\u00A0]+$/g, "");
        }

        setFormState((prevState) => ({
            ...prevState,
            [id]: newValue,
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
