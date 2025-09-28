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
import useCSVData from "../hooks/useCSVparse";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

const generateECGOptions = (yMin, yMax, currentTime) => {
    const xMin = Math.max(0, currentTime - 15);
    const xMax = xMin + 15;

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: {
                type: "linear",
                display: true,
                min: xMin,
                max: xMax,
                ticks: {
                    color: "white",
                    stepSize: 3,
                    callback: (value) => {
                        const minutes = Math.floor(value / 60);
                        const seconds = Math.floor(value % 60);
                        return `${minutes.toString().padStart(2, "0")}:${seconds
                            .toString()
                            .padStart(2, "0")}`;
                    },
                },
                grid: {
                    color: "rgba(255,255,255,0.2)",
                },
            },

            y: {
                display: true,
                min: yMin,
                max: yMax,
                ticks: {
                    color: "white",
                    stepSize: 10,
                },
                grid: {
                    color: "rgba(255,255,255,0.1)",
                },
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
    const [patientName, setPatientName] = useState("");
    const startTimeRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        if (hrLoading || toneLoading) return;

        if (startTimeRef.current === null) {
            startTimeRef.current = performance.now();
        }

        const animate = () => {
            if (!isRunning) return;
            const timeElapsed = (performance.now() - startTimeRef.current) / 1000;
            setElapsedTime(timeElapsed);

            const maxTime = Math.max(
                heartRateData[heartRateData.length - 1]?.time_sec || 0,
                toneData[toneData.length - 1]?.time_sec || 0
            );

            if (timeElapsed < maxTime) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [heartRateData, toneData, hrLoading, toneLoading, isRunning]);

    const heartRateIndex = heartRateData.findIndex(
        (d) => d.time_sec >= elapsedTime
    );
    const toneIndex = toneData.findIndex((d) => d.time_sec >= elapsedTime);

    if (hrLoading || toneLoading) {
        return (
            <div
                style={{
                    color: "white",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#000",
                    minHeight: "100vh",
                }}
            >
                Загрузка данных...
            </div>
        );
    }

    if (hrError || toneError) {
        return (
            <div
                style={{
                    color: "red",
                    textAlign: "center",
                    minHeight: "100vh",
                    backgroundColor: "#000",
                }}
            >
                Ошибка при загрузке данных: {hrError || toneError}
            </div>
        );
    }

    // ECG-данные
    const heartRateChartData = {
        datasets: [
            {
                data: heartRateData
                    .slice(0, heartRateIndex !== -1 ? heartRateIndex + 1 : heartRateData.length)
                    .map((d) => ({ x: d.time_sec, y: d.value })),
                borderColor: "lime",
                backgroundColor: "lime",
            },
        ],
    };

    const toneChartData = {
        datasets: [
            {
                data: toneData
                    .slice(0, toneIndex !== -1 ? toneIndex + 1 : toneData.length)
                    .map((d) => ({ x: d.time_sec, y: d.value })),
                borderColor: "red",
                backgroundColor: "red",
            },
        ],
    };

    const heartRateOptions = generateECGOptions(70, 230, elapsedTime);
    const toneOptions = generateECGOptions(0, 100, elapsedTime);

    // Текущее значение для цифр справа
    const currentHR = heartRateData[heartRateIndex]?.value || 0;
    const currentUC = toneData[toneIndex]?.value || 0;

    return (
        <div
            style={{
                backgroundColor: "#000",
                color: "white",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Верхняя панель */}
            <div
                style={{
                    backgroundColor: "#111",
                    padding: "0.5rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #333",
                }}
            >
                <span>MONITORING MODE</span>
                <span>{new Date().toLocaleString()}</span>
            </div>

            {/* Панель ввода пациента */}
            <div
                style={{
                    backgroundColor: "#111",
                    padding: "0.5rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid #333",
                }}
            >
                <label>Имя пациента:</label>
                <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    style={{
                        backgroundColor: "#000",
                        color: "white",
                        border: "1px solid #444",
                        padding: "0.2rem 0.5rem",
                    }}
                />
                <span style={{ marginLeft: "1rem", color: "lime" }}>
          {patientName || "Нет данных"}
        </span>
            </div>

            <div style={{ display: "flex", flex: 1 }}>
                {/* Графики */}
                <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
                    <div
                        style={{
                            flex: 1,
                            padding: "0.5rem",
                            backgroundSize: "20px 20px",
                        }}
                    >
                        <Line options={heartRateOptions} data={heartRateChartData} />
                    </div>
                    <div
                        style={{
                            flex: 1,
                            padding: "0.5rem",
                            backgroundSize: "20px 20px",
                        }}
                    >
                        <Line options={toneOptions} data={toneChartData} />
                    </div>
                </div>

                {/* Цифровые значения справа */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-around",
                        alignItems: "center",
                        backgroundColor: "#111",
                        borderLeft: "1px solid #333",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <div>US1</div>
                        <div style={{ fontSize: "3rem", color: "lime" }}>{currentHR}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div>US2</div>
                        <div style={{ fontSize: "3rem", color: "lime" }}>{currentHR}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div>UC</div>
                        <div style={{ fontSize: "3rem", color: "red" }}>{currentUC}</div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    backgroundColor: "#111",
                    padding: "0.5rem 1rem",
                    borderTop: "1px solid #333",
                    display: "flex",
                    justifyContent: "center",
                    gap: "1rem",
                }}
            >
                <button
                    onClick={() => setIsRunning(true)}
                    style={{ padding: "0.3rem 1rem" }}
                >
                    ▶ Старт
                </button>
                <button
                    onClick={() => setIsRunning(false)}
                    style={{ padding: "0.3rem 1rem" }}
                >
                    ⏸ Стоп
                </button>
                <button
                    onClick={() => {
                        setElapsedTime(0);
                        startTimeRef.current = null;
                    }}
                    style={{ padding: "0.3rem 1rem" }}
                >
                    🔄 Сброс
                </button>
            </div>
        </div>
    );
}
