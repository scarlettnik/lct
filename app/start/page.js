import Link from 'next/link';
import styles from './styles.module.css';

const features = [
    {
        title: "Здесь вообще будет демка",
        className: `${styles.size2x2} ${styles.bentoBlock}`,
        icon: "❤️"
    },
    {
        title: "НАЧАТЬ СИМУЛЯЦИЮ СЕЙЧАС",
        description: "Начните практику, осваивая ключевые навыки интерпретации КТГ в динамических сценариях.",
        className: `${styles.size2x1} ${styles.buttonCard}`,
        href: "/",
        isPrimary: true,
    },
    {
        title: "ГОТОВЫЙ КЕЙС И ОТЧЕТЫ ПАЦИЕНТОВ",
        description: "Ознакомьтесь с подробным готовым отчетом по сложному клиническому случаю и анализу действий.",
        className: `${styles.size2x1} ${styles.buttonCard}`,
        href: "/list",
        isSecondary: true,
    },
    {
        title: "Полный Дебрифинг",
        description: "Мгновенный отчет о принятых решениях, времени реакции и клинической эффективности.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "📈"
    },
    {
        title: "Мультиплатформенный Доступ",
        description: "Облачная технология. Работайте на ПК, планшете или смартфоне без установки тяжелого ПО.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "🌐"
    },
    {
        title: "Протоколы FIGO/NICE",
        description: "Встроенные обучающие модули и подсказки, соответствующие международным клиническим рекомендациям.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "📚"
    },
    {
        title: "Улучшение Навыков на 95%",
        description: "Доказанное повышение точности интерпретации КТГ и скорости принятия решений.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "🎯"
    },
    {
        title: "Полный Дебрифинг",
        description: "Мгновенный отчет о принятых решениях, времени реакции и клинической эффективности.",
        className: `${styles.size2x1} ${styles.bentoBlock}`,
        icon: "📊"
    },
    {
        title: "Мультиплатформенный Доступ",
        description: "Облачная технология. Работайте на ПК, планшете или смартфоне без установки тяжелого ПО.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "💻"
    },
    {
        title: "Протоколы FIGO/NICE",
        description: "Встроенные обучающие модули и подсказки, соответствующие международным клиническим рекомендациям.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "📑"
    },
];

const FeatureCard = ({ title, description, className, icon, href, isPrimary, isSecondary }) => {
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
                    СИМУЛЯЦИЯ ФЕТАЛЬНОГО МОНИТОРА
                </h1>
                <p className={styles.subtitle}>
                    Точность. Доступность. Результат.
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
