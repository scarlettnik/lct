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
import ParamModal from "@/app/components/ParamModal";
import HRTSettingsModal from "@/app/components/HRTSettingsModal";
import NextPartModal from "@/app/components/GoToNetx";
import MonInfo from "@/app/components/MonInfo";
import {useParams} from "next/navigation";

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

const makeBoxAnnotations = (intervals) =>
    Object.fromEntries(
        intervals.map((a, i) => [
            `interval-${i}`,
            {
                type: "box",
                xMin: a.start,
                xMax: a.end,
                yMin: '0%',
                yMax: '100%',
                yScaleID: 'y',

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
    const [prediction, setPrediction] = useState([]);
    const [patientId, setPatientId] = useState(null);
    const [patInfo, setPatInfo] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const param = useParams(); // Get parameters from URL
    const [isNext, setIsNext] = useState(false)

    const socketRef = useRef(null);
    const bufferSeconds = 600;

    const [paramModalOpen, setParamModalOpen] = useState(false);
    const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
    const [isNextModalOpen, setIsNextModalOpen] = useState(false);
    const [hrtThresholds, setHrtThresholds] = useState({ min: 60, max: 160, volume: 80 });
    const audioRef = useRef(null);

    const [viewStart, setViewStart] = useState(0);
    const viewDuration = 90;

    const isInitialLoadRef = useRef(true);

    const handleNextPart = () => {
        setHeartRateData([]);
        setToneData([]);
        setIntervals([]);
        setAnalysisStats(null);
    };
    useEffect(() => {
        if (isNextModalOpen) {
            handleNextPart();
        }
    }, [isNextModalOpen]);



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
        if (!audio || !isSoundEnabled) return;
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

    useEffect(() => {
        setViewStart(Math.max(0, latestTime - viewDuration));
    }, [latestTime]);

    useEffect(() => {
        const patientId = param.patientId;
        const examId = param.id;
        if (!patientId || !examId) {
            console.error("Missing patientId or examId in parameters, cannot connect to WebSocket.");
            return;
        }

        setPatientId(patientId);

        const wsUrl = `wss://hack.nearby-project.ru/v1/patients/${patientId}/examinations/${examId}/emulation/attach`;

        console.log("Attempting WebSocket connection to:", wsUrl);

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => console.log("WS connected:", wsUrl);
        ws.onmessage = (event) => {
            const msg = safeParseJSON(event.data);
            if (!msg) return;
            if (isNext) {
                setIsNext(false);
            };
            if (msg.state && isInitialLoadRef.current) {
                console.log("Processing initial state message (bulk data).");
                const { sent_part_data, sent_intervals, sent_predictions, last_stats } = msg.state;

                let lastTime = latestTime;

                if (sent_part_data) {
                    const newHeartRateData = sent_part_data.bpm.map(([x, y]) => ({ x: Number(x), y: Number(y) }));
                    const newToneData = sent_part_data.uterus.map(([x, y]) => ({ x: Number(x), y: Number(y) }));

                    setHeartRateData(newHeartRateData);
                    setToneData(newToneData);

                    // Determine the max time for initial latestTime and viewStart calculation
                    if (newHeartRateData.length > 0) {
                        lastTime = Math.max(lastTime, newHeartRateData[newHeartRateData.length - 1].x);
                    }
                    if (newToneData.length > 0) {
                        lastTime = Math.max(lastTime, newToneData[newToneData.length - 1].x);
                    }
                }

                if (sent_intervals) {
                    setIntervals(sent_intervals);
                }

                if (sent_predictions) {
                    setPrediction(sent_predictions);
                }

                if (last_stats) {
                    setAnalysisStats(last_stats);
                }

                if (lastTime > latestTime) {
                    setLatestTime(lastTime);
                }

                isInitialLoadRef.current = false;
                return;
            }
            // -------------------------------------------------------------


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

            if (msg.prediction) {
                console.log(msg.prediction)
                setPrediction(msg.prediction);
            }

            if (msg.stats) {
                setAnalysisStats(msg.stats);
                return;
            }

            if (msg.status === "waiting-for-next-command") {
                setIsNextModalOpen(true);
                setIsNext(true)
                return;
            }

            if (msg.plot && Array.isArray(msg.plot.point)) {
                const { channel, point } = msg.plot;
                const [time, value] = point.map(Number);
                if (!Number.isFinite(time) || !Number.isFinite(value)) return;

                const updateData = (prev) => {
                    // --- 3. MODIFIED CUTOFF LOGIC ---
                    // Only apply bufferSeconds for points *after* initial load.
                    const cutoff = isInitialLoadRef.current ? -Infinity : time - bufferSeconds;
                    // --------------------------------

                    const filtered = prev.filter((p) => p.x >= cutoff);
                    return [...filtered, { x: time, y: value }];
                };

                if (channel === "bpm") setHeartRateData(updateData);
                if (channel === "uterus") setToneData(updateData);
                setLatestTime(time);
            }
        };

        ws.onclose = () => console.log("WS closed");

        return () => ws.close();
    }, [param.patientId, param.id]);

    const annotations = makeBoxAnnotations(intervals);

    const xMin = viewStart;
    const xMax = viewStart + viewDuration;

    const lastInterval = useMemo(() => {
        if (intervals.length === 0) return null;
        return intervals[intervals.length - 1];
    }, [intervals]);

    useEffect(() => {
        if (lastInterval) {
            console.log("Последний интервал (для отладки):", lastInterval);
        }
    }, [lastInterval]);

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
            <div style={{color: 'black'}} className="fm-container">
                <div className="fm-header">
                    <span>MONITORING MODE</span>
                    <span><Clock/></span>
                </div>

                <div className="fm-main">
                    <div className="fm-graphs">
                        <div className="fm-graph" style={{height: 220}}>
                            <Line data={heartRateChartData} options={heartRateOptions}/>
                        </div>
                        <div className="fm-graph" style={{height: 220}}>
                            <Line data={toneChartData} options={toneOptions}/>
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

                        <div style={{width: '90%', color: 'black'}} className="fm-analysis-info">
                            <p style={{fontWeight: 'bolder'}}>Информаиция о последнем подозрительном участке</p>
                            {intervals.length > 0 ? (
                                <>
                                    <div className="fm-analysis-item">
                                        <div className="fm-analysis-label">Продолжитетельность:</div>
                                        <div
                                            className="fm-analysis-value">{Math.round(Math.abs(lastInterval?.end - lastInterval?.start))} сек
                                        </div>
                                    </div>
                                    <div className="fm-analysis-item">
                                        <div className="fm-analysis-label">Информация</div>
                                        <div className="fm-analysis-value">{lastInterval?.message}</div>
                                    </div>
                                </>
                            ) : (
                                <p>Подозрительных моментов не обнаружено</p>
                            )}
                        </div>


                        <div style={{width: '90%', color: 'black'}} className="fm-analysis-info">
                            <p style={{fontWeight: 'bolder'}}>Предсказание</p>
                            {prediction.messages ? (
                                <>
                                    {prediction?.messages?.map((msg, index) => (
                                        <p key={index}>{msg}</p>
                                    ))}
                                </>
                            ) : (
                                <p>Пока нет информации. Появляется после первой минуты исследования</p>
                            )}
                        </div>
                    </div>
                </div>


                <footer className="fm-footer">
                    <button style={{padding: '10px', borderRadius: '8px'}}
                            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    >
                        {isSoundEnabled ? "Выключить звук тревоги" : "Включить звук тревоги"}
                    </button>

                    <button style={{padding: '10px', borderRadius: '8px'}}
                            onClick={() => setIsDangerModalOpen(true)}>Параметры тревоги
                    </button>
                    <button style={{padding: '10px', borderRadius: '8px'}} onClick={() => setPatInfo(true)}>Информация о
                        пациенте
                    </button>
                    <button style={{padding: '10px', borderRadius: '8px'}} onClick={() => setParamModalOpen(true)} disabled={!analysisStats}>
                        Статистический анализ
                    </button>
                </footer>
            </div>

            <ParamModal
                isOpen={paramModalOpen}
                onClose={() => setParamModalOpen(false)}
                analysisStats={analysisStats}
            />
            <MonInfo
                isOpen={patInfo}
                onClose={() => setPatInfo(false)}
                patientId={patientId}
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

            {isNext && <div style={{ backgroundColor: '#f87171', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, display: 'flex', textAlign: 'center', padding: '20px', borderRadius: '8px'}}>
              Данная часть исследования закончилась, чтобы продолжить нажмите продолжить на экране монитора
            </div>}
        </>
    );
}