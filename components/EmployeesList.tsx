// components/EmployeesList.tsx
/*"use client";
import { useEmployees } from "@/hooks/useEmployees";
import Link from "next/link";
import { useParams } from "next/navigation";

interface EmployeesListProps {
    branchId?: number;
}
debugger;

export default function EmployeesList({ branchId }: EmployeesListProps) {
    const params = useParams();
    //const finalBranchId = branchId ?? (params.branchId ? Number(params.branchId) : undefined);
    const finalBranchId = branchId ?? (
        params && typeof params.branchId !== 'undefined'
            ? Array.isArray(params.branchId)
                ? Number(params.branchId[0])
                : Number(params.branchId)
            : undefined
    );
    const { data: employees, isLoading, error, isConnected } = useEmployees(finalBranchId);

    if (isLoading) return <p>Загрузка...</p>;
    if (error) return <p className="text-red-500">Ошибка загрузки: {error.message}</p>;

    return (
        <div className="ml-10 mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {isConnected ? 'Онлайн-обновления' : 'Обновления приостановлены'}
            </div>
            {employees?.map((employee) => (
                <Link
                    key={employee.id}
                     href={`/timetable/${employee.branch_id}#master=${employee.id}`}
                        onClick={() => {
                            console.log("Clicked employee:", employee.id);
                            setTimeout(() => {
                            window.dispatchEvent(new Event('hashchange'));
                    }, 10); // небольшой delay — чтобы URL успел обновиться
                }}
                    className="w-full px-4 py-2 bg-gray-700/30 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors duration-200"
                >
                    {employee.name}
                </Link>
            ))}
        </div>
    );
}*/

// components/EmployeesList.tsx
"use client";
import { useEmployees } from "@/hooks/useEmployees";
import { useParams, useRouter } from "next/navigation";

interface EmployeesListProps {
    branchId?: number;
}

export default function EmployeesList({ branchId }: EmployeesListProps) {
    const params = useParams();
    const router = useRouter();

    const finalBranchId = branchId ?? (
        params && typeof params.branchId !== 'undefined'
            ? Array.isArray(params.branchId)
                ? Number(params.branchId[0])
                : Number(params.branchId)
            : undefined
    );

    const { data: employees, isLoading, error, isConnected } = useEmployees(finalBranchId);

   /* const handleEmployeeClick = (employee: any) => {
        console.log("Clicked employee:", employee.id);
        const url = `/timetable/${employee.branch_id}#master=${employee.id}`;

        // Используем router.push для навигации
        router.push(url);

        // Небольшая задержка для обеспечения обновления URL
        setTimeout(() => {
            window.dispatchEvent(new Event('hashchange'));
        }, 50);
    };*/

    const handleEmployeeClick = (employee: any) => {
        console.log("Clicked employee:", employee.id);
        const url = `/timetable/${employee.branch_id}#master=${employee.id}`;

        // Прямое изменение location для принудительного обновления
        window.location.href = url;
    };

    if (isLoading) return <p>Загрузка...</p>;
    if (error) return <p className="text-red-500">Ошибка загрузки: {error.message}</p>;

    return (
        <div className="ml-10 mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {isConnected ? 'Онлайн-обновления' : 'Обновления приостановлены'}
            </div>

            {employees?.map((employee) => (
                <button
                    key={employee.id}
                    onClick={() => handleEmployeeClick(employee)}
                    className="w-full px-4 py-2 bg-gray-700/30 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors duration-200 text-left"
                >
                    {employee.name}
                </button>
            ))}
        </div>
    );
}
