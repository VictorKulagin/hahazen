// components/Accordion.tsx
import { useState } from 'react';

interface AccordionItem {
    id: number;
    name: string;
    position: string;
}

interface AccordionProps {
    title: string;
    content: AccordionItem[];
}

const Accordion: React.FC<AccordionProps> = ({ title, content }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const togglePanel = (index: number) => {
        setOpenIndex(openIndex === index ? null : index); // Закрытие панели при повторном клике
    };

    return (
        <div className="accordion">
            <div className="accordion-item">
                <div className="accordion-header" onClick={() => togglePanel(0)}>
                    <h3>{title}</h3>
                    <span className={`accordion-icon ${openIndex === 0 ? 'open' : ''}`}>&#9660;</span>
                </div>
                {openIndex === 0 && (
                    <div className="accordion-content">
                        {content.map((item) => (
                            <div key={item.id} className="accordion-content-item">
                                <p><strong>Имя:</strong> {item.name}</p>
                                <p><strong>Должность:</strong> {item.position}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Accordion;
