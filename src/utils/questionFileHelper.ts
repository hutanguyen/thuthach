import * as XLSX from 'xlsx';
import { Question } from '../types';

export interface ParseResult {
  success: boolean;
  questions: Question[];
  warnings: string[];
  error?: string;
}

/**
 * Downloads a standard Excel (.xlsx) template for importing questions
 */
export const downloadQuestionTemplateExcel = () => {
  const sampleData = [
    {
      'STT': 1,
      'Câu hỏi': 'Thủ đô của Việt Nam là gì?',
      'Đáp án A': 'TP. Hồ Chí Minh',
      'Đáp án B': 'Huế',
      'Đáp án C': 'Đà Nẵng',
      'Đáp án D': 'Hà Nội',
      'Đáp án đúng (A/B/C/D)': 'D'
    },
    {
      'STT': 2,
      'Câu hỏi': 'Công thức hóa học của nước là gì?',
      'Đáp án A': 'CO2',
      'Đáp án B': 'O2',
      'Đáp án C': 'H2O',
      'Đáp án D': 'NaCl',
      'Đáp án đúng (A/B/C/D)': 'C'
    },
    {
      'STT': 3,
      'Câu hỏi': 'Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?',
      'Đáp án A': 'Sao Thủy',
      'Đáp án B': 'Sao Kim',
      'Đáp án C': 'Trái Đất',
      'Đáp án D': 'Sao Hỏa',
      'Đáp án đúng (A/B/C/D)': 'A'
    },
    {
      'STT': 4,
      'Câu hỏi': 'Ai là tác giả của tác phẩm "Truyện Kiều"?',
      'Đáp án A': 'Hồ Xuân Hương',
      'Đáp án B': 'Nguyễn Du',
      'Đáp án C': 'Chu Văn An',
      'Đáp án D': 'Đoàn Thị Điểm',
      'Đáp án đúng (A/B/C/D)': 'B'
    },
    {
      'STT': 5,
      'Câu hỏi': 'Loài động vật nào lớn nhất thế giới hiện nay?',
      'Đáp án A': 'Voi Châu Phi',
      'Đáp án B': 'Cá mập trắng',
      'Đáp án C': 'Cá voi xanh',
      'Đáp án D': 'Khủng long',
      'Đáp án đúng (A/B/C/D)': 'C'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 45 }, // Câu hỏi
    { wch: 22 }, // A
    { wch: 22 }, // B
    { wch: 22 }, // C
    { wch: 22 }, // D
    { wch: 24 }  // Đáp án đúng
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Cau_Hoi');
  XLSX.writeFile(workbook, 'Mau_File_Cau_Hoi_Trac_Nghiem.xlsx');
};

/**
 * Downloads a CSV template with UTF-8 BOM
 */
export const downloadQuestionTemplateCsv = () => {
  const csvContent = 
`STT,Câu hỏi,Đáp án A,Đáp án B,Đáp án C,Đáp án D,Đáp án đúng (A/B/C/D)
1,"Thủ đô của Việt Nam là gì?","TP. Hồ Chí Minh","Huế","Đà Nẵng","Hà Nội","D"
2,"Công thức hóa học của nước là gì?","CO2","O2","H2O","NaCl","C"
3,"Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?","Sao Thủy","Sao Kim","Trái Đất","Sao Hỏa","A"
4,"Ai là tác giả của tác phẩm ""Truyện Kiều""?","Hồ Xuân Hương","Nguyễn Du","Chu Văn An","Đoàn Thị Điểm","B"
5,"Loài động vật nào lớn nhất thế giới hiện nay?","Voi Châu Phi","Cá mập trắng","Cá voi xanh","Khủng long","C"`;

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Mau_File_Cau_Hoi_Trac_Nghiem.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parses question rows from an uploaded file (.xlsx, .xls, .csv, .json)
 */
export const parseQuestionsFromFile = async (file: File): Promise<ParseResult> => {
  const warnings: string[] = [];
  const fileName = file.name.toLowerCase();

  try {
    let rows: Record<string, unknown>[] = [];

    if (fileName.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const questionArray = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.questions) ? parsed.questions : null);

      if (questionArray) {
        // If it's already Question[]
        if (questionArray.length > 0 && typeof questionArray[0] === 'object' && 'question' in questionArray[0] && 'options' in questionArray[0]) {
          const validJsonQuestions = questionArray.map((item, idx) => ({
            id: item.id || idx + 1,
            question: String(item.question || '').trim(),
            imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
            options: Array.isArray(item.options) ? item.options.map((o: unknown) => String(o).trim()) : [],
            optionImages: Array.isArray(item.optionImages) ? item.optionImages.map((img: unknown) => typeof img === 'string' ? img : undefined) : undefined,
            correctAnswer: Number(item.correctAnswer) || 0
          })).filter(q => q.question && q.options.length >= 2);

          if (validJsonQuestions.length === 0) {
            return { success: false, questions: [], warnings: [], error: 'File JSON không chứa câu hỏi hợp lệ.' };
          }

          // Restore timer config if present in JSON backup
          if (parsed && typeof parsed.timerConfig === 'object') {
            try {
              localStorage.setItem('quiz_timer_config', JSON.stringify(parsed.timerConfig));
            } catch {}
          }

          return { success: true, questions: validJsonQuestions, warnings };
        }
        rows = questionArray;
      } else {
        return { success: false, questions: [], warnings: [], error: 'Cấu trúc file JSON phải chứa danh sách câu hỏi.' };
      }
    } else {
      // Excel (.xlsx, .xls) or .csv
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return { success: false, questions: [], warnings: [], error: 'File Excel không có trang tính nào.' };
      }

      const worksheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    }

    if (rows.length === 0) {
      return { success: false, questions: [], warnings: [], error: 'File rỗng, không tìm thấy dòng dữ liệu nào.' };
    }

    const parsedQuestions: Question[] = [];

    // Helper to find value from flexible column names
    const findField = (row: Record<string, unknown>, keywords: string[]): string => {
      const keys = Object.keys(row);
      for (const kw of keywords) {
        const foundKey = keys.find(k => k.trim().toLowerCase().includes(kw));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          const val = String(row[foundKey]).trim();
          if (val) return val;
        }
      }
      return '';
    };

    rows.forEach((row, index) => {
      const rowNum = index + 1;

      // Extract question text
      const questionText = findField(row, ['câu hỏi', 'cau hoi', 'question', 'nội dung', 'noi dung']);
      if (!questionText) {
        warnings.push(`Dòng ${rowNum}: Bỏ qua vì không có nội dung câu hỏi.`);
        return;
      }

      // Extract options A, B, C, D
      const optA = findField(row, ['đáp án a', 'dap an a', 'câu a', 'option a', 'phương án a', 'lựa chọn a', 'a:']) ||
                   (row['A'] ? String(row['A']).trim() : '') ||
                   (row['Đáp án A'] ? String(row['Đáp án A']).trim() : '');

      const optB = findField(row, ['đáp án b', 'dap an b', 'câu b', 'option b', 'phương án b', 'lựa chọn b', 'b:']) ||
                   (row['B'] ? String(row['B']).trim() : '') ||
                   (row['Đáp án B'] ? String(row['Đáp án B']).trim() : '');

      const optC = findField(row, ['đáp án c', 'dap an c', 'câu c', 'option c', 'phương án c', 'lựa chọn c', 'c:']) ||
                   (row['C'] ? String(row['C']).trim() : '') ||
                   (row['Đáp án C'] ? String(row['Đáp án C']).trim() : '');

      const optD = findField(row, ['đáp án d', 'dap an d', 'câu d', 'option d', 'phương án d', 'lựa chọn d', 'd:']) ||
                   (row['D'] ? String(row['D']).trim() : '') ||
                   (row['Đáp án D'] ? String(row['Đáp án D']).trim() : '');

      const options = [optA, optB, optC, optD].filter(Boolean);
      if (options.length < 2) {
        warnings.push(`Dòng ${rowNum}: Câu "${questionText.substring(0, 30)}..." chỉ có ít hơn 2 đáp án, đã bỏ qua.`);
        return;
      }

      // Extract correct answer
      const rawAnswer = findField(row, ['đáp án đúng', 'dap an dung', 'đáp án chính xác', 'correct', 'answer', 'key']);
      let correctIndex = 0;

      const normAns = rawAnswer.trim().toUpperCase();
      if (normAns === 'A' || normAns === '1') {
        correctIndex = 0;
      } else if (normAns === 'B' || normAns === '2') {
        correctIndex = 1;
      } else if (normAns === 'C' || normAns === '3') {
        correctIndex = 2;
      } else if (normAns === 'D' || normAns === '4') {
        correctIndex = 3;
      } else {
        // Check if rawAnswer matches any option text directly
        const matchedIdx = options.findIndex(o => o.toLowerCase() === rawAnswer.toLowerCase());
        if (matchedIdx !== -1) {
          correctIndex = matchedIdx;
        } else {
          correctIndex = 0;
          if (rawAnswer) {
            warnings.push(`Dòng ${rowNum}: Đáp án đúng "${rawAnswer}" không khớp A/B/C/D. Tạm chọn đáp án A.`);
          }
        }
      }

      // Ensure correctIndex is within bounds of options
      if (correctIndex >= options.length) {
        correctIndex = 0;
      }

      parsedQuestions.push({
        id: parsedQuestions.length + 1,
        question: questionText,
        options,
        correctAnswer: correctIndex
      });
    });

    if (parsedQuestions.length === 0) {
      return {
        success: false,
        questions: [],
        warnings,
        error: 'Không trích xuất được câu hỏi hợp lệ nào. Vui lòng kiểm tra lại cấu trúc file mẫu!'
      };
    }

    return {
      success: true,
      questions: parsedQuestions,
      warnings
    };
  } catch (err) {
    return {
      success: false,
      questions: [],
      warnings: [],
      error: `Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`
    };
  }
};
