import React, {useState} from "react";
import '../panel/[id]/style.css'
import EditPatientModal from "@/app/components/EditPatientModal";

const PatientInfo = ({patient}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    console.log(patient);

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

            <p className="fm-patient-name">{patient?.name || `Фамилия Имя Отчество ${patient?.id}`}</p>
            <div className="fm-details-group">
                <div className="fm-patient-detail"><p style={{width: '35%'}}>Паритет родов:</p> <span
                    style={{width: '60%'}}>{patient?.info?.parity || 'Нет данных'}</span></div>
                <div className="fm-patient-detail"><p style={{width: '35%'}}>Соматические
                    заболевания: </p><span
                    style={{width: '60%'}}>{patient?.info?.somatic_diseases || 'Нет данных'}</span>
                </div>
                <div className="fm-patient-detail"><p style={{width: '35%'}}>Течение беременности: </p><span
                    style={{width: '60%'}}>{patient?.info?.pregnancy_course || 'Нет данных'}</span>
                </div>
                <div className="fm-patient-detail"><p style={{width: '35%'}}>Последняя менструация: </p> <span
                    style={{width: '60%'}}>{patient?.info?.last_menstrual_period || 'Нет данных'}</span></div>
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
                    {patient?.info?.blood_gas.map((item, index) => (
                        <tr key={index}>
                            <td>{item?.name}</td>
                            <td>{item?.value}</td>
                            <td>{item?.unit}</td>
                            <td>{item?.normal}</td>
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
            />
        )}
    </>)
}

export default PatientInfo;