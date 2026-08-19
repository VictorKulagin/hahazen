"use client";

import { useParams } from "next/navigation";
import BookingWizard from "@/components/booking/BookingWizard";
import { useBranches } from "@/hooks/useBranches";

type ParamsType = {
    id?: string;
};

export default function ServiceSelectionPage() {
    const params = useParams<ParamsType>();
    const branchId = params?.id ? Number(params.id) : null;
    const { data: branches = [] } = useBranches();
    const branch = branches.find((item) => item.id === branchId);

    return (
        <BookingWizard
            branchId={branchId}
            publicBookingAxis={branch?.public_booking_axis ?? "employee"}
            publicResourceAssignment={
                branch?.public_resource_assignment ?? "client_picks"
            }
        />
    );
}
