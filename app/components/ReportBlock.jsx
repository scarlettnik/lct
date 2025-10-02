import React from "react";
import { generatePdfFromHtml } from "@/hooks/pdfGenerator";
import '../panel/[id]/style.css'

const ReportBlock = ({ reportData }) => {
    const stats = reportData?.stats;

    // Классы для состояния
    let pathologyClass = 'path-normal';
    if (stats?.condition === 'Suspicious') {
        pathologyClass = 'path-suspicious';
    } else if (stats?.condition === 'Pathological') {
        pathologyClass = 'path-pathological';
    }

    const reportRef = React.useRef(null);

    const generatePdfReport = () => {
        generatePdfFromHtml(reportRef.current, 'КТГ_Отчет');
    };

    return (
        <div
            className={'bento-box fm-report-block fm-patient-info'}
            style={{ minWidth: '30vw !important' }}
            ref={reportRef}
        >
            <header style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2 className="fm-subtitle">Отчет</h2>
                <button
                    onClick={generatePdfReport}
                    className="fm-print-button"
                    style={{
                        padding: '8px 15px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Скачать отчет
                </button>
            </header>

            <div className="report-metric">
                Среднее значение базовой ЧСС:
                <span className="metric-value">{stats?.bpm_average?.toFixed(1)} уд</span>
            </div>

            <div className="report-metric">
                Средний тонус матки:
                <span className="metric-value">{stats?.uterus_average?.toFixed(1)}</span>
            </div>

            <div className="report-metric">
                Количество Акцелераций:
                <span className="metric-value">{stats?.acceleration_count}</span>
            </div>

            <div className="report-metric">
                Количество Децелераций:
                <span className="metric-value">{stats?.deceleration_count}</span>
            </div>

            <div className="report-submetric">Поздние Децелерации:
                <span className="metric-value">{stats?.late_deceleration_count}</span>
            </div>
            <div className="report-submetric">Ранние Децелерации:
                <span className="metric-value">{stats?.early_deceleration_count}</span>
            </div>
            <div className="report-submetric">Вариабельные Децелерации:
                <span className="metric-value">{stats?.variable_deceleration_count}</span>
            </div>

            <div className={`report-pathology-status ${pathologyClass}`}>
                <span className="pathology-label">Статус:</span>
                <span className="pathology-value">{stats?.condition || "Нормальное"}</span>
            </div>

            <div className="report-metric time-metric">
                Тахикардия:
                <div className="time-submetric" style={{ paddingLeft: '1ch' }}>
                    умеренная: <span className="metric-value">
                        {stats?.mild_tachycardia_seconds
                            ? (stats.mild_tachycardia_seconds / 60).toFixed(1)
                            : 0} мин.
                    </span>
                </div>
                <div className="time-submetric">
                    выраженная: <span className="metric-value">
                        {stats?.severe_tachycardia_seconds
                            ? (stats.severe_tachycardia_seconds / 60).toFixed(1)
                            : 0} мин.
                    </span>
                </div>
            </div>

            <div className="report-metric time-metric">
                Брадикадия:
                <div className="time-submetric">
                    умеренная: <span className="metric-value">
                        {stats?.mild_bradycardia_seconds
                            ? (stats.mild_bradycardia_seconds / 60).toFixed(1)
                            : 0} мин.
                    </span>
                </div>
                <div className="time-submetric">
                    выраженная: <span className="metric-value">
                        {stats?.severe_bradycardia_seconds
                            ? (stats.severe_bradycardia_seconds / 60).toFixed(1)
                            : 0} мин.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ReportBlock;
