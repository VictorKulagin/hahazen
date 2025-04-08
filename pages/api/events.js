let events = []; // Временное хранилище событий

export default function handler(req, res) {
    if (req.method === "GET") {
        // Возвращаем список событий
        res.status(200).json(events);
    } else if (req.method === "POST") {
        // Добавляем новое событие
        const newEvent = req.body;
        events.push(newEvent);
        res.status(201).json(newEvent);
    } else {
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Метод ${req.method} не разрешен`);
    }
}

/*let events = []; // Временное хранилище событий (заменить на базу данных позже)

export default function handler(req, res) {
    const { method } = req;

    switch (method) {
        case "GET":
            res.status(200).json(events);
            break;

        case "POST":
            const newEvent = { id: Date.now(), ...req.body }; // Генерация уникального ID
            events.push(newEvent);
            res.status(201).json(newEvent);
            break;

        case "PUT":
            const updatedEvent = req.body;
            events = events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
            res.status(200).json(updatedEvent);
            break;

        case "DELETE":
            const { id } = req.body;
            events = events.filter((e) => e.id !== id);
            res.status(200).json({ success: true });
            break;

        default:
            res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}*/

