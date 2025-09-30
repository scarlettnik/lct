import React, {useState} from "react";
import '../panel/style.css'
import EditPatientModal from "@/app/components/EditPatientModal";

const PatientInfo = ({patient, handleSavePatientData}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (<>
        <aside className="bento-box fm-patient-info">
            <header className="fm-patient-header" style={{display: 'flex', justifyContent: 'space-between'}}>
                <h2 className="fm-subtitle">Пациент</h2>
                <button
                    className="edit-button"
                    style={{backgroundColor: '#007bff',padding: '8px 15px', borderRadius: '8px'}}
                    onClick={() => setIsModalOpen(true)}
                >
                    Редактировать
                </button>
            </header>

            <p className="fm-patient-name">{patient.name}</p>
            <div className="fm-details-group">
                <div className="fm-patient-detail"><p style={{width: '35%'}}>Паритет родов:</p> <span
                    style={{width: '60%'}}>{patient.parity_of_births || 1}</span></div>
                <div className="fm-patient-detail"><p style={{width: '35%'}}>Соматические
                    заболевания: </p><span
                    style={{width: '60%'}}>{patient.somatic_diseases || 'Здесь может быть очень много текста, нужно придумать как адекватное такое можно отображать'}</span>
                </div>
                <div className="fm-patient-detail"><p style={{width: '35%'}}>Течение беременности: </p><span
                    style={{width: '60%'}}>{patient.pregnancy_course || 'Наблюдалась в ЖК с 7 недель. Течение физиологическое, без осложнений. Ранний токсикоз лёгкой степени (до 10 недель) купирован диетой. Анализы крови, мочи и скрининги в норме. Прибавка в весе за беременность: +10.5 кг. Плановые УЗИ и допплерометрия (20, 32 нед.) – без патологий.'}</span>
                </div>
                <div className="fm-patient-detail"><p style={{width: '35%'}}>Последняя менструация: </p> <span
                    style={{width: '60%'}}>{patient.lmp}</span></div>
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
                    {patient.bloodGas.map((item, index) => (
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
        {isModalOpen && (
            <EditPatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                patientData={patient}
                onSave={handleSavePatientData}
            />
        )}
    </>)
}

export default PatientInfo;