import React, { useState, useEffect } from 'react';
import '../Modal.css';
import ReportBlock from "@/app/components/ReportBlock"; // Создадим отдельный файл стилей для модалки

const ParamModal = ({ isOpen, onClose }) => {

    if (!isOpen) return null;
    return (
        <div className="modal-overlay" style={{overflow: 'hidden !important'}} onClick={onClose}>
            <div
                className="modal-content"
                style={{
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={e => e.stopPropagation()}
            >
                <header className="modal-header" style={{padding: '20px', flexShrink: 0}}>
                    <h3 className="modal-title">Анализ мониторинга</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </header>
                <div
                    style={{
                        margin: '0',
                        flexGrow: 1, // Растягивает контейнер на доступное пространство
                        display: 'flex',
                        justifyContent: 'center', // Центрирование по горизонтали
                        alignItems: 'center',    // Центрирование по вертикали
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <ReportBlock/>
                </div>
            </div>
        </div>
    );
};

export default ParamModal;