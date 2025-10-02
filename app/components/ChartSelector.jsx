import React, { useMemo, useEffect, useState } from "react";
import "../ChartSelector.css";

const formatTimeMMSS = (sec) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateString;
};

const groupAndFormatCharts = (chartList) => {
    if (!chartList || chartList.length === 0) return [];

    const groupedMap = chartList.reduce((acc, chart) => {
        const rawDate = chart.metadata?.date;
        if (!rawDate) return acc;

        const formattedDate = formatDate(rawDate);

        if (!acc.has(formattedDate)) {
            acc.set(formattedDate, []);
        }

        acc.get(formattedDate).push({
            id: chart.id,
            metadata: chart.metadata,
        });

        return acc;
    }, new Map());

    return Array.from(groupedMap, ([date, records]) => ({
        date: date,
        records: records
            .sort((a, b) => a.id - b.id)
            .map((record, index) => ({
                id: record.id,
                number: index + 1,
                metadata: record.metadata,
            })),
    }));
};

const ChartSelector = ({ selectChart, data, loading, patient }) => {
    // В selected храним: { examinationId, partIndex, recordId }
    const [selected, setSelected] = useState(null);

    const groupedCharts = useMemo(() => {
        return groupAndFormatCharts(patient.examinations);
    }, [patient.examinations]);

    const stats = useMemo(() => {
        if (loading || !data || data.length === 0) {
            return {
                minTime: "N/A",
                maxTime: "N/A",
                count: 0,
                minValue: "N/A",
                maxValue: "N/A",
            };
        }

        const times = data.map((d) => Number(d.time_sec)).filter((t) => !Number.isNaN(t));
        const values = data.map((d) => Number(d.value)).filter((v) => !Number.isNaN(v));

        return {
            minTime: formatTimeMMSS(Math.min(...times)),
            maxTime: formatTimeMMSS(Math.max(...times)),
            count: data.length,
            minValue: Math.min(...values).toFixed(0),
            maxValue: Math.max(...values).toFixed(0),
        };
    }, [data, loading]);

    useEffect(() => {
        if (!patient?.id || !patient.examinations?.length) return;

        const examinationId = patient.examinations[0]?.id;
        if (!examinationId) return;
    }, [patient?.id, patient?.examinations]);

    const handleChartClick = async (examinationId, partIndex, recordId) => {
        const selectedPart = { examinationId, partIndex, recordId };
        setSelected(selectedPart);

        let jsonPart = null;
        let jsonExam = null;

        try {
            // 1. Fetch Part Data
            const resPart = await fetch(
                `https://hack.nearby-project.ru/v1/patients/${patient.id}/examinations/${examinationId}/part/${partIndex}`
            );
            jsonPart = await resPart.json(); // Assign data
            console.log(`📊 Данные части #${partIndex}:`, jsonPart);

            // 2. Fetch Examination Metadata
            const resExam = await fetch(
                `https://hack.nearby-project.ru/v1/patients/${patient.id}/examinations/${examinationId}`
            );
            jsonExam = await resExam.json(); // Assign data
            console.log("🧾 Полное описание исследования:", jsonExam);

        } catch (err) {
            console.error("Ошибка при загрузке данных:", err);
            // Optionally call selectChart with null data on error
        }

        // 3. 🚀 NEW: Call the prop function, passing the fetched data
        if (typeof selectChart === "function") {
            // Pass the primary selection object, the Part Data, and the Exam Metadata
            selectChart(selectedPart, jsonPart, jsonExam);
        } else {
            console.error("selectChart prop is not a function or is missing!");
        }
    };

    return (
        <div className="bento-box chart-selector-container">
            <h2 className="fm-subtitle chart-selector-title">Выбор КТГ записи</h2>

            {groupedCharts.length === 0 ? (
                <div className="no-data-placeholder">
                    <p>Нет доступных данных об исследованиях для этого пациента.</p>
                </div>
            ) : (
                <div className="chart-selector-scrollable-content" style={{height:'100vh', }}>
                    <ul className="chart-selector-groups-list">
                        {groupedCharts.map((group) => (
                            <li key={group.date} className="chart-selector-group-item">
                                <h3 className="group-date-title">{group.date}</h3>

                                <div className="record-sublist">
                                    {group.records.map((record) => (
                                        <div key={record.id} className="record-list-item">
                                            {record.metadata?.part_count &&
                                                Array.from({ length: record.metadata.part_count }, (_, i) => {
                                                    // Проверка на то, активна ли эта часть:
                                                    const isActive =
                                                        selected?.examinationId === record.id &&
                                                        selected?.partIndex === i + 1;

                                                    return (
                                                        <div
                                                            key={i}
                                                            // Добавляем класс 'active-green' для зелёного выделения
                                                            className={`record-part ${isActive ? "active-green" : ""}`}
                                                            onClick={() => handleChartClick(record.id, i + 1, record.id)}
                                                        >
                                                            <span className="record-text">Запись #</span>
                                                            <span>{i + 1}</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ChartSelector;