// components/Calendar/CurrentTimeIndicator.tsx
import {useEffect, useState} from "react";

export const CurrentTimeIndicator = () => {
    const [top, setTop] = useState(0);

    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const minutes = now.getHours() * 60 + now.getMinutes();
            setTop(minutes * 1.333);
        };

        updatePosition();
        const interval = setInterval(updatePosition, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="current-time" style={{top: `${top}px`}}>
            <div className="line"/>
            <div className="circle"/>
        </div>
    );
};
