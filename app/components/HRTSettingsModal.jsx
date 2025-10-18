import React, { useState, useEffect } from "react";
import VirtualKeyboard from "./VirtualKeyBoard";
import "../UploadModal.css";

const initialDefaultSettings = {
    minHRT: 60,
    maxHRT: 160,
    volume: 80,
};

export default function HRTSettingsModal({
                                             isOpen,
                                             onClose,
                                             currentHRT = 0,
                                             onSave, // Функция для передачи сохраненных данных в FetalMonitor
                                             initialMinHRT = initialDefaultSettings.minHRT,
                                             initialMaxHRT = initialDefaultSettings.maxHRT,
                                             initialVolume = initialDefaultSettings.volume, // 📌 Принимаем громкость
                                         }) {
    const [settings, setSettings] = useState(() => ({
        minHRT: initialMinHRT,
        maxHRT: initialMaxHRT,
        volume: initialVolume,
    }));

    useEffect(() => {
        setSettings({
            minHRT: initialMinHRT,
            maxHRT: initialMaxHRT,
            volume: initialVolume,
        });
    }, [initialMinHRT, initialMaxHRT, initialVolume]);


    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [activeInput, setActiveInput] = useState(null);
    const [message, setMessage] = useState("");

    if (!isOpen) {
        return null;
    }

    const isAlertCondition = currentHRT > 0 &&
        (currentHRT < settings.minHRT || currentHRT > settings.maxHRT);


    const handleNativeInputChange = (e) => {
        const { id, value } = e.target;
        const numericVal = value.replace(/[^0-9]/g, '');

        let finalValue = parseInt(numericVal) || 0;
        let maxLength = 3;

        if (numericVal.length > maxLength) return;

        if (id === 'volume') {
            finalValue = Math.min(finalValue, 100);
        } else {
            finalValue = Math.max(0, Math.min(finalValue, 300));
        }

        setSettings(prev => ({
            ...prev,
            [id]: finalValue,
        }));

        if (activeInput) {
            setActiveInput(null);
            setIsKeyboardVisible(false);
        }
    };

    const handleKeyUpdate = (newVal) => {
        if (!activeInput) return;

        const numericVal = String(newVal).replace(/[^0-9]/g, '');
        let finalValue = parseInt(numericVal) || 0;
        let maxLength = 3;

        if (numericVal.length > maxLength) return;

        if (activeInput === 'volume') {
            finalValue = Math.min(finalValue, 100);
        } else {
            finalValue = Math.max(0, Math.min(finalValue, 300));
        }

        setSettings(prev => ({
            ...prev,
            [activeInput]: finalValue,
        }));
    };


    const handleInputFocus = (inputName) => {
        setActiveInput(inputName);
        setIsKeyboardVisible(true);
        setMessage("");
    };

    const handleSave = (e) => {
        e.preventDefault();

        if (settings.minHRT >= settings.maxHRT) {
            setMessage("❌ Минимальное ЧСС должно быть строго меньше Максимального.");
            return;
        }

        if (onSave) {
            onSave(settings.minHRT, settings.maxHRT, settings.volume);
        }

        setActiveInput(null);
        setIsKeyboardVisible(false);
        setMessage("");
        onClose();
    };

    const activeInputValue = activeInput ? String(settings[activeInput]) : '';
    const keyboardKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace', 'Done'];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Настройки Тревоги (ЧСС и Звук)</h2>
                <button className="close-button" onClick={onClose}>&times;</button>

                {/*/!* Отображение текущего ЧСС *!/*/}
                {/*<div className="current-hrt-display">*/}
                {/*    Текущая ЧСС: <span className={isAlertCondition ? 'alert-value' : 'normal-value'}>*/}
                {/*        {currentHRT} уд/мин*/}
                {/*    </span>*/}
                {/*</div>*/}

                {message && <p className="alert-message">{message}</p>}

                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label htmlFor="minHRT">Мин. ЧСС (уд/мин):</label>
                        <input
                            id="minHRT"
                            type="number"
                            inputMode="none"
                            value={settings.minHRT}
                            onChange={handleNativeInputChange}
                            onFocus={() => handleInputFocus('minHRT')}
                            className="input-field"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="maxHRT">Макс. ЧСС (уд/мин):</label>
                        <input
                            id="maxHRT"
                            type="number"
                            inputMode="none"
                            value={settings.maxHRT}
                            onChange={handleNativeInputChange}
                            onFocus={() => handleInputFocus('maxHRT')}
                            className="input-field"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="volume">Громкость сигнала (0 - 100):</label>
                        <input
                            id="volume"
                            type="number"
                            inputMode="none"
                            value={settings.volume}
                            onChange={handleNativeInputChange}
                            onFocus={() => handleInputFocus('volume')}
                            className="input-field"
                        />
                    </div>

                    {isKeyboardVisible && (
                        <VirtualKeyboard
                            onKeyPress={handleKeyUpdate}
                            onDone={() => setIsKeyboardVisible(false)}
                            targetValue={activeInputValue}
                            keys={keyboardKeys}
                        />
                    )}
                    <div className="button-group">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Отмена
                        </button>
                        <button type="submit" className="btn-submit">
                            Сохранить настройки
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}