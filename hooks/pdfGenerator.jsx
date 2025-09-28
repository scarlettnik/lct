import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdfFromHtml = async (elementRef, fileNamePrefix = 'Report') => {
    if (!elementRef) {
        console.error("DOM-элемент для генерации PDF не найден.");
        return;
    }

    try {
        const canvas = await html2canvas(elementRef, {
            scale: 2, // Увеличение масштаба для лучшего качества
            useCORS: true,
            allowTaint: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight > pdfHeight ? pdfHeight : imgHeight);

        const timestamp = new Date().toISOString().slice(0, 10);
        pdf.save(`${fileNamePrefix}_${timestamp}.pdf`);

    } catch (error) {
        console.error("Ошибка при генерации PDF:", error);
        alert("Произошла ошибка при генерации PDF.");
    }
};