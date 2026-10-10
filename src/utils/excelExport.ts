import * as XLSX from 'xlsx';
import { StudentResult } from '../types';

export const getEvaluationText = (score: number, total: number = 20): string => {
  const percentage = (score / total) * 100;
  if (percentage >= 90) return 'Xuất sắc 🌟';
  if (percentage >= 75) return 'Giỏi 🥇';
  if (percentage >= 60) return 'Khá 🥈';
  if (percentage >= 50) return 'Trung bình 🥉';
  return 'Cần cố gắng 📚';
};

export const exportToExcel = (
  data: StudentResult[], 
  filename: string = 'Danh_Sach_Ket_Qua_On_Tap.xlsx'
) => {
  if (!data || data.length === 0) return;

  const formattedData = data.map((item, index) => ({
    'STT': index + 1,
    'Số thứ tự / Mã số': item.studentCode || '',
    'Họ và tên học sinh': item.name,
    'Lớp': item.studentClass,
    'Điểm số': `${item.score}/${item.total}`,
    'Số câu đúng': item.score,
    'Tổng số câu': item.total,
    'Tỷ lệ đúng (%)': `${item.percentage}%`,
    'Xếp loại': item.evaluation,
    'Thời gian nộp bài': item.submittedAt
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  // Set explicit column widths for beautiful layout
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Số thứ tự / Mã số
    { wch: 25 }, // Họ tên
    { wch: 12 }, // Lớp
    { wch: 12 }, // Điểm số
    { wch: 12 }, // Câu đúng
    { wch: 12 }, // Tổng
    { wch: 15 }, // Tỷ lệ %
    { wch: 18 }, // Xếp loại
    { wch: 22 }, // Thời gian
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả ôn tập');
  XLSX.writeFile(workbook, filename);
};

export const exportSingleResultToExcel = (result: StudentResult) => {
  const filename = `Ket_Qua_${result.name.replace(/\s+/g, '_')}_${result.studentClass}.xlsx`;
  exportToExcel([result], filename);
};
