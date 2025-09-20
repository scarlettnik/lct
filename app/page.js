"use client";

import { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import useCSVData from '../hooks/useCSVparse';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const generateChartOptions = (chartTitle, yAxisTitle, yMin, yMax, currentTime) => {
  const roundedTime = Math.round(currentTime);
  const xMin = Math.round(Math.max(0, roundedTime - 60));
  const xMax = xMin + 60;

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: chartTitle,
        color: 'white',
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItem) => `Время: ${tooltipItem[0].label} сек.`,
          label: (tooltipItem) => `${yAxisTitle.split(' ')[0]}: ${tooltipItem.raw}`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Время (сек)', color: 'white' },
        ticks: {
          color: 'white',
          stepSize: 10,
        },
        grid: { color: 'rgba(255, 255, 255, 0.2)' },
        min: xMin,
        max: xMax,
      },
      y: {
        title: { display: true, text: yAxisTitle, color: 'white' },
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.2)' },
        min: yMin,
        max: yMax,
      },
    },
    elements: {
      point: { radius: 0, hitRadius: 5, hoverRadius: 5 },
    },
  };
};

export default function Home() {
  const { data: heartRateData, loading: hrLoading, error: hrError } = useCSVData('/data/bpm_test.csv');
  const { data: toneData, loading: toneLoading, error: toneError } = useCSVData('/data/iterus_test.csv');

  // Создаем единую временную переменную для синхронизации
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (hrLoading || toneLoading) return;

    // Если данные загружены, начинаем отсчет времени
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const interval = setInterval(() => {
      // Обновляем прошедшее время
      const timeElapsed = (performance.now() - startTimeRef.current) / 1000;
      setElapsedTime(timeElapsed);

      // Останавливаем таймер, когда данные закончатся
      const maxTime = Math.max(
          heartRateData[heartRateData.length - 1]?.time_sec || 0,
          toneData[toneData.length - 1]?.time_sec || 0
      );
      if (timeElapsed >= maxTime) {
        clearInterval(interval);
      }
    }, 100); // Интервал для обновления

    return () => clearInterval(interval);
  }, [heartRateData, toneData, hrLoading, toneLoading]);

  // Вычисляем индекс данных на основе прошедшего времени
  const heartRateIndex = heartRateData.findIndex(d => d.time_sec >= elapsedTime);
  const toneIndex = toneData.findIndex(d => d.time_sec >= elapsedTime);

  if (hrLoading || toneLoading) {
    return (
        <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          Загрузка данных...
        </div>
    );
  }

  if (hrError || toneError) {
    return (
        <div style={{ color: 'red', textAlign: 'center', minHeight: '100vh', backgroundColor: '#000' }}>
          Ошибка при загрузке данных: {hrError || toneError}
        </div>
    );
  }

  // Обновляем данные для графиков, используя вычисленные индексы
  const heartRateChartData = {
    datasets: [
      {
        data: heartRateData.slice(0, heartRateIndex !== -1 ? heartRateIndex + 1 : heartRateData.length).map(d => ({ x: d.time_sec, y: d.value })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const toneChartData = {
    datasets: [
      {
        data: toneData.slice(0, toneIndex !== -1 ? toneIndex + 1 : toneData.length).map(d => ({ x: d.time_sec, y: d.value })),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const heartRateOptions = generateChartOptions(
      'Частота сердечных сокращений (ЧСС)',
      'Удары в минуту',
      70,
      230,
      elapsedTime
  );

  const toneOptions = generateChartOptions(
      'Маточный тонус',
      'Тонус',
      0,
      100,
      elapsedTime
  );

  return (
      <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', padding: '1rem' }}>
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'left' }}>
          <div style={{ height: '40vh', width: '70vw' }}>
            <Line options={heartRateOptions} data={heartRateChartData} />
          </div>
          <div style={{ height: '40vh', width: '70vw' }}>
            <Line options={toneOptions} data={toneChartData} />
          </div>
        </main>
      </div>
  );
}