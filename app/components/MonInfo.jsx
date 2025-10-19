'use client'
import React, {useCallback, useEffect, useState} from "react";
import EditPatientModal from "@/app/components/EditPatientModal";

const MonInfo = ({patientId, onClose, isOpen}) => {
    const [patient, setPatient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPatientData = useCallback(async () => { // Removed isInitialLoad as it wasn't used
        if (!patientId) {
            console.warn("patientId не определен. Пропуск загрузки данных.");
            return;
        }

        try {
            const response = await fetch(`https://hack.nearby-project.ru/v1/patients/${patientId}`);

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const data = await response.json();
            setPatient(data);
            console.log("Данные пациента успешно загружены:", data);

        } catch (error) {
            console.error("Ошибка при получении данных пациента:", error);
            setPatient(null);
        }
    }, [patientId]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        // Re-fetch the data to show the updated information
        fetchPatientData();
    };


    useEffect(() => {
        if (isOpen && patientId) {
            fetchPatientData();
        }
    }, [patientId, isOpen, fetchPatientData]);

    if (!isOpen) { return null }

    return (
        <div className='modal-overlay' style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div
                className="modal-content"
                style={{
                    width: '50vw',
                    minWidth: '350px',
                    maxWidth: '800px',
                    height: 'auto',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px',
                    fontSize: '18px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onClick={e => e.stopPropagation()}>
                <header className="modal-header" style={{padding: '0 0 20px 0', borderBottom: '1px solid #eee', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h3 className="modal-title" style={{margin: 0, fontSize: '24px', fontWeight: '600'}}>Информация о пациенте</h3>
                    <button className="close-button" onClick={onClose} style={{
                        background: 'none', border: 'none', fontSize: '30px', cursor: 'pointer', color: '#333', lineHeight: '1'
                    }}>&times;</button>
                </header>

                {patient ? (
                    <div style={{flexGrow: 1, overflowY: 'auto', paddingTop: '20px'}}>

                        <p className="fm-patient-name" style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '20px'}}>{patient?.name || `Фамилия Имя Отчество ID: ${patient?.id}`}</p>

                        <div className="fm-details-group" style={{marginBottom: '30px', border: '1px solid #eee', padding: '15px', borderRadius: '8px'}}>
                            <div className="fm-patient-detail" style={{display: 'flex', marginBottom: '10px'}}><p style={{width: '40%', fontWeight: '500', margin: 0, color: '#555'}}>Паритет родов:</p> <span
                                style={{width: '60%', fontWeight: 'normal'}}>{patient?.info?.parity || 'Нет данных'}</span></div>
                            <div className="fm-patient-detail" style={{display: 'flex', marginBottom: '10px'}}><p style={{width: '40%', fontWeight: '500', margin: 0, color: '#555'}}>Соматические
                                заболевания: </p><span
                                style={{width: '60%', fontWeight: 'normal'}}>{patient?.info?.somatic_diseases || 'Нет данных'}</span>
                            </div>
                            <div className="fm-patient-detail" style={{display: 'flex', marginBottom: '10px'}}><p style={{width: '40%', fontWeight: '500', margin: 0, color: '#555'}}>Течение беременности: </p><span
                                style={{width: '60%', fontWeight: 'normal'}}>{patient?.info?.pregnancy_course || 'Нет данных'}</span>
                            </div>
                            <div className="fm-patient-detail" style={{display: 'flex', marginBottom: '0px'}}><p style={{width: '40%', fontWeight: '500', margin: 0, color: '#555'}}>Последняя менструация: </p> <span
                                style={{width: '60%', fontWeight: 'normal'}}>{patient?.info?.last_menstrual_period || 'Нет данных'}</span></div>
                        </div>

                        <div className="fm-bga-section">
                            <h3 className="fm-section-title" style={{fontSize: '20px', fontWeight: '600', marginBottom: '15px'}}>Показатели газа в крови</h3>
                            <table className="fm-bga-table" style={{width: '100%', borderCollapse: 'collapse'}}>
                                <thead>
                                <tr style={{backgroundColor: '#e9ecef'}}>
                                    <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600'}}>Показатель</th>
                                    <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600'}}>Значение</th>
                                    <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600'}}>Ед. изм.</th>
                                    <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600'}}>Норма</th>
                                </tr>
                                </thead>
                                <tbody>
                                {patient?.info?.blood_gas?.length > 0 ? (
                                    patient.info.blood_gas.map((item, index) => (
                                        <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'}}>
                                            <td style={{padding: '10px', border: '1px solid #dee2e6'}}>{item?.name}</td>
                                            <td style={{padding: '10px', border: '1px solid #dee2e6'}}>{item?.value}</td>
                                            <td style={{padding: '10px', border: '1px solid #dee2e6'}}>{item?.unit}</td>
                                            <td style={{padding: '10px', border: '1px solid #dee2e6'}}>{item?.normal}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{padding: '10px', textAlign: 'center', color: '#666', border: '1px solid #dee2e6'}}>Нет данных по газу в крови.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div style={{padding: '50px', textAlign: 'center', color: '#999'}}>Загрузка данных пациента...</div>
                )}
            </div>
            {isModalOpen && (
                <EditPatientModal
                    isOpen={isModalOpen}
                    onSuccess={handleModalClose}
                    onClose={() => setIsModalOpen(false)}
                    patientData={patient}
                />
            )}
        </div>
    )
}

export default MonInfo;