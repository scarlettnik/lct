// components/BentoUserList.js
'use client';

import Link from 'next/link';
import './styles.css';

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

const usersData = [
    { id: 1, name: 'Анна Иванова', email: 'anna.i@example.com', role: 'Администратор' },
    { id: 2, name: 'Пётр Сидоров', email: 'petr.s@example.com', role: 'Редактор' },
    { id: 3, name: 'Мария Кузнецова', email: 'maria.k@example.com', role: 'Пользователь' },
    { id: 4, name: 'Дмитрий Смирнов', email: 'dmitriy.s@example.com', role: 'Пользователь' },
    { id: 5, name: 'Елена Васильева', email: 'elena.v@example.com', role: 'Пользователь' },
];

const UserBentoCard = ({ user, index }) => {
    const isCompleted = index < 2;
    const statusText = isCompleted ? 'Заполненный пользователь' : 'Не заполненный пользователь';

    return (
        <Link href={`/panel`} passHref>
            <div
                className={`bento-card ${isCompleted ? 'status-completed' : 'status-pending'}`}
            >
                <div className="card-info">
                    <div className="card-header">
                        <div className="user-avatar">
                            {user.name.charAt(0)}
                        </div>
                        <h3 className="user-name">{user.name}</h3>
                    </div>

                    <p className={`user-status ${isCompleted ? 'text-completed' : 'text-pending'}`}>
                        {statusText}
                    </p>
                </div>

                {/* Компонент стрелки справа */}
                <div className="card-arrow-container">
                    <ArrowRight />
                </div>
            </div>
        </Link>
    );
};

const BentoUserList = () => {
    return (
        <div className="bento-grid-container">
            <h2 className="grid-title">Список пользователей</h2>
            <div className="bento-list">
                {usersData.map((user, index) => (
                    <UserBentoCard
                        key={user.id}
                        user={user}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
};

export default BentoUserList;