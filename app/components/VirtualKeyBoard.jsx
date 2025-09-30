import React from 'react';

// Клавиши для числовой клавиатуры
const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '0', 'Backspace', 'Done'
];

export default function VirtualKeyboard({ onKeyPress, onDone, targetValue }) {

    // Обработка нажатия клавиши
    const handleKeyClick = (key) => {
        if (key === 'Backspace') {
            onKeyPress(targetValue.slice(0, -1)); // Удалить последний символ
        } else if (key === 'Done') {
            onDone(); // Закрыть клавиатуру
        } else {
            onKeyPress(targetValue + key); // Добавить символ
        }
    };

    return (
        <div className="keyboard-container">
            <div className="keyboard-grid">
                {keys.map((key) => (
                    <button
                        key={key}
                        className={`key-button ${key === 'Backspace' ? 'key-backspace' : ''} ${key === 'Done' ? 'key-done' : ''}`}
                        onClick={() => handleKeyClick(key)}
                        type="button" // Важно для React, чтобы не срабатывал submit формы
                    >
                        {key === 'Backspace' ? '⌫' : key}
                    </button>
                ))}
            </div>
        </div>
    );
}