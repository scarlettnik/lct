import React, { useState, useEffect } from 'react';
import '../Modal.css'; // Создадим отдельный файл стилей для модалки

const EditPatientModal = ({ isOpen, onClose, patientData, onSave }) => {
    // Инициализация формы текущими данными пациента
    const [formData, setFormData] = useState(patientData);

    useEffect(() => {
        setFormData(patientData);
    }, [patientData]);


    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Обработка основных полей
        if (name.startsWith('bga_')) {
            // Обработка данных газа в крови
            const index = parseInt(name.split('_')[1], 10);
            const key = name.split('_')[2];

            const newBGA = [...formData.bloodGas];
            if (newBGA[index]) {
                newBGA[index] = {
                    ...newBGA[index],
                    [key]: value,
                    // Простая логика: если значение не равно норме, статус меняется
                    isNormal: true // Здесь можно добавить более сложную логику проверки
                };
            }
            setFormData({ ...formData, bloodGas: newBGA });

        } else {
            // Обработка простых полей
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Вызываем функцию сохранения, переданную из родителя
        onSave(formData);
        onClose();
    };

    return (
        <div className="modal-backdrop" style={{overflow: 'hidden !important'}} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h3 className="modal-title">Редактирование данных пациента</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </header>

                <form onSubmit={handleSubmit} className="patient-edit-form">
                    {/* Секция основных данных */}
                    <fieldset>
                        <legend>Основные данные</legend>
                        <label>Имя:</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />

                        <label>Паритет родов:</label>
                        <input type="text" name="parity_of_births" value={formData.parity_of_births || ''} onChange={handleChange} />

                        <label>Последняя менструация (ЛМП):</label>
                        <input type="text" name="lmp" value={formData.lmp || ''} onChange={handleChange} />

                        <label>Соматические заболевания:</label>
                        <textarea name="somatic_diseases" rows="3" value={formData.somatic_diseases || ''} onChange={handleChange} />

                        <label>Течение беременности:</label>
                        <textarea name="pregnancy_course" rows="5" value={formData.pregnancy_course || ''} onChange={handleChange} />
                    </fieldset>

                    {/* Секция показателей газа в крови */}
                    <fieldset>
                        <legend>Показатели газа в крови (BGA)</legend>
                        <div className="bga-grid">
                            {formData.bloodGas && formData.bloodGas.map((item, index) => (
                                <React.Fragment key={item.parameter}>
                                    <label className="bga-label">{item.parameter} ({item.unit}):</label>
                                    <input
                                        type="text"
                                        name={`bga_${index}_value`}
                                        value={item.value || ''}
                                        onChange={handleChange}
                                        className="bga-input"
                                    />
                                </React.Fragment>
                            ))}
                        </div>
                    </fieldset>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Отмена</button>
                        <button type="submit" className="save-btn">Сохранить изменения</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPatientModal;