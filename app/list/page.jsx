'use client';

import Link from 'next/link';
import './styles.css';
import useUsers from "@/app/api/Patients";
import React, {useState} from "react";
import EditPatientModal from "@/app/components/EditPatientModal";

const ArrowRight = () => (
    <svg
        className="arrow-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const UserBentoCard = ({ user, index }) => {
    return (
        <Link href={`/panel/${user?.id}`} passHref>
            <div
                className={`bento-card ${user?.name ? 'status-completed' : 'status-pending'}`}
            >
                <div className="card-info">
                    <div className="card-header">
                        <div className="user-avatar">
                            {user?.name.charAt(0) || '0'}
                        </div>
                        <h3 className="user-name">{user?.name || `Фамилмия имя отчество ${user.id}`}</h3>
                    </div>

                    <p className={`user-status ${user?.name ? 'text-completed' : 'text-pending'}`}>
                        {user?.name ? "Данные заполнены" : "Данные не заполнены"}
                    </p>
                </div>
                <div className="card-arrow-container">
                    <ArrowRight />
                </div>
            </div>
        </Link>
    );
};

const BentoUserList = () => {
    const { users, isLoading, error, refetch } = useUsers();
    console.log(isLoading);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePatientSaveSuccess = () => {
        setIsModalOpen(false);
        refetch();
    };
    if (isLoading) {
        return (
            <div className="bento-grid-container">
                <h2 className="grid-title">Список пользователей</h2>
                <div className="bento-list">
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>

                    <p className="loading-state">Загрузка пользователей...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="bento-grid-container">
                <h2 className="grid-title">Список пользователей</h2>
                <div className="bento-list">
                    <p className="error-state">Ошибка загрузки: {error.message}</p>
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bento-grid-container">
                <h2 className="grid-title">Список пользователей</h2>
                <div className="bento-list">
                    <p className="empty-state">Пользователи не найдены.</p>
                </div>
            </div>
        );
    }

    return ( <>
        <div className="bento-grid-container">
            <h2 className="grid-title">Список пользователей</h2>
            <button
                className="edit-button"
                style={{backgroundColor: '#007bff', padding: '8px 15px', borderRadius: '8px', marginBottom: '20px'}}
                onClick={() => setIsModalOpen(true)}
            >
                Добавить пациента
            </button>
            <div className="bento-list">
                {users.map((user, index) => (
                    <UserBentoCard
                        key={user.id}
                        user={user}
                        index={index}
                    />
                ))}
            </div>
        </div>
            {isModalOpen && (
                <EditPatientModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    successAdd = {handlePatientSaveSuccess}
                />
            )}
        </>
    );
};

export default BentoUserList;