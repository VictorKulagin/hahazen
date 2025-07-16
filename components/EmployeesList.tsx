// components/EmployeesList.tsx
"use client";
import { useEmployees } from "@/hooks/useEmployees";
import Link from "next/link";
import { useParams } from "next/navigation";

interface EmployeesListProps {
    branchId?: number;
}

export default function EmployeesList({ branchId }: EmployeesListProps) {
    const params = useParams();
// @ts-ignore
    const finalBranchId = branchId ?? (params.branchId ? Number(params.branchId) : undefined);
    const { data: employees, isLoading, error, isConnected } = useEmployees(finalBranchId);

    if (isLoading) return <p>Загрузка...</p>;
    if (error) return <p className="text-red-500">Ошибка загрузки: {error.message}</p>;

    return (
        <div className="ml-10 mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {isConnected ? 'Онлайн-обновления' : 'Обновления приостановлены'}
            </div>
            {console.log(employees + " employees " + finalBranchId)}

            {// @ts-ignore
                employees.map((employee) => (
                <Link
                    key={employee.id}
                    href={`/timetable/${employee.branch_id}#master=${employee.id}`}
                    className="w-full px-4 py-2 bg-gray-700/30 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors duration-200"
                >
                    {employee.name}
                </Link>
            ))}
        </div>
    );
}
