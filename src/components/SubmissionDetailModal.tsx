import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileDown, 
  Printer, 
  X, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award, 
  Calendar, 
  Clock, 
  User, 
  GraduationCap, 
  Hash,
  Loader2
} from 'lucide-react';
import { StudentResult, Question, QuizQuestionDetail } from '../types';
import { exportSubmissionToPdf, printSubmissionSheet } from '../utils/pdfExport';

interface Props {
  result: StudentResult;
  questions?: Question[];
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const SubmissionDetailModal: React.FC<Props> = ({
  result,
  questions = [],
  onClose,
  theme = 'light',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const printSheetRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const isOther = result.participantType === 'other' || 
    (!result.studentCode && (result.studentClass === 'Khác' || !result.studentClass));

  // Chuẩn hóa danh sách chi tiết các câu hỏi
  // Nếu result.quizDetails đã có từ Supabase/App thì dùng luôn, nếu chưa có thì tái tạo từ questions và answers
  const submissionDetails: QuizQuestionDetail[] = React.useMemo(() => {
    if (result.quizDetails && Array.isArray(result.quizDetails) && result.quizDetails.length > 0) {
      return result.quizDetails;
    }

    if (questions && questions.length > 0) {
      return questions.map(q => {
        const selected = result.answers[q.id] !== undefined ? result.answers[q.id] : -1;
        return {
          id: q.id,
          question: q.question,
          imageUrl: q.imageUrl,
          options: q.options,
          optionImages: q.optionImages,
          correctAnswer: q.correctAnswer,
          selectedAnswer: selected,
          isCorrect: selected === q.correctAnswer,
        };
      });
    }

    // Trường hợp dự phòng nếu không có danh sách câu hỏi
    return Object.entries(result.answers || {}).map(([qId, ansIdx]) => ({
      id: Number(qId),
      question: `Câu hỏi số ${qId}`,
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctAnswer: 0,
      selectedAnswer: Number(ansIdx),
      isCorrect: true,
    }));
  }, [result, questions]);

  const [exportNotice, setExportNotice] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

  const handleDownloadPdf = async () => {
    if (!printSheetRef.current || isExporting) return;
    setIsExporting(true);
    setExportNotice(null);
    try {
      await exportSubmissionToPdf(printSheetRef.current, result.name, result.studentClass || 'Chung');
      setExportNotice({
        type: 'success',
        message: 'Đã tạo và tải file PDF bài làm thành công!',
      });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.warn('Lỗi khi xuất PDF:', err);
      setExportNotice({
        type: 'warning',
        message: 'Đang mở hộp thoại in để bạn có thể chọn "Lưu dưới dạng PDF" hoặc in trực tiếp.',
      });
      setTimeout(() => setExportNotice(null), 6000);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printSubmissionSheet(printSheetRef.current || undefined);
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Top Bar (Ẩn khi in ấn) */}
        <div className={`p-4 sm:px-6 flex items-center justify-between border-b print:hidden ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div>
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
              <GraduationCap className={isDark ? 'text-teal-400' : 'text-teal-600'} size={22} />
              Xem bài làm - Chi Tiết Kết Quả
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Họ tên: <b className={isDark ? 'text-slate-200' : 'text-slate-700'}>{result.name}</b> 
              {!isOther && result.studentClass ? ` - Lớp: ${result.studentClass}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút "Tải PDF" màu xanh ngọc */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/25 cursor-pointer disabled:opacity-50 transition-all"
              title="Tải toàn bộ bài làm dưới dạng file PDF"
            >
              {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
              <span>{isExporting ? 'Đang xuất PDF...' : 'Tải PDF'}</span>
            </button>

            {/* Nút "In bài làm" màu trắng/xám */}
            <button
              type="button"
              onClick={handlePrint}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all ${
                isDark 
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200' 
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title="In trực tiếp hoặc Lưu dạng PDF bằng trình duyệt"
            >
              <Printer size={15} />
              <span>In bài làm</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Thông báo kết quả xuất PDF */}
        {exportNotice && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b print:hidden ${
            exportNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
          }`}>
            <span>{exportNotice.message}</span>
            <button
              type="button"
              onClick={() => setExportNotice(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white ml-2 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/60 print:bg-white print:p-0 print:overflow-visible">
          {/* Printable Sheet (Background trắng, tiêu chuẩn tài liệu để xuất PDF và in ấn chuẩn xác) */}
          <div
            ref={printSheetRef}
            id="printable-submission-sheet"
            className="w-full max-w-[800px] mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200 print:shadow-none print:border-none print:p-6 print:rounded-none"
            style={{ minHeight: '100%' }}
          >
            {/* Header Trường & Tiêu đề */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-600 gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-lch.png"
                  alt="Logo Trường Tiểu học Lý Cảnh Hớn"
                  className="w-14 h-14 object-contain rounded-full border border-emerald-500 shadow-sm"
                />
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    TRƯỜNG TIỂU HỌC LÝ CẢNH HỚN
                  </h3>
                  <h1 className="text-lg sm:text-xl font-black text-emerald-800 leading-tight">
                    PHIẾU KẾT QUẢ BÀI LÀM
                  </h1>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Hệ thống thử thách trực tuyến
                  </p>
                </div>
              </div>
            </div>

            {/* Khung Thông Tin Thí Sinh */}
            <div className="my-5 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider mb-2.5 flex items-center gap-1.5">
                <User size={14} className="text-emerald-600" />
                Thông Tin Thí Sinh & Kết Quả
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
                <div>
                  <span className="text-slate-500">Họ và tên:</span>{' '}
                  <b className="text-slate-900 text-sm font-black">{result.name}</b>
                </div>

                {!isOther && (
                  <div>
                    <span className="text-slate-500">Lớp:</span>{' '}
                    <b className="text-slate-800 font-bold">{result.studentClass || 'N/A'}</b>
                  </div>
                )}

                {!isOther && result.studentCode && (
                  <div>
                    <span className="text-slate-500">STT / Mã số:</span>{' '}
                    <b className="text-slate-800 font-mono font-bold">{result.studentCode}</b>
                  </div>
                )}

                {isOther && (
                  <div>
                    <span className="text-slate-500">Đối tượng:</span>{' '}
                    <b className="text-slate-800 font-bold">Khách / Tự do</b>
                  </div>
                )}

                <div>
                  <span className="text-slate-500">Thời gian nộp:</span>{' '}
                  <span className="text-slate-800 font-semibold">{result.submittedAt}</span>
                </div>

                {result.timeSpentFormatted && (
                  <div>
                    <span className="text-slate-500">Thời gian làm:</span>{' '}
                    <span className="text-slate-800 font-bold">⏱️ {result.timeSpentFormatted}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-500">Điểm số:</span>{' '}
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs">
                    {result.score}/{result.total} câu ({result.percentage}%)
                  </span>
                </div>

                {!isOther && result.evaluation && (
                  <div>
                    <span className="text-slate-500">Xếp loại:</span>{' '}
                    <b className="text-emerald-700 font-black">{result.evaluation}</b>
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết từng câu hỏi */}
            <div className="space-y-4 my-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  Chi Tiết Câu Hỏi & Câu Trả Lời ({submissionDetails.length} câu)
                </h4>
                <div className="text-xs text-slate-500 font-semibold">
                  Đúng: <b className="text-emerald-600">{result.score}</b> / Sai:{' '}
                  <b className="text-rose-600">{result.total - result.score}</b>
                </div>
              </div>

              {submissionDetails.map((detail, idx) => {
                const isAnswered = detail.selectedAnswer !== -1 && detail.selectedAnswer !== undefined;
                const isCorrect = isAnswered && detail.selectedAnswer === detail.correctAnswer;

                return (
                  <div
                    key={detail.id || idx}
                    className={`p-4 rounded-xl border text-xs transition-colors break-inside-avoid print:break-inside-avoid ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isAnswered
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    {/* Header câu hỏi */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-black text-[11px] shrink-0 ${
                          isCorrect 
                            ? 'bg-emerald-600 text-white' 
                            : isAnswered 
                            ? 'bg-rose-600 text-white' 
                            : 'bg-slate-400 text-white'
                        }`}>
                          Câu {idx + 1}
                        </span>
                        <div className="font-bold text-slate-800 text-[13px] leading-relaxed">
                          {detail.question}
                        </div>
                      </div>

                      {/* Trạng thái đúng/sai */}
                      <div className="shrink-0">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Đúng
                          </span>
                        ) : isAnswered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800">
                            <XCircle size={13} className="text-rose-600" /> Sai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-600">
                            <HelpCircle size={13} className="text-slate-500" /> Chưa làm
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ảnh minh họa nếu có */}
                    {detail.imageUrl && (
                      <div className="my-2 max-w-sm rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={detail.imageUrl}
                          alt={`Minh họa câu ${idx + 1}`}
                          className="w-full max-h-48 object-contain bg-slate-50"
                        />
                      </div>
                    )}

                    {/* Danh sách 4 phương án */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2.5">
                      {detail.options.map((opt, optIdx) => {
                        const isStudentChoice = detail.selectedAnswer === optIdx;
                        const isTheCorrectChoice = detail.correctAnswer === optIdx;

                        let cardStyle = 'border-slate-200 bg-white text-slate-700';
                        if (isStudentChoice && isCorrect) {
                          cardStyle = 'border-emerald-500 bg-emerald-100/70 text-emerald-950 font-bold ring-1 ring-emerald-500';
                        } else if (isStudentChoice && !isCorrect) {
                          cardStyle = 'border-rose-400 bg-rose-100/70 text-rose-950 font-bold ring-1 ring-rose-400';
                        } else if (isTheCorrectChoice) {
                          cardStyle = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold border-dashed';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${cardStyle}`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isStudentChoice && isCorrect
                                ? 'bg-emerald-600 text-white'
                                : isStudentChoice && !isCorrect
                                ? 'bg-rose-600 text-white'
                                : isTheCorrectChoice
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {optionLabels[optIdx]}
                            </span>
                            <div className="flex-1">
                              <span>{opt}</span>
                              {isStudentChoice && (
                                <span className={`ml-2 text-[10px] font-black ${
                                  isCorrect ? 'text-emerald-700' : 'text-rose-700'
                                }`}>
                                  (Thí sinh chọn)
                                </span>
                              )}
                              {!isStudentChoice && isTheCorrectChoice && (
                                <span className="ml-2 text-[10px] font-black text-emerald-700">
                                  (Đáp án đúng)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tóm tắt lựa chọn */}
                    <div className="pt-1.5 border-t border-slate-200/80 text-[11px] flex items-center justify-between text-slate-500">
                      <div>
                        Thí sinh chọn:{' '}
                        <b className={isCorrect ? 'text-emerald-700' : isAnswered ? 'text-rose-700' : 'text-slate-500'}>
                          {isAnswered ? `${optionLabels[detail.selectedAnswer]}. ${detail.options[detail.selectedAnswer]}` : 'Chưa chọn'}
                        </b>
                      </div>
                      {!isCorrect && (
                        <div>
                          Đáp án đúng:{' '}
                          <b className="text-emerald-700">
                            {optionLabels[detail.correctAnswer]}. {detail.options[detail.correctAnswer]}
                          </b>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className={`p-3 sm:px-6 flex items-center justify-between border-t print:hidden ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="text-xs text-slate-400">
            Tổng cộng: <b className="text-emerald-600">{result.score}</b> / {result.total} câu đúng ({result.percentage}%)
          </div>
        </div>
      </motion.div>
    </div>
  );
};
