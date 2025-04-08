import { useState } from "react";

// Интерфейс для данных формы
interface FormState {
    company_id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
}

// Хук для управления состоянием формы
export function branchesAddForm() {
    const [formState, setFormState] = useState<FormState>({
        company_id: 0,
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
