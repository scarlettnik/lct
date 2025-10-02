import Link from 'next/link';
import styles from './start/styles.module.css';

const features = [
    {
        title: "ДЕМОНСТРАЦИЯ ПУЛЬСА",
        description: "Визуализация сердцебиения плода в реальном времени.",
        className: `${styles.size2x2} ${styles.bentoBlock} ${styles.demoBlock}`,
    },
    {
        title: "НАЧАТЬ СИМУЛЯЦИЮ (КТГ)",
        className: `${styles.size2x2} ${styles.buttonCard}`,
        href: "/mon",
        isPrimary: true,
    },
    {
        title: "ПОСМОТРЕТЬ АНАЛИЗ КЕЙСОВ",
        className: `${styles.size2x2} ${styles.buttonCard}`,
        href: "/list",
        isSecondary: true,
    },
    {
        title: "ЭКСПЕРТНАЯ ВАЛИДАЦИЯ",
        description: "Консультировались с практикующими акушерами-гинекологами.",
        className: `${styles.size2x1} ${styles.bentoBlock}`,
        icon: "🩺"
    },
    {
        title: "УДАЛЕННЫЙ ДОСТУП",
        description: "Облачный мониторинг. Врач может подключиться из кабинета",
        className: `${styles.size2x1} ${styles.bentoBlock}`,
        icon: "☁️"
    },
    {
        title: "ПРЕДСКАЗАНИЕ РИСКОВ",
        description: "Краткосрочные и долгосрочные прогнозы исходов на основе анализа паттернов КТГ.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "🔮"
    },
    {
        title: "АВТОМАТИЧЕСКАЯ АНАЛИТИКА",
        description: "Мгновенный отчет о времени реакции, точности диагноза и клинической эффективности.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "📊"
    },
    {
        title: "ДОПОЛНИТЕЛЬНЫЕ ИСТОЧНИИКИ",
        description: "Повысили точность предсказаний с помощью использования дополнительных данных",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "📑"
    },
    {
        title: "ФОКУС НА АНОМАЛИЯХ",
        description: "Система выделяет подозрительные сегменты КТГ для акцентированного внимания.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "🔍"
    },
];

const FeatureCard = ({ title, description, className, icon, href, isPrimary, isSecondary, component: Component }) => {
    if (Component) {
        return (
            <div className={className}>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDescription}>{description}</p>
                <Component />
            </div>
        );
    }

    // Рендеринг кнопок
    if (href) {
        const buttonClass = isPrimary ? styles.primaryButton : styles.secondaryButton;

        return (
            <Link href={href} className={`${className} ${buttonClass}`}>
                <div className={styles.icon}>{icon}</div>
                <h3 className={styles.buttonTitle}>{title}</h3>
                <p className={styles.buttonDescription}>{description}</p>
            </Link>
        );
    }

    // Рендеринг обычных информационных блоков
    return (
        <div className={className}>
            <div className={styles.icon}>{icon}</div>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureDescription}>{description}</p>
        </div>
    );
};

const FetalMonitorShowcase = () => {
    return (
        <div className={styles.showcaseContainer}>

            <header className={styles.header}>
                <h1 className={styles.title}>
                    КТГ-СИМУЛЯТОР: ПРАКТИКА ИНТЕРПРЕТАЦИИ
                </h1>
                <p className={styles.subtitle}>
                    Симулятор, основанный на протоколах FIGO/NICE.
                </p>
            </header>
            <div className={styles.bentoGrid}>
                {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}

            </div>

        </div>
    );
};

export default FetalMonitorShowcase;