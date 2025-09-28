'use client'

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import './style.css'
import annotationPlugin from 'chartjs-plugin-annotation';
import ReportBlock from "@/app/components/ReportBlock";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    annotationPlugin
);


const formatTimeMMSS = (sec) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
};

const useCSVData = (path) => {
    const mockData = path.includes("bpm")
        ? Array.from({ length: 900 }, (_, i) => ({ time_sec: i, value: Math.round(110 + 20 * Math.sin(i/60) + 10 * Math.random()) }))
        : Array.from({ length: 900 }, (_, i) => ({ time_sec: i, value: Math.round(10 + 30 * Math.sin(i/300) + 5 * Math.random()) }));

    if (path.includes("bpm")) {
        for (let i = 120; i < 135; i++) {
            mockData[i] = { time_sec: i, value: Math.max(80, mockData[i].value - (10 * (i-120)) ) };
        }
    }

    return { data: mockData, loading: false };
};

const ChartControl = ({ label, currentWidth, setWidth }) => {
    const minWidth = 100;
    const maxWidth = 400;

    return (
        <div className="bento-box">
            <h2 className="fm-subtitle">{label}</h2>
            <div className="zoom-slider-container">
                <span className="zoom-label">Ширина графика ({currentWidth}%)</span>
                <input
                    type="range"
                    min={minWidth}
                    max={maxWidth}
                    step="10"
                    value={currentWidth}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="zoom-slider"
                />
            </div>
        </div>
    );
}

