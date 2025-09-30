import React, { useMemo } from "react";
import '../ChartSelector.css'; // Убедитесь, что путь к CSS правильный

// Выносим вспомогательную функцию
const formatTimeMMSS = (sec) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
};

const ChartSelector = ({ currentChartId, selectChart, data, loading }) => {

    const groupedCharts = useMemo(() => {
        const dates = [
            "05.09.2025",
            "12.09.2025",
            "19.09.2025",
            "26.09.2025"
        ];

        let idCounter = 1;

        return dates.map(date => {
            const recordCount = Math.floor(Math.random() * 4) + 1;

            const records = Array.from({ length: recordCount }, (_, i) => ({
                id: idCounter++,
                number: i + 1,
            }));

            return {
                date: date,
                records: records
            };
        });
    }, []);

    const stats = useMemo(() => {
        if (loading || !data || data.length === 0) {
            return {
                minTime: 'N/A',
                maxTime: 'N/A',
                count: 0,
                minValue: 'N/A',
                maxValue: 'N/A',
            };
        }

        const times = data.map(d => Number(d.time_sec)).filter(t => !Number.isNaN(t));
        const values = data.map(d => Number(d.value)).filter(v => !Number.isNaN(v));

        return {
            minTime: formatTimeMMSS(Math.min(...times)),
            maxTime: formatTimeMMSS(Math.max(...times)),
            count: data.length,
            minValue: Math.min(...values).toFixed(0),
            maxValue: Math.max(...values).toFixed(0),
        };
    }, [data, loading]);


    return (
        <div className="bento-box chart-selector-container">
            <h2 className="fm-subtitle chart-selector-title">Выбор КТГ записи</h2>
            <ul className="chart-selector-groups-list">
                {groupedCharts.map((group) => (
                    <li key={group.date} className="chart-selector-group-item">
                        <h3 className="group-date-title">{group.date}</h3>

                        <ul className="record-sublist">
                            {group.records.map((record) => (
                                <li
                                    key={record.id}
                                    // onClick={() => selectChart(record.id)}
                                    className={`record-list-item ${record.id === currentChartId ? 'active' : ''}`}
                                >
                                    <span className="record-text">Запись #{record.number}</span>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChartSelector;