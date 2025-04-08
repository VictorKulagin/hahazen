import { NextApiRequest, NextApiResponse } from "next";
import { watchEmployees } from "@/lib/sseManager"; // Ваша реализация наблюдения за изменениями

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const branchId = Number(req.query.branch_id);
    const sendUpdate = (data: any) => {
        res.write(`event: update\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const cleanup = watchEmployees(branchId, sendUpdate);

    req.on("close", () => {
        cleanup();
        res.end();
    });
}