export default function FetalMonitor() {
    const { data: heartRateData = [], loading: hrLoading } = useCSVData("/data/bpm_test.csv");
    const { data: toneData = [], loading: toneLoading } = useCSVData("/data/iterus_test.csv");

    const hrChartRef = useRef(null); // ССЫЛКА НА ГРАФИК
    const containerRef = useRef(null); // ССЫЛКА НА ОСНОВНОЙ КОНТЕЙНЕР

    const [patient] = useState({
        name: "Иванова Анна Петровна",
        doctor: "Акушер-гинеколог: Смирнова Е.В.",
        parity: "Беременность 2, роды 1",
        diseases: "Хронический гастрит",
        pregnancy: "Протекает без осложнений",
        lmp: "15.02.2023",
    });


    const patientData = {
        // ... (полные данные пациента)
        patient: {
            name: "Иванова Мария Петровна",

            parity_of_births: "G2 P1 (Вторая беременность, одни роды)",
            somatic_diseases: "Хронический пиелонефрит, компенсированный",
            pregnancy_course: "30 недель, без осложнений (плановое обследование)",
            lmp: "15.03.2025", // Последняя менструация
        },

        bloodGas: [
            {
                parameter: "pH",
                value: "7.42",
                unit: "",
                normal_range: "7.35–7.45",
                isNormal: true,
            },
            {
                parameter: "pCO₂",
                value: "40.5",
                unit: "mmHg",
                normal_range: "35–45 mmHg",
                isNormal: true,
            },
            {
                parameter: "pO₂",
                value: "95",
                unit: "mmHg",
                normal_range: "75–100 mmHg",
                isNormal: true,
            },
            {
                parameter: "HCO₃⁻",
                value: "24",
                unit: "mmol/L",
                normal_range: "22–26 mEq/L",
                isNormal: true,
            },
            {
                parameter: "BE",
                value: "1.0",
                unit: "mmol/L",
                normal_range: "−4 to +2",
                isNormal: true,
            },
        ]
    };

    const [zoomRange, setZoomRange] = useState(null);
    const [chartDisplayWidth, setChartDisplayWidth] = useState(100);

    // НОВОЕ СОСТОЯНИЕ ДЛЯ ПОПАПА
    const [popup, setPopup] = useState({
        isVisible: false,
        x: 0,
        y: 0,
        data: null,
    });

    const { sortedHR, sortedUC, xMin, xMax } = useMemo(() => {
        const hr = Array.isArray(heartRateData) ? [...heartRateData] : [];
        const uc = Array.isArray(toneData) ? [...toneData] : [];

        hr.sort((a, b) => (a.time_sec || 0) - (b.time_sec || 0));
        uc.sort((a, b) => (a.time_sec || 0) - (b.time_sec || 0));

        const allTimes = [
            ...hr.map((d) => Number(d.time_sec ?? 0)),
            ...uc.map((d) => Number(d.time_sec ?? 0)),
        ].filter((t) => !Number.isNaN(t));

        const min = allTimes.length ? Math.min(...allTimes) : 0;
        const max = allTimes.length ? Math.max(...allTimes) : Math.max(60, min + 60);

        return { sortedHR: hr, sortedUC: uc, xMin: min, xMax: max };
    }, [heartRateData, toneData]);

    useEffect(() => {
        if (!hrLoading && !toneLoading && xMax > xMin && zoomRange === null) {
            setZoomRange([xMin, xMax]);
        }
    }, [hrLoading, toneLoading, xMin, xMax, zoomRange]);

    const annotationData = useMemo(() => ({
        title: "Поздняя децелерация",
        description: "Критическое снижение ЧСС плода (до 80 ударов в минуту) в ответ на маточные сокращения. Наличие поздней децелерации может указывать на фетоплацентарную недостаточность. Требуется немедленное вмешательство.",
        xMin: 420,
        xMax: 600,
    }), []);


    const highlightAnnotation = {
        type: 'box',
        xMin: annotationData.xMin,
        xMax: annotationData.xMax,
        yMin: 'start',
        yMax: 'end',
        backgroundColor: 'rgba(255, 100, 150, 0.3)',
        borderColor: 'rgb(255, 0, 0, 0.5)',
        borderWidth: 1,
        drawTime: 'beforeDatasetsDraw'
    };


    const handleChartClick = useCallback((event, element, chart) => {
        if (!chart) return;

        const nativeEvent = event.native;

        const canvas = chart.canvas;
        const rect = canvas.getBoundingClientRect();

        const clickX = nativeEvent.clientX - rect.left;
        const xValue = chart.scales.x.getValueForPixel(clickX);

        if (xValue >= annotationData.xMin && xValue <= annotationData.xMax) {
            console.log('Click');
        }
    }, [annotationData, setPopup]);


    if (hrLoading || toneLoading || zoomRange === null) {
        return (
            <div className="loading-screen">
                Загрузка данных...
            </div>
        );
    }
    const [graphMin, graphMax] = zoomRange;

    const reportData = (() => {
        return { message: "Отчет по КТГ не рассчитан в демо-режиме.", severity: "info" }
    }, [sortedHR, sortedUC, graphMin, graphMax]);

    const baseX = {
        type: "linear",
        min: xMin,
        max: xMax,
        ticks: {
            color: "black",
            stepSize: 1,
            autoSkip: true,
            callback: (value) => {
                const v = Math.round(value);
                return formatTimeMMSS(v);
            },
        },
        grid: {
            color: "rgba(0, 0, 0, 0.3)",
            borderDash: [2, 2],
        },
    };

    const createOptions = (yScaleConfig) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        onClick: handleChartClick,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            annotation: {
                annotations: {
                    timeHighlight: highlightAnnotation
                }
            },
        },
        scales: {
            x: baseX,
            y: yScaleConfig,
        },
    });

    const hrOptions = createOptions({
        min: 70,
        max: 230,
        ticks: { color: "black", stepSize: 20 },
        grid: { color: "rgba(0, 0, 0, 0.3)" },
    });

    const ucOptions = createOptions({
        min: 0,
        max: 100,
        ticks: { color: "black", stepSize: 10 },
        grid: { color: "rgba(0, 0, 0, 0.3)" },
    });

    const hrDataset = {
        datasets: [{
            label: "ЧСС плода",
            data: sortedHR.map((d) => ({ x: Number(d.time_sec), y: Number(d.value) })),
            borderColor: "lime",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
            spanGaps: true,
        }],
    };

    const ucDataset = {
        datasets: [{
            label: "Схватки (UC)",
            data: sortedUC.map((d) => ({ x: Number(d.time_sec), y: Number(d.value) })),
            borderColor: "red",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
            spanGaps: true,
        }],
    };

    return (
        // Установим position: relative в CSS для этого контейнера
        <div className="fetal-monitor-container" ref={containerRef}>
            <header className="fm-header bento-box bento-header">
                <h1 className="fm-title">Кардиотокография (КТГ)</h1>
                <div className="fm-info-doctor">{patient.doctor}</div>
                <div className="fm-info-time">{new Date().toLocaleString()}</div>
            </header>

            <main className="fm-main-content">
                <aside className="bento-box fm-patient-info">
                    {/* ... (Данные пациента) ... */}
                    <h2 className="fm-subtitle">Пациент</h2>
                    <p className="fm-patient-name">{patient.name}</p>

                    <div className="fm-details-group">
                        <p className="fm-patient-detail">Паритет родов: <span
                            style={{width: '60%'}}>{patient.parity_of_births || 1}</span></p>
                        <p className="fm-patient-detail">Соматические
                            заболевания: <span
                                style={{width: '60%'}}>{patient.somatic_diseases || 'Здесь может быть очень много текста, нужно придумать как адекватное такое можно отображать'}</span>
                        </p>
                        <p className="fm-patient-detail">Течение беременности: <span
                            style={{width: '60%'}}>{patient.pregnancy_course || 'Наблюдалась в ЖК с 7 недель. Течение физиологическое, без осложнений. Ранний токсикоз лёгкой степени (до 10 недель) купирован диетой. Анализы крови, мочи и скрининги в норме. Прибавка в весе за беременность: +10.5 кг. Плановые УЗИ и допплерометрия (20, 32 нед.) – без патологий.'}</span>
                        </p>
                        <p className="fm-patient-detail">Последняя менструация (ЛМП): <span
                            style={{width: '60%'}}>{patient.lmp}</span></p>
                    </div>

                    <div className="fm-bga-section">
                        <h3 className="fm-section-title">Показатели газа в крови</h3>
                        <table className="fm-bga-table">
                            <thead>
                            <tr>
                                <th>Показатель</th>
                                <th>Значение</th>
                                <th>Ед. изм.</th>
                                <th>Показатель</th>
                            </tr>
                            </thead>
                            <tbody>
                            {patientData.bloodGas.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.parameter}</td>
                                    <td>{item.value}</td>
                                    <td>{item.unit}</td>
                                    <td>{item.isNormal ? 'В норме' : 'Не в норме'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </aside>
                <aside className="bento-box fm-chart-control-area">
                    <ChartControl
                        label="Управление масштабом"
                        currentWidth={chartDisplayWidth}
                        setWidth={setChartDisplayWidth}
                    />
                </aside>
                <ReportBlock reportData={reportData}/>

                <div className="bento-box fm-graph fm-graph-hr">
                    <div className="chart-wrapper" style={{width: `${chartDisplayWidth}%`}}>
                        <Line ref={hrChartRef} options={hrOptions} data={hrDataset}/>
                    </div>
                </div>

                <div className="bento-box fm-graph fm-graph-uc">
                    <div className="chart-wrapper" style={{width: `${chartDisplayWidth}%`}}>
                        <Line options={ucOptions} data={ucDataset}/>
                    </div>
                </div>
            </main>
        </div>
    );
}