'use client';

import { useEffect, useState, useRef, useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import "./style.css";
import UploadModal from "@/app/components/UploadData";
import ParamModal from "@/app/components/ParamModal";
import HRTSettingsModal from "@/app/components/HRTSettingsModal";
import NextPartModal from "@/app/components/GoToNetx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, annotationPlugin);

const ALERT_SOUND_PATH = "/alarm.mp3";

const safeParseJSON = (raw) => {
    try {
        let parsed = JSON.parse(raw);
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        return parsed;
    } catch (e) {
        console.warn("safeParseJSON failed:", e, raw);
        return null;
    }
};

// 🔹 Генерация опций графика
const generateOptions = (yMin, yMax, xMin, xMax, annotations = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        annotation: { annotations },
    },
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
                    const m = Math.floor(value / 60);
                    const s = Math.floor(value % 60);
                    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                },
            },
            grid: { color: "rgba(0,0,0,0.3)" },
        },
        y: {
            display: true,
            min: yMin,
            max: yMax,
            ticks: { color: "black", stepSize: 10 },
            grid: { color: "rgba(0,0,0,0.2)" },
        },
    },
    elements: {
        line: { borderWidth: 2, tension: 0 },
        point: { radius: 0 },
    },
});

// 🔹 Формируем аннотации для интервалов
const makeBoxAnnotations = (intervals) =>
    Object.fromEntries(
        intervals.map((a, i) => [
            `interval-${i}`,
            {
                type: "box",
                xMin: a.start,
                xMax: a.end,
                // ИСПРАВЛЕННОЕ МЕСТО: Добавлено yScaleID и скорректированы yMin/yMax
                yMin: '0%',         // Используем проценты для привязки к границам области построения
                yMax: '100%',       // Используем проценты для привязки к границам области построения
                yScaleID: 'y',      // ОБЯЗАТЕЛЬНО: Указываем ID оси Y ('y' - дефолтный ID)

                backgroundColor: "rgba(255, 99, 132, 0.25)",
                borderColor: "rgba(255, 99, 132, 0.8)",
                borderWidth: 1,
                drawTime: "beforeDatasetsDraw",
                label: {
                    display: !!a.message,
                    content: a.message || "",
                    position: "start",
                    color: "black",
                    backgroundColor: "rgba(255,255,255,0.8)",
                    font: { size: 10 },
                },
            },
        ])
    );

