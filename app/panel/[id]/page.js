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
import ChartSelector from "@/app/components/ChartSelector";
import PatientInfo from "@/app/components/PatientInfo";
// import useCSVData from "@/hooks/useCSVparse"; // Убран
import {useParams} from "next/navigation";

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

// ... (ChartControl component remains unchanged) ...
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
    )
}

// Функция для трансформации данных
const transformChartData = (jsonArr) => {
    if (!Array.isArray(jsonArr)) return [];

    return jsonArr
        .filter(item => item && item.length === 2 && typeof item[0] === 'number' && typeof item[1] === 'number')
        .map(item => ({
            time_sec: item[0], // Время (X)
            value: item[1]      // Значение (Y)
        }));
};


export default function FetalMonitor() {
    // hrLoading и toneLoading теперь могут быть просто false, так как данных из CSV нет
    const hrLoading = false;
    const toneLoading = false;

    const hrChartRef = useRef(null);
    const containerRef = useRef(null);

    const params = useParams();
    const patientId = params.id;

    const [isPatientDataLoading, setIsPatientDataLoading] = useState(true);
    const [patientFetchError, setPatientFetchError] = useState(null);

    const [patientData, setPatientData] = useState({});

    const [currentChartId, setCurrentChartId] = useState(null);
    const [selectedExaminationData, setSelectedExaminationData] = useState({
        part: { data: { bpm: [], uterus: [] } },
        exam: null
    });

    const heartRateData = useMemo(() => {
        const bpmData = selectedExaminationData.part?.data?.bpm;
        return transformChartData(bpmData);
    }, [selectedExaminationData.part]);

    const toneData = useMemo(() => {
        const uterusData = selectedExaminationData.part?.data?.uterus;
        return transformChartData(uterusData);
    }, [selectedExaminationData.part]);


    const selectChart = useCallback((chartId, partData, examData) => {
        setCurrentChartId(chartId);
        const safePartData = partData?.data ? partData : { data: { bpm: [], uterus: [] } };
        setSelectedExaminationData({ part: safePartData, exam: examData });
        console.log(`Chart selected/updated to ID: ${chartId}`);
    }, []);


    useEffect(() => {
        let isMounted = true;

        const fetchPatientData = async () => {
            setIsPatientDataLoading(true);
            setPatientFetchError(null);

            try {
                const response = await fetch(`https://hack.nearby-project.ru/v1/patients/${patientId}`);

                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }

                const data = await response.json();
                setPatientData(data);

                if (data.examinations && data.examinations.length > 0) {
                    const firstExam = data.examinations[0];
                    setCurrentChartId(firstExam.id);
                    setSelectedExaminationData({
                        part: { data: { bpm: [], uterus: [] } },
                        exam: firstExam
                    });
                }

            } catch (error) {
                console.error("Ошибка при получении данных пациента:", error);
                if (isMounted) {
                    setPatientFetchError(`Не удалось загрузить данные пациента: ${error.message}`);
                }
            } finally {
                if (isMounted) {
                    setIsPatientDataLoading(false);
                }
            }
        };

        fetchPatientData();

        return () => {
            isMounted = false;
        };
    }, [patientId]);


    const hrAnnotations = [
        {
            id: "lateDecel",
            title: "Поздняя децелерация",
            description: "Критическое снижение ЧСС плода до 80 уд/мин на фоне схватки.",
            xMin: 120,
            xMax: 140,
        },
        {
            id: "earlyDecel",
            title: "Ранняя децелерация",
            description: "Снижение ЧСС совпадает по времени с началом схватки.",
            xMin: 200,
            xMax: 260,
        }
    ];

    const ucAnnotations = [
        {
            id: "strongUC",
            title: "Сильная схватка",
            description: "Высокая амплитуда маточного тонуса.",
            xMin: 410,
            xMax: 590,
        }
    ];

    const allAnnotations = useMemo(() => {
        return [...hrAnnotations, ...ucAnnotations];
    }, []);

    const makeBoxAnnotations = (annots) => {
        return Object.fromEntries(
            annots.map(a => [
                a.id,
                {
                    type: "box",
                    xMin: a.xMin,
                    xMax: a.xMax,
                    yMin: "start",
                    yMax: "end",
                    backgroundColor: "rgba(255, 100, 150, 0.3)",
                    borderWidth: 1,
                    drawTime: "beforeDatasetsDraw",
                }
            ])
        );
    };

    const [zoomRange, setZoomRange] = useState(null);
    const [chartDisplayWidth, setChartDisplayWidth] = useState(100);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);


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
        // Условие для сброса zoomRange при загрузке новых данных
        if (xMax > xMin && (zoomRange === null || zoomRange[1] !== xMax)) {
            setZoomRange([xMin, xMax]);
        }
    }, [xMin, xMax, zoomRange]);


    const handleChartClick = useCallback((event, elements, chart) => {
        if (!chart) {
            setSelectedAnnotation(null);
            return;
        }

        const nativeEvent = event.native;
        const rect = chart.canvas.getBoundingClientRect();
        const clickX = nativeEvent.clientX - rect.left;
        const xValue = chart.scales.x.getValueForPixel(clickX);

        const hit = allAnnotations.find(
            (a) => xValue >= a.xMin && xValue <= a.xMax
        );

        setSelectedAnnotation(hit);
    }, [allAnnotations]);


    // --- НОВАЯ ЛОГИКА: Обработка загрузки и отсутствия выбора ---
    const isExaminationSelected = currentChartId !== null;
    const hasHRData = sortedHR.length > 0;
    const hasUCData = sortedUC.length > 0;

    // 1. Полный экран загрузки/ошибки (для данных пациента)
    if (patientFetchError) {
        return (
            <div className="loading-screen">
                <p style={{ color: 'red' }}>{patientFetchError}</p>
            </div>
        );
    }

    if (isPatientDataLoading) {
        return (
            <div className="loading-screen">
                <p>Загрузка данных пациента...</p>
            </div>
        );
    }

    // 2. Определение текста-заглушки для области графиков
    let chartPlaceholderText = null;

    if (!isExaminationSelected) {
        chartPlaceholderText = "Выберите исследование";
    } else if (zoomRange === null) {
        // zoomRange === null означает, что данные загружены, но графики еще не инициализированы/масштабированы
        chartPlaceholderText = "Загрузка данных графика...";
    }

    const chartPlaceholder = chartPlaceholderText ? (
        <p className="chart-status-text">{chartPlaceholderText}</p>
    ) : null;

    // -----------------------------------------------------------


    const [graphMin, graphMax] = zoomRange || [xMin, xMax]; // Fallback to calculated min/max

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

    const createOptions = (yScaleConfig, annotations) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        onClick: handleChartClick,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            annotation: {
                annotations: makeBoxAnnotations(annotations),
            },
        },
        scales: {
            x: baseX,
            y: yScaleConfig,
        },
    });


    const hrOptions = createOptions(
        {
            min: 70,
            max: 230,
            ticks: { color: "black", stepSize: 20 },
            grid: { color: "rgba(0, 0, 0, 0.3)" },
        },
        hrAnnotations
    );

    const ucOptions = createOptions(
        {
            min: 0,
            max: 100,
            ticks: { color: "black", stepSize: 10 },
            grid: { color: "rgba(0, 0, 0, 0.3)" },
        },
        ucAnnotations
    );


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
            borderColor: "blue",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
            spanGaps: true,
        }],
    };

    return (
        <div className="fetal-monitor-container" ref={containerRef}>
            <header className="fm-header bento-box bento-header">
                <h1 className="fm-title">Кардиотокография (КТГ)</h1>
                <div className="fm-info-time">{new Date().toLocaleString()}</div>
            </header>

            <main className="fm-main-content">
                <PatientInfo patient={patientData} />

                <ReportBlock reportData={reportData}/>
                <aside className="bento-box fm-chart-control-area">
                    <ChartControl
                        label="Управление масштабом"
                        currentWidth={chartDisplayWidth}
                        setWidth={setChartDisplayWidth}
                    />
                </aside>


                <div className="bento-box fm-graph fm-graph-hr">
                    <div className="chart-wrapper" style={{width: `${chartDisplayWidth}%`}}>
                        {chartPlaceholder ? chartPlaceholder : (
                            hasHRData ?
                                <Line ref={hrChartRef} options={hrOptions} data={hrDataset}/> :
                                <p className="chart-status-text">Для просмотра графика выберите исследование, обработка
                                    может занять несколько секунд</p>
                        )}
                    </div>
                </div>

                <div className="bento-box fm-graph fm-graph-uc">
                <div className="chart-wrapper" style={{width: `${chartDisplayWidth}%`}}>
                        {chartPlaceholder ? chartPlaceholder : (
                            hasUCData ?
                                <>
                                    <p>Частота маточных сокращений</p>
                                    <Line options={ucOptions} data={ucDataset}/></> :
                                <p className="chart-status-text">Для просмотра графика выберите исследование, обработка может занять несколько секунд</p>
                        )}
                    </div>
                </div>


                <div className="fm-store">
                    <ChartSelector
                        patient={patientData}
                        currentChartId={currentChartId}
                        selectChart={selectChart}
                        data={heartRateData}
                        loading={hrLoading || toneLoading}
                    />
                </div>
                <div className='fm-predict bento-box'>
                    <h2 className="fm-subtitle">Информация по выделенной области</h2>

                    {selectedAnnotation ? (
                        <>
                            <h3 className="annotation-title">{selectedAnnotation.title}</h3>
                            <p className="annotation-description">{selectedAnnotation.description}</p>
                        </>
                    ) : (
                        <p className="annotation-placeholder">
                            Чтобы увидеть детальное описание, кликните на выделенную розовым область на
                            графиках.
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}