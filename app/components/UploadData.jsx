import React, { useState, useRef } from "react";
import "../UploadModal.css";
import VirtualKeyboard from "./VirtualKeyBoard"; // Импорт клавиатуры

export default function UploadModal({ isOpen, onClose }) {
    const [patientId, setPatientId] = useState("");
    const [zipFile, setZipFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(true); // Новое состояние для клавиатуры

    const inputRef = useRef(null); // Ref для поля ввода ID пациента

    if (!isOpen) return null;
    const handlePatientIdChangeFromKeyboard = (newVal) => {
        setPatientId(newVal);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!patientId || !zipFile) {
            setMessage("Пожалуйста, заполните ID пациента и выберите файл.");
            return;
        }

        // Скрыть клавиатуру при отправке
        setIsKeyboardVisible(false);

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("patient_id", patientId);
        formData.append("zip_file", zipFile);

        try {
            const response = await fetch("https://hack.nearby-project.ru/v1/emulation/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                setMessage("✅ Данные успешно отправлены!");
                setPatientId("");
                setZipFile(null);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                const errorData = await response.json();
                setMessage(`❌ Ошибка отправки: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            setMessage(`❌ Сетевая ошибка: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Загрузите ZIP-файл</h2>
                <button className="close-button" onClick={onClose}>&times;</button>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="patientId">Введите ID пациента:</label>
                        <input
                            id="patientId"
                            ref={inputRef} // Привязка ref
                            type="text"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            onFocus={() => setIsKeyboardVisible(true)}
                            required
                            className="input-field"
                            inputMode="none"
                        />
                    </div>

                    {isKeyboardVisible && (
                        <VirtualKeyboard
                            onKeyPress={handlePatientIdChangeFromKeyboard}
                            onDone={() => setIsKeyboardVisible(false)}
                            targetValue={patientId}
                        />
                    )}

                    <div className="form-group">
                        <label htmlFor="zipFile">Загрузить ZIP-архив:</label>
                        <input
                            id="zipFile"
                            type="file"
                            accept=".zip"
                            onChange={(e) => setZipFile(e.target.files[0])}
                            required
                            className="input-file"
                            // При фокусировке на другом поле скрываем клавиатуру
                            onFocus={() => setIsKeyboardVisible(false)}
                        />
                    </div>
                    <div className="button-group">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-cancel">
                            Отмена
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn-submit">
                            {isSubmitting ? "Отправка..." : "Отправить данные"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}