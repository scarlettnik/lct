import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const useCSVData = (filePath) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
                }
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsedData = results.data.map((item) => ({
                            time_sec: item.time_sec,
                            value: item.value,
                        }));
                        setData(parsedData);
                        setLoading(false);
                    },
                    error: (err) => {
                        setError(err.message);
                        setLoading(false);
                    }
                });

            } catch (e) {
                setError(e.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [filePath]);

    return { data, loading, error };
};

export default useCSVData;