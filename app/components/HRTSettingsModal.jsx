import React, { useState, useEffect } from "react";
import VirtualKeyboard from "./VirtualKeyBoard";
import "../UploadModal.css";

const ALERT_SOUND_PATH = "/alarm.mp3";

const initialSettings = {
    minHRT: 60,
    maxHRT: 100,
    volume: 80,
};

export default function HRTSettingsModal({ isOpen, onClose, currentHRT = 0 }) {
    const [settings, setSettings] = useState(initialSettings);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(true); // Изначально скрыта
    const [activeInput, setActiveInput] = useState(null);
    const [message, setMessage] = useState("");
    const audioRef = React.useRef(new Audio(ALERT_SOUND_PATH));

    useEffect(() => {
        const { minHRT, maxHRT, volume } = settings;
        audioRef.current.volume = volume / 100;

        const isAlertCondition = currentHRT > 0 && (currentHRT < minHRT || currentHRT > maxHRT);

        if (isAlertCondition) {
            setMessage(`🚨 Warning! HRT (${currentHRT}) outside range [${minHRT}-${maxHRT}].`);
            audioRef.current.loop = true;

            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay prevented. User must interact first.", error);
                });
            }
        } else {
            setMessage("");
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        return () => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        };
    }, [currentHRT, settings]);

    if (!isOpen) return null;

    const handleNativeInputChange = (e) => {
        const { id, value } = e.target;
        // Фильтруем все, кроме цифр.
        const numericVal = value.replace(/[^0-9]/g, '');

        let finalValue = parseInt(numericVal) || 0;
        let maxLength = 3;

        if (numericVal.length > maxLength) return;

        if (id === 'volume') {
            finalValue = Math.min(finalValue, 100);
        }

        if (isKeyboardVisible) {
            setActiveInput(null);
        }

        setSettings(prev => ({
            ...prev,
            [id]: finalValue,
        }));
    };

    const handleKeyUpdate = (newVal) => {
        if (!activeInput) return;

        const numericVal = String(newVal).replace(/[^0-9]/g, '');

        let finalValue = parseInt(numericVal) || 0;
        let maxLength = 3;

        if (numericVal.length > maxLength) return;

        if (activeInput === 'volume') {
            finalValue = Math.min(finalValue, 100);
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

        if (settings.minHRT >= settings.maxHRT || settings.minHRT <= 0) {
            alert("❌ Минимальное ЧСС должно быть меньше Максимального и больше нуля.");
            return;
        }
        setIsKeyboardVisible(false);
        onClose();
    };

    const activeInputValue = activeInput ? String(settings[activeInput]) : '';
    const keyboardKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace', 'Done'];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Настройки ЧСС и Звука</h2>
                <button className="close-button" onClick={onClose}>&times;</button>

                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label htmlFor="minHRT">Мин. ЧСС (уд/мин):</label>
                        <input
                            id="minHRT"
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
                            inputMode="numeric"
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