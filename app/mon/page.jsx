"use client";

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
// Предполагаемые пути для импорта
import UploadModal from "@/app/components/UploadData";
import ParamModal from "@/app/components/ParamModal";
import HRTSettingsModal from "@/app/components/HRTSettingsModal";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, annotationPlugin);

const ALERT_SOUND_PATH = "/alarm.mp3";

const safeParseJSON = (raw) => {
    try {
        let parsed = JSON.parse(raw);
        if (typeof parsed === "string") {
            parsed = JSON.parse(parsed);
        }
        return parsed;
    } catch (e) {
        console.warn("safeParseJSON failed:", e, raw);
        return null;
    }
};

// ... (generateECGOptions и Clock остаются без изменений)
const generateECGOptions = (yMin, yMax, currentTime) => {
    const xMin = Math.max(0, (currentTime || 0) - 90);
    const xMax = xMin + 90;

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
                    color: "black",
                    stepSize: 3,
                    callback: (value) => {
                        const minutes = Math.floor(value / 60);
                        const seconds = Math.floor(value % 60);
                        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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
// ... (конец вспомогательных функций)

export default function FetalMonitor() {
    const [heartRateData, setHeartRateData] = useState([]);
    const [toneData, setToneData] = useState([]);
    const [latestTime, setLatestTime] = useState(0);

    const socketRef = useRef(null);
    const bufferSeconds = 10 * 60;
    const [wsUrl, setWsUrl] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(true);
    const [paramModalOpen, setParamModalOpen] = useState(false);
    const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);

    const [hrtThresholds, setHrtThresholds] = useState({ min: 60, max: 160, volume: 80 });

    const audioRef = useRef(null);

    // ----------------------------------------------------
    // 📌 useEffect 1: ИНИЦИАЛИЗАЦИЯ Audio (только на клиенте)
    // ----------------------------------------------------
    useEffect(() => {
        if (typeof window !== 'undefined' && !audioRef.current) {
            try {
                audioRef.current = new Audio(ALERT_SOUND_PATH);
            } catch (e) {
                console.error("Failed to create Audio object in client environment:", e);
            }
        }
    }, []);


    const handleSettingsSave = (newMin, newMax, newVolume) => {
        setHrtThresholds({ min: newMin, max: newMax, volume: newVolume });
        setIsDangerModalOpen(false);
    };

    const currentHR = heartRateData.length ? Math.round(heartRateData[heartRateData.length - 1].y) : 0;
    const currentUC = toneData.length ? Math.round(toneData[toneData.length - 1].y) : 0;

    // ПРОВЕРКА ТРЕВОГИ
    const isHRTAlert = currentHR > 0 &&
        (currentHR < hrtThresholds.min || currentHR > hrtThresholds.max);

    // ----------------------------------------------------
    // 📌 useEffect 2: УПРАВЛЕНИЕ АУДИО-СИГНАЛОМ (СИРЕНА)
    // ----------------------------------------------------
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return; // Выходим, если Audio не инициализировано

        const { volume } = hrtThresholds;

        audio.volume = volume / 100;
        audio.loop = true;

        if (isHRTAlert) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay prevented for alarm. User interaction required.", error);
                });
            }
        } else {
            audio.pause();
            audio.currentTime = 0;
        }

        return () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        };
    }, [isHRTAlert, hrtThresholds.volume]);


    // ----------------------------------------------------
    // useEffect 3: УПРАВЛЕНИЕ WebSocket (логика получения данных)
    // ----------------------------------------------------
    useEffect(() => {
        if (!wsUrl) {
            if (socketRef.current) {
                try { socketRef.current.close(); } catch (e) { /* ignore */ }
                socketRef.current = null;
            }
            return;
        }

        let ws;
        try {
            ws = new WebSocket(wsUrl);
        } catch (e) {
            console.error("WebSocket creation failed:", e);
            return;
        }
        socketRef.current = ws;

        ws.onopen = () => { console.log("WS connected:", wsUrl); };

        ws.onmessage = (event) => {
            const msg = safeParseJSON(event.data);
            if (!msg) return;

            if (msg.plot && Array.isArray(msg.plot.point)) {
                const channel = msg.plot.channel;
                const point = msg.plot.point;
                const time = Number(point[0]);
                const value = Number(point[1]);

                if (!Number.isFinite(time) || !Number.isFinite(value)) return;

                const updateData = (prev) => {
                    const cutoff = time - bufferSeconds;
                    const filtered = prev.filter((p) => p.x >= cutoff);
                    if (filtered.length && filtered[filtered.length - 1].x === time) {
                        filtered[filtered.length - 1] = { x: time, y: value };
                        return filtered;
                    }
                    return [...filtered, { x: time, y: value }];
                };

                if (channel === "bpm") {
                    setHeartRateData(updateData);
                } else if (channel === "uterus") {
                    setToneData(updateData);
                }

                setLatestTime((t) => Math.max(t, time));
            }
        };

        ws.onerror = (e) => { console.error("WS error:", e); };
        ws.onclose = (ev) => { console.log("WS closed", ev.code, ev.reason); };


        return () => {
            try { ws.close(); } catch (e) { /* ignore */ }
            socketRef.current = null;
        };
    }, [wsUrl]);

    // ----------------------------------------------------
    // Обработчик загрузки данных (остается прежним)
    // ----------------------------------------------------
    const handleUploadSuccess = (patientId, serverData) => {
        setIsModalOpen(false);
        const examinationId = serverData?.id;

        if (examinationId) {
            const newWsUrl = `wss://hack.nearby-project.ru/v1/patients/${patientId}/examinations/${examinationId}/emulation/start`;
            setHeartRateData([]);
            setToneData([]);
            setLatestTime(0);
            setWsUrl(newWsUrl);
        } else {
            alert(`Загрузка завершена, но не удалось получить ID экзамена для запуска мониторинга.`);
        }
    };

    // ... (useMemo для графиков остается прежним)
    const heartRateChartData = useMemo(() => ({ datasets: [{ label: "BPM", data: heartRateData, borderColor: "green", backgroundColor: "rgba(0,0,0,0)", pointRadius: 0, },], }), [heartRateData]);
    const toneChartData = useMemo(() => ({ datasets: [{ label: "Tone", data: toneData, borderColor: "blue", backgroundColor: "rgba(0,0,0,0)", pointRadius: 0, },], }), [toneData]);
    const heartRateOptions = useMemo(() => generateECGOptions(70, 230, latestTime), [latestTime]);
    const toneOptions = useMemo(() => generateECGOptions(0, 100, latestTime), [latestTime]);


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
                            <Line options={heartRateOptions} data={heartRateChartData} />
                        </div>
                        <div className="fm-graph" style={{ height: 220 }}>
                            <Line options={toneOptions} data={toneChartData} />
                        </div>
                    </div>

                    <div className="fm-sidebar">
                        <div className="fm-value">
                            <div>US1</div>
                            <div className="fm-value-number lime">
                                {currentHR}
                            </div>
                        </div>
                        <div className="fm-value">
                            <div>US2</div>
                            <div  className="fm-value-number lime">
                                {currentHR}
                            </div>
                        </div>
                        <div className="fm-value">
                            <div>UC</div>
                            <div className="fm-value-number red">{currentUC}</div>
                        </div>
                    </div>
                </div>

                <footer className="fm-footer">
                    <button className="fm-button" onClick={() => setIsDangerModalOpen(true)}>Параметры тревоги</button>
                    <button className="fm-button" onClick={() => setIsModalOpen(true)}>Загрузить данные</button>
                    <button className="fm-button" onClick={() => setParamModalOpen(true)}>Анализ</button>
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
            />

            <HRTSettingsModal
                isOpen={isDangerModalOpen}
                initialMinHRT={hrtThresholds.min}
                initialMaxHRT={hrtThresholds.max}
                initialVolume={hrtThresholds.volume}
                currentHRT={currentHR}
                onClose={() => setIsDangerModalOpen(false)}
                onSave={handleSettingsSave}
            />
        </>
    );
}