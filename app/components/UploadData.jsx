import React, { useState, useRef } from "react";
import "../UploadModal.css";
import VirtualKeyboard from "./VirtualKeyBoard"; // Импорт клавиатуры

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
    const [patientId, setPatientId] = useState("");
    const [zipFile, setZipFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    const isKeyboardVisible = true;

    const inputRef = useRef(null);

    if (!isOpen) return null;

    const handlePatientIdChangeFromKeyboard = (newVal) => {
        setPatientId(newVal);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(""); // Очищаем старое сообщение

        if (!patientId || !zipFile) {
            setMessage("Пожалуйста, заполните ID пациента и выберите файл.");
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("file", zipFile, zipFile.name);
        // Используем константу url
        const url = `https://hack.nearby-project.ru/v1/patients/${patientId}/examinations`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                },
                body: formData
            });

            if (response.ok) {
                const successData = await response.json();

                // 📌 ИЗМЕНЕНИЕ 1: Передаем successData И patientId
                if (onUploadSuccess) {
                    onUploadSuccess(patientId, successData); // Передаем ID пациента
                }

                setPatientId("");
                setZipFile(null);


            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || "Ошибка загрузки данных на сервер.";
                setMessage(`Ошибка: ${errorMessage}`);
                console.error("Server error:", errorData);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setMessage("Произошла ошибка сети или сервера.");
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
                            ref={inputRef}
                            type="text"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            required
                            className="input-field"
                            inputMode="none"
                        />
                    </div>

                    {isKeyboardVisible && (
                        <VirtualKeyboard
                            onKeyPress={handlePatientIdChangeFromKeyboard}
                            // onDone не нужен, так как клавиатура всегда видима
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
                            // Убрали onFocus
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