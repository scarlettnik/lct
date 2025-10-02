'use client'

import React, { useState, useEffect } from 'react';
import '../Modal.css';
import { useParams } from "next/navigation";

const FIXED_BGA_PARAMS = [
    { parameter: "pH", apiName: "pH", unit: "" },
    { parameter: "CO2", apiName: "CO2", unit: "mmHg" },
    { parameter: "Glu", apiName: "Glu", unit: "mg/dL" },
    { parameter: "Lac", apiName: "Lac", unit: "mmol/L" },
    { parameter: "BE", apiName: "BE", unit: "mmol/L" },
];

const formatDataForApi = (data) => {
    return {
        name: data.name || "Новый пациент",
        info: {
            parity: data.info?.parity || '',
            pregnancy_course: data.info?.pregnancy_course || '',
            last_menstrual_period: data.info?.last_menstrual_period || '',
            somatic_diseases: data.info?.somatic_diseases || '',
            blood_gas: data.info?.blood_gas?.map(item => ({
                name: item.name,
                value: item.value !== '' ? parseFloat(item.value) : 0,
            })) || []
        }
    };
};

// Принимаем onSuccess
const EditPatientModal = ({ isOpen, onClose, patientData, successAdd, onSuccess }) => {
    const [formData, setFormData] = useState(null);
    const params = useParams();

    useEffect(() => {
        if (!patientData) {
            setFormData({
                name: '',
                info: {
                    parity: '',
                    last_menstrual_period: '',
                    somatic_diseases: '',
                    pregnancy_course: '',
                    blood_gas: FIXED_BGA_PARAMS.map(p => ({ ...p, name: p.apiName, value: '0' }))
                }
            });
            return;
        }

        const initialBloodGas = FIXED_BGA_PARAMS.map(fixedItem => {
            const existingItem = patientData?.info?.blood_gas?.find(item =>
                item.name === fixedItem.apiName ||
                (fixedItem.apiName === "CO2" && (item.name === "pCO₂" || item.name === "CO₂"))
            );

            return {
                ...fixedItem,
                name: fixedItem.apiName,
                value: existingItem?.value || '',
            };
        });

        setFormData({
            name: patientData?.name || '',
            info: {
                parity: patientData?.info?.parity || '',
                last_menstrual_period: patientData?.info?.last_menstrual_period || '',
                somatic_diseases: patientData?.info?.somatic_diseases || '',
                pregnancy_course: patientData?.info?.pregnancy_course || '',
                blood_gas: initialBloodGas
            }
        });
    }, [patientData]);

    if (!isOpen || !formData) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('bga_')) {
            const index = parseInt(name.split('_')[1], 10);
            const newBGA = [...formData.info.blood_gas];
            newBGA[index].value = value;
            setFormData({ ...formData, info: { ...formData.info, blood_gas: newBGA } });
        } else {
            setFormData({
                ...formData,
                info: { ...formData.info, [name]: value },
                ...(name === 'name' ? { name: value } : {})
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const apiData = formatDataForApi(formData);

        const isUpdate = !!params?.id;
        const method = isUpdate ? 'PATCH' : 'POST';
        const url = isUpdate
            ? `https://hack.nearby-project.ru/v1/patients/${params?.id}`
            : `https://hack.nearby-project.ru/v1/patients`;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка API (${response.status}): ${errorText || 'Неизвестная ошибка'}`);
            }

            if (isUpdate && onSuccess) {
                onSuccess();
            } else if (!isUpdate && successAdd) {
                successAdd();
            } else {
                onClose();
            }

        } catch (error) {
            console.error(`Ошибка при сохранении:`, error);
            alert(`Не удалось сохранить данные: ${error.message}`);
        }
    };

    const modalTitle = params?.id ? "Редактирование данных пациента" : "Создание нового пациента";

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h3 className="modal-title">{modalTitle}</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </header>

                <form onSubmit={handleSubmit} className="patient-edit-form">
                    <fieldset>
                        <legend>Основные данные</legend>
                        <label>Имя пациента:</label>
                        <input type="text" name="name" value={formData?.name || ''} onChange={handleChange} required/>

                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '15px 0'}}>
                            <label>Паритет родов:</label>
                            <input type="text" style={{
                                backgroundColor: 'white',
                                border: '1px solid black',
                                padding: '5px',
                                color: 'black',
                                width: '150px'
                            }} name="parity"
                                   value={formData?.info?.parity || ''}
                                   onChange={handleChange}/>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '15px 0'}}>
                            <label>Последняя менструация:</label>
                            <input style={{
                                backgroundColor: 'white',
                                border: '1px solid black',
                                padding: '5px',
                                color: 'black',
                                width: '150px'
                            }} type="date" name="last_menstrual_period"
                                   value={formData?.info?.last_menstrual_period || ''}
                                   onChange={handleChange}/>
                        </div>


                        <label>Соматические заболевания:</label>
                        <textarea name="somatic_diseases" rows="3"
                                  value={formData?.info?.somatic_diseases || ''}
                                  onChange={handleChange}/>

                        <label>Течение беременности:</label>
                        <textarea name="pregnancy_course" rows="5"
                                  value={formData?.info?.pregnancy_course || ''}
                                  onChange={handleChange}/>
                    </fieldset>

                    <fieldset>
                        <legend>Показатели газа в крови</legend>
                        <div className="bga-grid">
                            {formData?.info?.blood_gas.map((item, index) => (
                                <React.Fragment key={item.parameter}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '15px 0'}}>
                                        <label className="bga-label">{item.parameter} ({item?.unit}):</label>
                                        <input
                                            style={{
                                                backgroundColor: 'white',
                                                border: '1px solid black',
                                                padding: '5px',
                                                color: 'black',
                                                width: '150px'
                                            }}
                                            type="number"
                                            step="any"
                                            name={`bga_${index}_value`}
                                            value={item?.value}
                                            onChange={handleChange}
                                            className="bga-input"
                                            min={0}
                                        />
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </fieldset>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Отмена</button>
                        <button type="submit" className="save-btn">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPatientModal;