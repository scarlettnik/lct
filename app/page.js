"use client";

import { useEffect, useState, useRef } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
// Предполагается, что useCSVData и FetalMonitor.css существуют в вашей структуре
import useCSVData from "../hooks/useCSVparse";
import "./FetalMonitor.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, annotationPlugin);

// Функция генерации опций графика (теперь без обработчика клика)
const generateECGOptions = (yMin, yMax, currentTime, annotations) => {
    // Определяем окно просмотра: 90 секунд до текущего времени
    const xMin = Math.max(0, currentTime - 90);
    const xMax = xMin + 90;

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            annotation: { annotations },
        },
        // Удален блок onClick
        scales: {
            x: {
                type: "linear",
                display: true,
                min: xMin,
                max: xMax,
                ticks: {
                    color: "black",
                    stepSize: 3,
                    callback: (value) => {
                        const minutes = Math.floor(value / 60);
                        const seconds = Math.floor(value % 60);
                        return `${minutes.toString().padStart(2, "0")}:${seconds
                            .toString()
                            .padStart(2, "0")}`;
                    },
                },
                grid: { color: "rgba(0, 0, 0, 0.3)" },
            },
            y: {
                display: true,
                min: yMin,
                max: yMax,
                ticks: { color: "black", stepSize: 10 },
                grid: { color: "rgba(0, 0, 0, 0.2)" },
            },
        },
        elements: {
            line: { borderWidth: 2, tension: 0 },
            point: { radius: 0 },
        },
    };
};

export default function FetalMonitor() {
    const { data: heartRateData, loading: hrLoading, error: hrError } =
        useCSVData("/data/bpm_test.csv");
    const { data: toneData, loading: toneLoading, error: toneError } =
        useCSVData("/data/iterus_test.csv");

    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRunning, setIsRunning] = useState(true);
    const startTimeRef = useRef(null);
    const animationFrameRef = useRef(null);

    // --- выделения (оставлено только для структуры, без интерактивного создания)
    // Аннотации могут быть добавлены статически, но интерактивное создание удалено.
    const [annotations, setAnnotations] = useState({});

    // Удалены selectionStart и handleChartClick

    useEffect(() => {
        if (hrLoading || toneLoading) return;

        if (startTimeRef.current === null) {
            startTimeRef.current = performance.now();
        }

        const animate = () => {
            if (!isRunning) return;
            // Убедитесь, что elapsedTime не сбрасывается, если анимация была приостановлена
            const timeElapsed = (performance.now() - startTimeRef.current) / 1000;
            setElapsedTime(timeElapsed);

            const maxTime = Math.max(
                heartRateData[heartRateData.length - 1]?.time_sec || 0,
                toneData[toneData.length - 1]?.time_sec || 0
            );

            if (timeElapsed < maxTime) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                // Остановка анимации по достижении конца данных
                setIsRunning(false);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [heartRateData, toneData, hrLoading, toneLoading, isRunning]);

    const heartRateIndex = heartRateData.findIndex((d) => d.time_sec >= elapsedTime);
    const toneIndex = toneData.findIndex((d) => d.time_sec >= elapsedTime);

    if (hrLoading || toneLoading) {
        return <div className="fm-container">Загрузка данных...</div>;
    }
    if (hrError || toneError) {
        return <div className="fm-container">Ошибка при загрузке данных</div>;
    }

    const heartRateChartData = {
        datasets: [
            {
                data: heartRateData
                    .slice(0, heartRateIndex !== -1 ? heartRateIndex + 1 : heartRateData.length)
                    .map((d) => ({ x: d.time_sec, y: d.value })),
                borderColor: "green",
                backgroundColor: "green",
            },
        ],
    };

    const toneChartData = {
        datasets: [
            {
                data: toneData
                    .slice(0, toneIndex !== -1 ? toneIndex + 1 : toneData.length)
                    .map((d) => ({ x: d.time_sec, y: d.value })),
                borderColor: "blue",
                backgroundColor: "blue",
            },
        ],
    };

    // Вызовы теперь без аргумента handleChartClick
    const heartRateOptions = generateECGOptions(70, 230, elapsedTime, annotations);
    const toneOptions = generateECGOptions(0, 100, elapsedTime, annotations);

    const currentHR = heartRateData[heartRateIndex]?.value || 0;
    const currentUC = toneData[toneIndex]?.value || 0;

    return (
        <div className="fm-container">
            <div className="fm-header">
                <span>MONITORING MODE</span>
                <span>{new Date().toLocaleString()}</span>
            </div>

            <div className="fm-main">
                <div className="fm-graphs">
                    <div className="fm-graph">
                        <Line options={heartRateOptions} data={heartRateChartData} />
                    </div>
                    <div className="fm-graph">
                        <Line options={toneOptions} data={toneChartData} />
                    </div>
                </div>

                <div className="fm-sidebar">
                    <div className="fm-value">
                        <div>US1</div>
                        <div className="fm-value-number lime">{Math.round(currentHR)}</div>
                    </div>
                    <div className="fm-value">
                        <div>US2</div>
                        <div className="fm-value-number lime">{Math.round(currentHR)}</div>
                    </div>
                    <div className="fm-value">
                        <div>UC</div>
                        <div className="fm-value-number red">{Math.round(currentUC)}</div>
                    </div>
                </div>
            </div>

            <div className="fm-footer">
                <button className="fm-button" onClick={() => setIsRunning(true)}>▶ Старт</button>
                <button className="fm-button" onClick={() => setIsRunning(false)}>⏸ Стоп</button>
                <button
                    className="fm-button"
                    onClick={() => {
                        setElapsedTime(0);
                        startTimeRef.current = null;
                        setIsRunning(false); // Остановка после сброса
                    }}
                >
                    🔄 Сброс
                </button>
            </div>
        </div>
    );
}

// helper
const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};