function Clock() {
    const [timeStr, setTimeStr] = useState("");
    useEffect(() => {
        const update = () => setTimeStr(new Date().toLocaleString());
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);
    return <span>{timeStr}</span>;
}

export default function FetalMonitor() {
    const [heartRateData, setHeartRateData] = useState([]);
    const [toneData, setToneData] = useState([]);
    const [latestTime, setLatestTime] = useState(0);
    const [analysisStats, setAnalysisStats] = useState(null);
    const [intervals, setIntervals] = useState([]);

    const socketRef = useRef(null);
    const bufferSeconds = 600;

    const [wsUrl, setWsUrl] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [paramModalOpen, setParamModalOpen] = useState(false);
    const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
    const [isNextModalOpen, setIsNextModalOpen] = useState(false);
    const [hrtThresholds, setHrtThresholds] = useState({ min: 60, max: 160, volume: 80 });
    const audioRef = useRef(null);

    const [viewStart, setViewStart] = useState(0);
    const viewDuration = 90;

    // Звук тревоги
    useEffect(() => {
        if (typeof window !== "undefined" && !audioRef.current) {
            audioRef.current = new Audio(ALERT_SOUND_PATH);
        }
    }, []);

    const currentHR = heartRateData.length
        ? Math.round(heartRateData[heartRateData.length - 1].y)
        : 0;
    const currentUC = toneData.length
        ? Math.round(toneData[toneData.length - 1].y)
        : 0;

    const isHRTAlert =
        currentHR > 0 &&
        (currentHR < hrtThresholds.min || currentHR > hrtThresholds.max);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = hrtThresholds.volume / 100;
        audio.loop = true;

        if (isHRTAlert) {
            audio.play().catch(() => {});
        } else {
            audio.pause();
            audio.currentTime = 0;
        }
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, [isHRTAlert, hrtThresholds.volume]);

    // WebSocket
    useEffect(() => {
        if (!wsUrl) return;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => console.log("WS connected:", wsUrl);
        ws.onmessage = (event) => {
            const msg = safeParseJSON(event.data);
            if (!msg) return;

            // 🔸 Интервалы
            if (msg.interval) {
                console.log("Получено сообщение об интервале:", msg.interval);
                setIntervals((prev) => {
                    const newInt = msg.interval;
                    if (!newInt.start || !newInt.end) return prev;
                    const exists = prev.some(
                        (i) => i.start === newInt.start && i.end === newInt.end
                    );
                    if (exists) return prev;
                    return [...prev, newInt];
                });
                return;
            }

            if (msg.stats) {
                setAnalysisStats(msg.stats);
                return;
            }

            if (msg.status === "waiting-for-next-command") {
                setIsNextModalOpen(true);
                return;
            }

            if (msg.plot && Array.isArray(msg.plot.point)) {
                const { channel, point } = msg.plot;
                const [time, value] = point.map(Number);
                if (!Number.isFinite(time) || !Number.isFinite(value)) return;

                const updateData = (prev) => {
                    const cutoff = time - bufferSeconds;
                    const filtered = prev.filter((p) => p.x >= cutoff);
                    return [...filtered, { x: time, y: value }];
                };

                if (channel === "bpm") setHeartRateData(updateData);
                if (channel === "uterus") setToneData(updateData);
                setLatestTime(time);
            }
        };

        ws.onerror = (e) => console.error("WS error:", e);
        ws.onclose = () => console.log("WS closed");

        return () => ws.close();
    }, [wsUrl]);

    const handleUploadSuccess = (patientId, serverData) => {
        setIsModalOpen(false);
        const examId = serverData?.id;
        if (!examId) return alert("Не удалось получить ID обследования");

        const newWsUrl = `wss://hack.nearby-project.ru/v1/patients/${patientId}/examinations/${examId}/emulation/start`;
        setWsUrl(newWsUrl);
        setHeartRateData([]);
        setToneData([]);
        setIntervals([]);
        setLatestTime(0);
    };

    const handleNextPart = () => {
        socketRef.current?.send(JSON.stringify({ command: "next-part" }));
        setHeartRateData([]);
        setToneData([]);
        setIntervals([]);
        setIsNextModalOpen(false);
    };

    const annotations = makeBoxAnnotations(intervals);

    const xMin = viewStart;
    const xMax = viewStart + viewDuration;

    const heartRateChartData = useMemo(
        () => ({
            datasets: [
                {
                    label: "BPM",
                    data: heartRateData,
                    borderColor: "green",
                    borderWidth: 2,
                    pointRadius: 0,
                },
            ],
        }),
        [heartRateData]
    );

    const toneChartData = useMemo(
        () => ({
            datasets: [
                {
                    label: "Tone",
                    data: toneData,
                    borderColor: "blue",
                    borderWidth: 2,
                    pointRadius: 0,
                },
            ],
        }),
        [toneData]
    );

    const heartRateOptions = useMemo(
        () => generateOptions(70, 230, xMin, xMax, annotations),
        [xMin, xMax, intervals]
    );
    const toneOptions = useMemo(
        () => generateOptions(0, 100, xMin, xMax, annotations),
        [xMin, xMax, intervals]
    );

    return (
        <>
            <div className="fm-container">
                <div className="fm-header">
                    <span>MONITORING MODE</span>
                    <span><Clock /></span>
                </div>

                <div className="fm-main">
                    <div className="fm-graphs">
                        <div className="fm-graph" style={{ height: 220 }}>
                            <Line data={heartRateChartData} options={heartRateOptions} />
                        </div>
                        <div className="fm-graph" style={{ height: 220 }}>
                            <Line data={toneChartData} options={toneOptions} />
                        </div>
                    </div>

                    <div className="fm-sidebar">
                        <div className="fm-value">
                            <div>US1</div>
                            <div className="fm-value-number lime">{currentHR}</div>
                        </div>
                        <div className="fm-value">
                            <div>UC</div>
                            <div className="fm-value-number red">{currentUC}</div>
                        </div>
                    </div>
                </div>

                {/* Прокрутка */}
                <div className="fm-scroll-controls" style={{ textAlign: "center", margin: "10px" }}>
                    <button onClick={() => setViewStart(Math.max(0, viewStart - 30))}>◀ Назад 30 c</button>
                    <button onClick={() => setViewStart(viewStart + 30)}>Вперёд 30 c ▶</button>
                </div>

                <footer className="fm-footer">
                    <button onClick={() => setIsDangerModalOpen(true)}>Параметры тревоги</button>
                    <button onClick={() => setIsModalOpen(true)}>Загрузить данные</button>
                    <button onClick={() => setParamModalOpen(true)} disabled={!analysisStats}>
                        Анализ
                    </button>
                </footer>
            </div>

            <UploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />

            <ParamModal
                isOpen={paramModalOpen}
                onClose={() => setParamModalOpen(false)}
                analysisStats={analysisStats}
            />

            <HRTSettingsModal
                isOpen={isDangerModalOpen}
                initialMinHRT={hrtThresholds.min}
                initialMaxHRT={hrtThresholds.max}
                initialVolume={hrtThresholds.volume}
                currentHRT={currentHR}
                onClose={() => setIsDangerModalOpen(false)}
                onSave={(min, max, vol) => setHrtThresholds({ min, max, volume: vol })}
            />

            <NextPartModal
                isOpen={isNextModalOpen}
                onNext={handleNextPart}
            />
        </>
    );
}