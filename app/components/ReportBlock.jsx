import React from "react";
import {generatePdfFromHtml} from "@/hooks/pdfGenerator";

const ReportBlock = ({reportData}) => {
    let pathologyClass = 'path-normal';
    if (reportData.pathologyStatus === 'Suspicious') {
        pathologyClass = 'path-suspicious';
    } else if (reportData.pathologyStatus === 'Pathological') {
        pathologyClass = 'path-pathological';
    }

    const reportRef = React.useRef(null);

    const generatePdfReport = () => {
        generatePdfFromHtml(reportRef.current, 'КТГ_Отчет');
    };

    return (
        <div className={'bento-box fm-report-block fm-patient-info'}  ref={reportRef}>

            <header style={{display: 'flex', justifyContent: 'space-between'}}>
                <h2 className="fm-subtitle">Окончательный отчет</h2>
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
                    Скачать отчет (PDF)
                </button>
            </header>
            <div className="report-metric">
            Среднее значение базовой ЧСС:
                <span className="metric-value">{reportData.avgBaselineFHR} уд</span>
            </div>

            <div className="report-metric">
                Количество маточных сокращений (частота):
                <span className="metric-value">{reportData.ucFrequency}</span>
            </div>

            <div className="report-metric">
                Количество Акцелераций:
                <span className="metric-value">{reportData.accelFrequency}</span>
            </div>

            <div className="report-metric">
                Количество Децелераций:
                <span className="metric-value">{reportData.decelFrequency}</span>
            </div>

            <div className="report-submetric">Поздние Децелерации:
                <span className="metric-value">{reportData.lateDecels}</span>
            </div>
            <div className="report-submetric">Ранние Децелерации:
                <span className="metric-value">{reportData.earlyDecels}</span>
            </div>
            <div className="report-submetric">Вариабельные Децелерации:
                <span className="metric-value">{reportData.variableDecels}</span>
            </div>

            <div className={`report-pathology-status ${pathologyClass}`}>
                <span className="pathology-label">Статус:</span>
                <span className={`pathology-value `}>{reportData.pathologyStatus || "Нормальное"}</span>
            </div>
            <div className="report-metric time-metric">
                Тахикардия:
                <div className="time-submetric" style={{paddingLeft: '1ch'}}> умеренная (160уд): <span
                    className="metric-value">{reportData.tachycardiaModerateTime} мин.</span></div>
                <div className="time-submetric">выраженная (190уд): <span
                    className="metric-value">{reportData.tachycardiaSevereTime} мин.</span></div>
            </div>
            <div className="report-metric time-metric">
                Брадикадия:
                <div className="time-submetric">умеренная (110уд): <span
                    className="metric-value">{reportData.bradycardiaModerateTime} мин.</span></div>
                <div className="time-submetric">выраженная (90уд): <span
                    className="metric-value">{reportData.bradycardiaSevereTime} мин.</span></div>
            </div>
        </div>
    );
}
export default ReportBlock;