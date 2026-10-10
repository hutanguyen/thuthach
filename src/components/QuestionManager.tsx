import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  PlusCircle, 
  UploadCloud, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Download, 
  AlertCircle,
  Check,
  X,
  FileText,
  Search,
  Sparkles,
  Copy,
  CheckSquare,
  Square,
  Plus,
  HelpCircle,
  Layers,
  RotateCcw,
  ImagePlus,
  ZoomIn,
  Timer,
  Hourglass,
  Clock
} from 'lucide-react';
import { Question, QuizTimerConfig } from '../types';
import { 
  downloadQuestionTemplateExcel, 
  parseQuestionsFromFile 
} from '../utils/questionFileHelper';
import { validateImageFile, readAndProcessImage } from '../utils/imageHelper';
import { loadTimerConfig, saveTimerConfig } from '../utils/timerStorage';
import { ImageModal } from './ImageModal';
import * as XLSX from 'xlsx';

interface Props {
  questions: Question[];
  onSaveQuestions: (newQuestions: Question[]) => void;
  onResetToDefault: () => void;
  onBack?: () => void;
  theme?: 'light' | 'dark';
  timerConfig?: QuizTimerConfig;
  onSaveTimerConfig?: (config: QuizTimerConfig) => void;
}

export const QuestionManager: React.FC<Props> = ({
  questions,
  onSaveQuestions,
  onResetToDefault,
  onBack,
  theme = 'light',
  timerConfig,
  onSaveTimerConfig,
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');

  // Timer Configuration State
  const [timerSettings, setTimerSettings] = useState<QuizTimerConfig>(() => {
    return timerConfig || loadTimerConfig();
  });

  // Manual Form State (New Question)
  const addFormRef = useRef<HTMLDivElement>(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState(0);

  // Question & Option Images for New Question
  const [newQuestionImage, setNewQuestionImage] = useState<string | null>(null);
  const [newOptImages, setNewOptImages] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined]);

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptA, setEditOptA] = useState('');
  const [editOptB, setEditOptB] = useState('');
  const [editOptC, setEditOptC] = useState('');
  const [editOptD, setEditOptD] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState(0);

  // Question & Option Images for Editing Question
  const [editQuestionImage, setEditQuestionImage] = useState<string | null>(null);
  const [editOptImages, setEditOptImages] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined]);

  // Modal for previewing full-size image
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  // Search Filter for Question list
  const [searchFilter, setSearchFilter] = useState('');

  // Bulk Selection State for Deletion
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Delete Confirmation States (Custom In-App Modals to replace blocked window.confirm)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [showConfirmDeleteSelected, setShowConfirmDeleteSelected] = useState(false);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Question[]>([]);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Helper cập nhật cài đặt đồng hồ đếm ngược
  const handleUpdateTimerConfig = (updates: Partial<QuizTimerConfig>) => {
    const updated: QuizTimerConfig = {
      ...timerSettings,
      ...updates,
    };
    setTimerSettings(updated);
    saveTimerConfig(updated);
    if (onSaveTimerConfig) {
      onSaveTimerConfig(updated);
    }
    const durationLabel = `${updated.durationMinutes} phút${updated.durationSeconds ? ` ${updated.durationSeconds} giây` : ''}`;
    showNotify(
      updated.enabled
        ? `Đã bật đồng hồ đếm ngược: ${durationLabel} (tự động nộp bài khi hết giờ)!`
        : 'Đã tắt đồng hồ đếm ngược (làm bài tự do không giới hạn thời gian)!'
    );
  };

  // Helper to validate and upload image (< 10MB, common image types)
  const handleImageUpload = async (file: File, onSuccess: (dataUrl: string) => void) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showNotify(validation.error || 'Ảnh không hợp lệ!', 'error');
      return;
    }
    try {
      const dataUrl = await readAndProcessImage(file);
      onSuccess(dataUrl);
      showNotify('Đã đính kèm ảnh thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xử lý ảnh!';
      showNotify(msg, 'error');
    }
  };

  // Scroll to Add Question Form
  const scrollToNewQuestionForm = () => {
    if (activeTab !== 'manual') {
      setActiveTab('manual');
    }
    setTimeout(() => {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Add question handler
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() && !newQuestionImage) {
      showNotify('Vui lòng nhập nội dung câu hỏi hoặc đính kèm ảnh câu hỏi!', 'error');
      return;
    }

    const rawOpts = [newOptA.trim(), newOptB.trim(), newOptC.trim(), newOptD.trim()];
    const optionItems = rawOpts.map((text, idx) => ({
      text,
      image: newOptImages[idx]
    })).filter(item => item.text || item.image);

    if (optionItems.length < 2) {
      showNotify('Vui lòng nhập tối thiểu 2 đáp án lựa chọn (A và B)!', 'error');
      return;
    }
    if (newCorrectAnswer >= optionItems.length) {
      showNotify('Đáp án đúng được chọn vượt quá số lượng đáp án đã nhập!', 'error');
      return;
    }

    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQ: Question = {
      id: nextId,
      question: newQuestionText.trim(),
      imageUrl: newQuestionImage || undefined,
      options: optionItems.map(item => item.text),
      optionImages: optionItems.some(item => !!item.image) ? optionItems.map(item => item.image) : undefined,
      correctAnswer: newCorrectAnswer,
    };

    const updated = [...questions, newQ];
    onSaveQuestions(updated);

    // Reset form
    setNewQuestionText('');
    setNewOptA('');
    setNewOptB('');
    setNewOptC('');
    setNewOptD('');
    setNewCorrectAnswer(0);
    setNewQuestionImage(null);
    setNewOptImages([undefined, undefined, undefined, undefined]);
    showNotify(`Đã thêm câu hỏi số ${updated.length} vào bộ đề thành công!`);
  };

  // Duplicate / Clone question
  const handleDuplicateQuestion = (q: Question) => {
    const nextId = questions.length > 0 ? Math.max(...questions.map(item => item.id)) + 1 : 1;
    const duplicated: Question = {
      id: nextId,
      question: `${q.question} (Bản sao)`,
      imageUrl: q.imageUrl,
      options: [...q.options],
      optionImages: q.optionImages ? [...q.optionImages] : undefined,
      correctAnswer: q.correctAnswer,
    };
    const updated = [...questions, duplicated];
    onSaveQuestions(updated);
    showNotify('Đã tạo bản sao câu hỏi thành công!');
  };

  // Start editing question
  const handleStartEdit = (q: Question) => {
    setEditingId(q.id);
    setEditQuestionText(q.question);
    setEditQuestionImage(q.imageUrl || null);
    setEditOptA(q.options[0] || '');
    setEditOptB(q.options[1] || '');
    setEditOptC(q.options[2] || '');
    setEditOptD(q.options[3] || '');
    setEditOptImages([
      q.optionImages?.[0],
      q.optionImages?.[1],
      q.optionImages?.[2],
      q.optionImages?.[3]
    ]);
    setEditCorrectAnswer(q.correctAnswer);
  };

  // Save edited question
  const handleSaveEdit = (id: number) => {
    if (!editQuestionText.trim() && !editQuestionImage) {
      showNotify('Nội dung câu hỏi hoặc ảnh câu hỏi không được để trống!', 'error');
      return;
    }

    const rawOpts = [editOptA.trim(), editOptB.trim(), editOptC.trim(), editOptD.trim()];
    const optionItems = rawOpts.map((text, idx) => ({
      text,
      image: editOptImages[idx]
    })).filter(item => item.text || item.image);

    if (optionItems.length < 2) {
      showNotify('Vui lòng nhập tối thiểu 2 đáp án!', 'error');
      return;
    }

    const safeCorrectAnswer = editCorrectAnswer >= optionItems.length ? 0 : editCorrectAnswer;

    const updated = questions.map(q => {
      if (q.id === id) {
        return {
          ...q,
          question: editQuestionText.trim(),
          imageUrl: editQuestionImage || undefined,
          options: optionItems.map(item => item.text),
          optionImages: optionItems.some(item => !!item.image) ? optionItems.map(item => item.image) : undefined,
          correctAnswer: safeCorrectAnswer,
        };
      }
      return q;
    });

    onSaveQuestions(updated);
    setEditingId(null);
    showNotify('Đã cập nhật thay đổi cho câu hỏi!');
  };

  // Delete single question - open modal
  const handleDeleteQuestion = (id: number) => {
    const targetQ = questions.find(q => q.id === id);
    if (!targetQ) return;
    setQuestionToDelete(targetQ);
  };

  // Confirm single question delete action
  const handleConfirmDeleteSingle = () => {
    if (!questionToDelete) return;
    const targetId = questionToDelete.id;
    const targetText = questionToDelete.question;
    const updated = questions.filter(q => q.id !== targetId);
    onSaveQuestions(updated);
    setSelectedIds(prev => prev.filter(selId => selId !== targetId));
    if (editingId === targetId) {
      setEditingId(null);
    }
    setQuestionToDelete(null);
    const shortLabel = targetText.length > 30 ? targetText.substring(0, 30) + '...' : targetText;
    showNotify(`Đã xóa câu hỏi "${shortLabel}" khỏi bộ đề!`);
  };

  // Toggle single selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const handleToggleSelectAll = (filteredIds: number[]) => {
    if (filteredIds.length === 0) return;
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      // Unselect all filtered
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      const newSelected = Array.from(new Set([...selectedIds, ...filteredIds]));
      setSelectedIds(newSelected);
    }
  };

  // Delete selected questions - open modal
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setShowConfirmDeleteSelected(true);
  };

  // Confirm bulk delete action
  const handleConfirmDeleteSelected = () => {
    const count = selectedIds.length;
    const updated = questions.filter(q => !selectedIds.includes(q.id));
    onSaveQuestions(updated);
    setSelectedIds([]);
    setShowConfirmDeleteSelected(false);
    showNotify(`Đã xóa thành công ${count} câu hỏi!`);
  };

  // Delete all questions - open modal
  const handleDeleteAllQuestions = () => {
    if (questions.length === 0) return;
    setShowConfirmDeleteAll(true);
  };

  // Confirm delete all action
  const handleConfirmDeleteAll = () => {
    onSaveQuestions([]);
    setSelectedIds([]);
    setShowConfirmDeleteAll(false);
    showNotify('Đã xóa toàn bộ câu hỏi trong bộ đề.');
  };

  // File upload change handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadFileName(file.name);
    setUploadError('');
    setUploadWarnings([]);
    setParsedPreview([]);

    const result = await parseQuestionsFromFile(file);
    setIsProcessingFile(false);

    if (result.success && result.questions.length > 0) {
      setParsedPreview(result.questions);
      setUploadWarnings(result.warnings);
    } else {
      setUploadError(result.error || 'Không thể trích xuất câu hỏi từ file.');
      if (result.warnings.length > 0) {
        setUploadWarnings(result.warnings);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Apply parsed questions
  const handleApplyImportedQuestions = () => {
    if (parsedPreview.length === 0) return;

    if (importMode === 'replace') {
      const normalized = parsedPreview.map((q, idx) => ({ ...q, id: idx + 1 }));
      onSaveQuestions(normalized);
      setSelectedIds([]);
      showNotify(`Đã thay thế toàn bộ thành ${normalized.length} câu hỏi mới!`);
    } else {
      const startId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
      const appending = parsedPreview.map((q, idx) => ({ ...q, id: startId + idx }));
      const merged = [...questions, ...appending];
      onSaveQuestions(merged);
      showNotify(`Đã thêm ${appending.length} câu hỏi vào danh sách (Tổng cộng: ${merged.length} câu)!`);
    }

    setParsedPreview([]);
    setUploadFileName('');
    setActiveTab('manual');
  };

  // Export current questions to Excel
  const handleExportCurrentQuestions = () => {
    if (questions.length === 0) {
      showNotify('Chưa có câu hỏi nào để xuất ra file!', 'error');
      return;
    }
    const exportData = questions.map((q, idx) => ({
      'STT': idx + 1,
      'Câu hỏi': q.question + (q.imageUrl ? ' [Có ảnh]' : ''),
      'Đáp án A': q.options[0] || (q.optionImages?.[0] ? '[Có ảnh]' : ''),
      'Đáp án B': q.options[1] || (q.optionImages?.[1] ? '[Có ảnh]' : ''),
      'Đáp án C': q.options[2] || (q.optionImages?.[2] ? '[Có ảnh]' : ''),
      'Đáp án D': q.options[3] || (q.optionImages?.[3] ? '[Có ảnh]' : ''),
      'Đáp án đúng (A/B/C/D)': String.fromCharCode(65 + q.correctAnswer)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 24 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cau_Hoi');
    XLSX.writeFile(workbook, `Bo_Cau_Hoi_Trac_Nghiem_${questions.length}_cau.xlsx`);
  };

  // Export full JSON backup including images
  const handleExportJsonBackup = () => {
    if (questions.length === 0) {
      showNotify('Chưa có câu hỏi nào để sao lưu!', 'error');
      return;
    }
    const backupPayload = {
      version: 1,
      questions,
      timerConfig: timerSettings,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_Luu_Bo_De_${questions.length}_cau_kem_cai_dat.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotify('Đã tải xuống file sao lưu đầy đủ kèm hình ảnh (.json)!');
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
    q.options.some(opt => opt.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredIds = filteredQuestions.map(q => q.id);
  const isAllFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));

  return (
    <motion.div
      key="question-manager"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className={`w-full max-w-5xl rounded-3xl shadow-2xl p-6 md:p-8 border my-auto relative transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900 border-slate-700/80 text-white shadow-cyan-950/40'
          : 'bg-white border-slate-100 text-slate-800 shadow-slate-200/50'
      }`}
    >
      {/* Toast Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-semibold text-white ${
            notification.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{notification.message}</span>
        </motion.div>
      )}

      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className={isDark ? 'text-cyan-400' : 'text-emerald-600'} size={28} />
              Quản Lý Câu Hỏi
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCurrentQuestions}
            className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'border-cyan-800 text-cyan-400 hover:bg-slate-800'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
            title="Tải bộ câu hỏi hiện tại về máy dạng Excel"
          >
            <Download size={15} />
            <span>Tải Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportJsonBackup}
            className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'border-cyan-800 text-cyan-300 hover:bg-slate-800'
                : 'border-teal-200 text-teal-700 hover:bg-teal-50'
            }`}
            title="Tải bản sao lưu kèm ảnh đầy đủ dạng JSON"
          >
            <Download size={15} />
            <span>Sao lưu đầy đủ (.json)</span>
          </button>
        </div>
      </div>

      {/* SECTION: CÀI ĐẶT THỜI GIAN LÀM BÀI (ĐỒNG HỒ ĐẾM NGƯỢC) */}
      <div className={`mt-6 p-5 sm:p-6 rounded-3xl border transition-all ${
        isDark
          ? 'bg-slate-800/80 border-slate-700 shadow-lg shadow-cyan-950/20'
          : 'bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 border-emerald-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl flex items-center justify-center ${
              timerSettings.enabled
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                : isDark
                ? 'bg-slate-700 text-slate-400'
                : 'bg-slate-100 text-slate-400'
            }`}>
              <Timer size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Cài Đặt Đồng Hồ Đếm Ngược
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  timerSettings.enabled
                    ? isDark
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : isDark
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {timerSettings.enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                </span>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Giới hạn thời gian làm bài và tự động nộp bài khi hết giờ. Có thể bật hoặc tắt tùy vào bộ đề.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <span className={`text-xs font-extrabold ${
              timerSettings.enabled
                ? isDark ? 'text-cyan-300' : 'text-emerald-700'
                : 'text-slate-400'
            }`}>
              {timerSettings.enabled ? 'Bật đếm ngược' : 'Tắt đếm ngược'}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={timerSettings.enabled}
              onClick={() => handleUpdateTimerConfig({ enabled: !timerSettings.enabled })}
              className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                timerSettings.enabled
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : isDark ? 'bg-slate-700' : 'bg-slate-300'
              }`}
              title={timerSettings.enabled ? 'Nhấn để tắt đồng hồ đếm ngược' : 'Nhấn để bật đồng hồ đếm ngược'}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center ${
                  timerSettings.enabled ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {timerSettings.enabled ? (
                  <Check size={14} className="text-emerald-600 stroke-[3]" />
                ) : (
                  <X size={14} className="text-slate-400 stroke-[3]" />
                )}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Detailed Time Settings when Enabled */}
        {timerSettings.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-5 pt-5 border-t space-y-4 ${
              isDark ? 'border-slate-700/80' : 'border-slate-200/80'
            }`}
          >
            {/* Quick Presets */}
            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                ⚡ Chọn nhanh mốc thời gian làm bài:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { mins: 1, label: '1 phút (Test nhanh)' },
                  { mins: 5, label: '5 phút' },
                  { mins: 10, label: '10 phút' },
                  { mins: 15, label: '15 phút (Tiêu chuẩn)' },
                  { mins: 20, label: '20 phút' },
                  { mins: 30, label: '30 phút' },
                  { mins: 45, label: '45 phút' },
                  { mins: 60, label: '60 phút' },
                ].map(preset => {
                  const isSelected = timerSettings.durationMinutes === preset.mins && (timerSettings.durationSeconds || 0) === 0;
                  return (
                    <button
                      key={preset.mins}
                      type="button"
                      onClick={() => handleUpdateTimerConfig({ durationMinutes: preset.mins, durationSeconds: 0 })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? isDark
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30 font-black'
                            : 'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-500/30 font-black'
                          : isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-600 hover:text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div>
                <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Tùy chỉnh số phút (1 - 180):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timerSettings.durationMinutes}
                    onChange={e => {
                      const val = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
                      handleUpdateTimerConfig({ durationMinutes: val });
                    }}
                    className={`w-24 px-3 py-2 rounded-xl border text-sm font-black text-center outline-none transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-cyan-300 focus:border-cyan-400'
                        : 'bg-white border-slate-200 text-emerald-800 focus:border-emerald-500'
                    }`}
                  />
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    phút
                  </span>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Số giây lẻ (0 - 59):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={timerSettings.durationSeconds || 0}
                    onChange={e => {
                      const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                      handleUpdateTimerConfig({ durationSeconds: val });
                    }}
                    className={`w-20 px-3 py-2 rounded-xl border text-sm font-black text-center outline-none transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-cyan-300 focus:border-cyan-400'
                        : 'bg-white border-slate-200 text-emerald-800 focus:border-emerald-500'
                    }`}
                  />
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    giây
                  </span>
                </div>
              </div>

              {/* Status summary box */}
              <div className={`flex-1 min-w-[240px] px-4 py-2.5 rounded-2xl border flex items-center gap-3 ${
                isDark ? 'bg-slate-900/90 border-cyan-900/60' : 'bg-white border-emerald-100 shadow-sm'
              }`}>
                <Hourglass size={18} className={isDark ? 'text-cyan-400' : 'text-emerald-600'} />
                <div className="text-xs">
                  <span className="font-extrabold block">
                    Thời gian làm bài: {timerSettings.durationMinutes} phút {timerSettings.durationSeconds ? `${timerSettings.durationSeconds} giây` : ''}
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    (Tổng: {timerSettings.durationMinutes * 60 + (timerSettings.durationSeconds || 0)} giây - Đồng hồ sẽ hiển thị phía trên danh sách câu hỏi và tự động nộp bài khi hết giờ)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className={`flex items-center gap-2 mt-6 p-1.5 rounded-2xl w-full sm:w-fit border ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'manual'
              ? isDark
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'bg-white text-emerald-800 shadow-sm font-black'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 size={16} />
          <span>Cách 1: Thêm / Xóa / Sửa trực tiếp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? isDark
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'bg-white text-emerald-800 shadow-sm font-black'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UploadCloud size={16} />
          <span>Cách 2: Tải lên file theo mẫu</span>
        </button>
      </div>

      {/* TAB 1: DIRECT MANUAL ADD / DELETE / EDIT */}
      {activeTab === 'manual' && (
        <div className="mt-6 space-y-8">

          {/* SECTION 1: FORM TO ADD A NEW QUESTION */}
          <div 
            ref={addFormRef}
            className={`border rounded-3xl p-5 md:p-6 transition-all ${
              isDark
                ? 'bg-slate-800/80 border-cyan-800/50 shadow-lg shadow-cyan-950/30'
                : 'bg-emerald-50/60 border-emerald-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <h2 className={`text-base font-black flex items-center gap-2 ${
                isDark ? 'text-cyan-300' : 'text-emerald-900'
              }`}>
                <PlusCircle size={20} className={isDark ? 'text-cyan-400' : 'text-emerald-600'} />
                <span>Thêm câu hỏi mới vào bộ đề</span>
              </h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Câu số #{questions.length + 1}
              </span>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Nội dung câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập nội dung câu hỏi mới (Ví dụ: 15 + 25 bằng bao nhiêu?)"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition-colors ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                      : 'bg-white border-neutral-200 text-slate-800 placeholder-neutral-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                />

                {/* Attach Question Image Section */}
                <div className="mt-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
                      isDark 
                        ? 'bg-slate-900 border-cyan-800/60 text-cyan-300 hover:bg-slate-800' 
                        : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    }`}>
                      <ImagePlus size={15} />
                      <span>{newQuestionImage ? 'Thay đổi ảnh câu hỏi' : 'Đính kèm ảnh câu hỏi'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, setNewQuestionImage);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>

                    <span className="text-[11px] text-slate-400">
                      (Dung lượng &lt; 10MB, hỗ trợ PNG, JPG, JPEG, WEBP, GIF, SVG, BMP)
                    </span>
                  </div>

                  {/* Attached Question Image Preview */}
                  {newQuestionImage && (
                    <div className={`mt-2.5 p-2.5 rounded-2xl border inline-flex items-center gap-3 ${
                      isDark ? 'bg-slate-900/90 border-cyan-800' : 'bg-white border-emerald-200 shadow-sm'
                    }`}>
                      <div 
                        onClick={() => setModalImage({ url: newQuestionImage, title: 'Ảnh minh họa câu hỏi' })}
                        className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950/20"
                        title="Bấm để xem ảnh phóng to"
                      >
                        <img
                          src={newQuestionImage}
                          alt="Ảnh câu hỏi"
                          className="h-14 w-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn size={16} />
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-600 dark:text-cyan-400 flex items-center gap-1">
                          <Check size={14} /> Đã đính kèm ảnh câu hỏi
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalImage({ url: newQuestionImage, title: 'Ảnh minh họa câu hỏi' })}
                          className="text-[11px] text-slate-400 hover:underline text-left mt-0.5"
                        >
                          Bấm để xem ảnh phóng to
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setNewQuestionImage(null)}
                        className="p-1.5 ml-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Xóa ảnh câu hỏi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Các phương án lựa chọn & Tích chọn đáp án đúng:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Có thể đính kèm ảnh riêng cho từng đáp án)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option A */}
                  <div className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                    newCorrectAnswer === 0 
                      ? isDark
                        ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-slate-900'
                        : 'border-emerald-500 ring-2 ring-emerald-200 bg-white'
                      : isDark
                      ? 'border-slate-700 bg-slate-900/60'
                      : 'border-neutral-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setNewCorrectAnswer(0)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                          newCorrectAnswer === 0 
                            ? isDark ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-emerald-600 text-white shadow'
                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                        }`}
                        title="Chọn A là đáp án đúng"
                      >
                        A
                      </button>
                      <input
                        type="text"
                        placeholder="Đáp án A (chữ hoặc ảnh)..."
                        className={`w-full text-sm outline-none bg-transparent ${isDark ? 'text-white' : 'text-slate-800'}`}
                        value={newOptA}
                        onChange={e => setNewOptA(e.target.value)}
                      />

                      {/* Attach image to option A */}
                      <label
                        className={`p-1.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 ${
                          newOptImages[0]
                            ? isDark ? 'text-cyan-400 bg-cyan-950/60' : 'text-emerald-600 bg-emerald-50'
                            : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Đính kèm ảnh cho đáp án A (< 10MB)"
                      >
                        <ImagePlus size={16} />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (dataUrl) => {
                                setNewOptImages(prev => {
                                  const next = [...prev];
                                  next[0] = dataUrl;
                                  return next;
                                });
                              });
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {newCorrectAnswer === 0 && (
                        <Check size={18} className={isDark ? 'text-cyan-400 flex-shrink-0' : 'text-emerald-600 flex-shrink-0'} />
                      )}
                    </div>

                    {/* Option A preview thumbnail */}
                    {newOptImages[0] && (
                      <div className="flex items-center gap-2 pl-10 pt-1">
                        <div
                          onClick={() => setModalImage({ url: newOptImages[0]!, title: 'Ảnh minh họa đáp án A' })}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                          title="Bấm để xem ảnh phóng to"
                        >
                          <img
                            src={newOptImages[0]}
                            alt="Ảnh đáp án A"
                            className="h-10 w-16 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn size={12} />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">Đã đính kèm ảnh</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewOptImages(prev => {
                              const next = [...prev];
                              next[0] = undefined;
                              return next;
                            });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Xóa ảnh đáp án A"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Option B */}
                  <div className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                    newCorrectAnswer === 1 
                      ? isDark
                        ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-slate-900'
                        : 'border-emerald-500 ring-2 ring-emerald-200 bg-white'
                      : isDark
                      ? 'border-slate-700 bg-slate-900/60'
                      : 'border-neutral-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setNewCorrectAnswer(1)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                          newCorrectAnswer === 1 
                            ? isDark ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-emerald-600 text-white shadow'
                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                        }`}
                        title="Chọn B là đáp án đúng"
                      >
                        B
                      </button>
                      <input
                        type="text"
                        placeholder="Đáp án B (chữ hoặc ảnh)..."
                        className={`w-full text-sm outline-none bg-transparent ${isDark ? 'text-white' : 'text-slate-800'}`}
                        value={newOptB}
                        onChange={e => setNewOptB(e.target.value)}
                      />

                      {/* Attach image to option B */}
                      <label
                        className={`p-1.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 ${
                          newOptImages[1]
                            ? isDark ? 'text-cyan-400 bg-cyan-950/60' : 'text-emerald-600 bg-emerald-50'
                            : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Đính kèm ảnh cho đáp án B (< 10MB)"
                      >
                        <ImagePlus size={16} />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (dataUrl) => {
                                setNewOptImages(prev => {
                                  const next = [...prev];
                                  next[1] = dataUrl;
                                  return next;
                                });
                              });
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {newCorrectAnswer === 1 && (
                        <Check size={18} className={isDark ? 'text-cyan-400 flex-shrink-0' : 'text-emerald-600 flex-shrink-0'} />
                      )}
                    </div>

                    {/* Option B preview thumbnail */}
                    {newOptImages[1] && (
                      <div className="flex items-center gap-2 pl-10 pt-1">
                        <div
                          onClick={() => setModalImage({ url: newOptImages[1]!, title: 'Ảnh minh họa đáp án B' })}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                          title="Bấm để xem ảnh phóng to"
                        >
                          <img
                            src={newOptImages[1]}
                            alt="Ảnh đáp án B"
                            className="h-10 w-16 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn size={12} />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">Đã đính kèm ảnh</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewOptImages(prev => {
                              const next = [...prev];
                              next[1] = undefined;
                              return next;
                            });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Xóa ảnh đáp án B"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Option C */}
                  <div className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                    newCorrectAnswer === 2 
                      ? isDark
                        ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-slate-900'
                        : 'border-emerald-500 ring-2 ring-emerald-200 bg-white'
                      : isDark
                      ? 'border-slate-700 bg-slate-900/60'
                      : 'border-neutral-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setNewCorrectAnswer(2)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                          newCorrectAnswer === 2 
                            ? isDark ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-emerald-600 text-white shadow'
                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                        }`}
                        title="Chọn C là đáp án đúng"
                      >
                        C
                      </button>
                      <input
                        type="text"
                        placeholder="Đáp án C (tùy chọn)..."
                        className={`w-full text-sm outline-none bg-transparent ${isDark ? 'text-white' : 'text-slate-800'}`}
                        value={newOptC}
                        onChange={e => setNewOptC(e.target.value)}
                      />

                      {/* Attach image to option C */}
                      <label
                        className={`p-1.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 ${
                          newOptImages[2]
                            ? isDark ? 'text-cyan-400 bg-cyan-950/60' : 'text-emerald-600 bg-emerald-50'
                            : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Đính kèm ảnh cho đáp án C (< 10MB)"
                      >
                        <ImagePlus size={16} />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (dataUrl) => {
                                setNewOptImages(prev => {
                                  const next = [...prev];
                                  next[2] = dataUrl;
                                  return next;
                                });
                              });
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {newCorrectAnswer === 2 && (
                        <Check size={18} className={isDark ? 'text-cyan-400 flex-shrink-0' : 'text-emerald-600 flex-shrink-0'} />
                      )}
                    </div>

                    {/* Option C preview thumbnail */}
                    {newOptImages[2] && (
                      <div className="flex items-center gap-2 pl-10 pt-1">
                        <div
                          onClick={() => setModalImage({ url: newOptImages[2]!, title: 'Ảnh minh họa đáp án C' })}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                          title="Bấm để xem ảnh phóng to"
                        >
                          <img
                            src={newOptImages[2]}
                            alt="Ảnh đáp án C"
                            className="h-10 w-16 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn size={12} />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">Đã đính kèm ảnh</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewOptImages(prev => {
                              const next = [...prev];
                              next[2] = undefined;
                              return next;
                            });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Xóa ảnh đáp án C"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Option D */}
                  <div className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                    newCorrectAnswer === 3 
                      ? isDark
                        ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-slate-900'
                        : 'border-emerald-500 ring-2 ring-emerald-200 bg-white'
                      : isDark
                      ? 'border-slate-700 bg-slate-900/60'
                      : 'border-neutral-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setNewCorrectAnswer(3)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                          newCorrectAnswer === 3 
                            ? isDark ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-emerald-600 text-white shadow'
                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                        }`}
                        title="Chọn D là đáp án đúng"
                      >
                        D
                      </button>
                      <input
                        type="text"
                        placeholder="Đáp án D (tùy chọn)..."
                        className={`w-full text-sm outline-none bg-transparent ${isDark ? 'text-white' : 'text-slate-800'}`}
                        value={newOptD}
                        onChange={e => setNewOptD(e.target.value)}
                      />

                      {/* Attach image to option D */}
                      <label
                        className={`p-1.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 ${
                          newOptImages[3]
                            ? isDark ? 'text-cyan-400 bg-cyan-950/60' : 'text-emerald-600 bg-emerald-50'
                            : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Đính kèm ảnh cho đáp án D (< 10MB)"
                      >
                        <ImagePlus size={16} />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (dataUrl) => {
                                setNewOptImages(prev => {
                                  const next = [...prev];
                                  next[3] = dataUrl;
                                  return next;
                                });
                              });
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {newCorrectAnswer === 3 && (
                        <Check size={18} className={isDark ? 'text-cyan-400 flex-shrink-0' : 'text-emerald-600 flex-shrink-0'} />
                      )}
                    </div>

                    {/* Option D preview thumbnail */}
                    {newOptImages[3] && (
                      <div className="flex items-center gap-2 pl-10 pt-1">
                        <div
                          onClick={() => setModalImage({ url: newOptImages[3]!, title: 'Ảnh minh họa đáp án D' })}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                          title="Bấm để xem ảnh phóng to"
                        >
                          <img
                            src={newOptImages[3]}
                            alt="Ảnh đáp án D"
                            className="h-10 w-16 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn size={12} />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">Đã đính kèm ảnh</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewOptImages(prev => {
                              const next = [...prev];
                              next[3] = undefined;
                              return next;
                            });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Xóa ảnh đáp án D"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewQuestionText('');
                    setNewOptA('');
                    setNewOptB('');
                    setNewOptC('');
                    setNewOptD('');
                    setNewCorrectAnswer(0);
                    setNewQuestionImage(null);
                    setNewOptImages([undefined, undefined, undefined, undefined]);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-sm shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Nhập lại nội dung câu hỏi"
                >
                  <RotateCcw size={14} />
                  <span>Nhập lại</span>
                </button>

                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/50'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  <PlusCircle size={18} />
                  <span>+ Thêm câu hỏi vào bộ đề</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: CURRENT QUESTIONS LIST & DELETE ACTIONS */}
          <div>
            {/* Action Bar & Search */}
            <div className={`p-4 rounded-2xl border mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              {/* Left: Bulk select and delete actions */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Select all checkbox button */}
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(filteredIds)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isAllFilteredSelected ? (
                    <CheckSquare size={16} className={isDark ? 'text-cyan-400' : 'text-emerald-600'} />
                  ) : (
                    <Square size={16} className="text-slate-400" />
                  )}
                  <span>Chọn tất cả ({filteredQuestions.length})</span>
                </button>

                {/* Bulk delete button */}
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                  >
                    <Trash2 size={15} />
                    <span>Xóa {selectedIds.length} câu đã chọn</span>
                  </button>
                )}

                {/* Clear all questions button */}
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllQuestions}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'border-rose-900/60 text-rose-400 hover:bg-rose-950/40'
                        : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                    }`}
                    title="Xóa toàn bộ câu hỏi để làm lại từ đầu"
                  >
                    <Trash2 size={14} />
                    <span>Xóa tất cả</span>
                  </button>
                )}
              </div>

              {/* Right: Search box */}
              <div className="relative w-full md:w-72">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  placeholder="Tìm câu hỏi theo nội dung..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {filteredQuestions.map((q, idx) => {
                const isEditing = editingId === q.id;
                const isSelected = selectedIds.includes(q.id);

                if (isEditing) {
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`p-5 rounded-2xl border-2 space-y-4 ${
                        isDark
                          ? 'bg-amber-950/20 border-amber-500/60 text-white'
                          : 'bg-amber-50/70 border-amber-300 text-slate-900'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-black uppercase tracking-wider ${
                          isDark ? 'text-amber-400' : 'text-amber-800'
                        }`}>
                          Đang sửa Câu #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div>
                        <label className={`block text-xs font-bold mb-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Nội dung câu hỏi:
                        </label>
                        <input
                          type="text"
                          value={editQuestionText}
                          onChange={e => setEditQuestionText(e.target.value)}
                          className={`w-full px-3.5 py-2 rounded-xl border text-sm outline-none ${
                            isDark
                              ? 'bg-slate-900 border-amber-600/70 text-white focus:ring-2 focus:ring-amber-500'
                              : 'bg-white border-amber-300 text-slate-800 focus:ring-2 focus:ring-amber-400'
                          }`}
                        />

                        {/* Edit Question Image Section */}
                        <div className="mt-2 flex flex-wrap items-center gap-2.5">
                          <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
                            isDark 
                              ? 'bg-slate-900 border-amber-600/60 text-amber-300 hover:bg-slate-800' 
                              : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'
                          }`}>
                            <ImagePlus size={14} />
                            <span>{editQuestionImage ? 'Thay đổi ảnh câu hỏi' : 'Đính kèm ảnh câu hỏi'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(file, setEditQuestionImage);
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>

                          {editQuestionImage && (
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => setModalImage({ url: editQuestionImage, title: 'Ảnh minh họa câu hỏi' })}
                                className="relative group cursor-pointer overflow-hidden rounded-lg border border-amber-400 dark:border-amber-600"
                                title="Bấm để xem ảnh phóng to"
                              >
                                <img
                                  src={editQuestionImage}
                                  alt="Ảnh câu hỏi"
                                  className="h-9 w-14 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn size={12} />
                                </div>
                              </div>
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Đã có ảnh</span>
                              <button
                                type="button"
                                onClick={() => setEditQuestionImage(null)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Xóa ảnh câu hỏi"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Edit Opt A */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                          editCorrectAnswer === 0 
                            ? isDark ? 'border-cyan-400 bg-slate-900' : 'border-emerald-500 bg-white ring-1 ring-emerald-200'
                            : isDark ? 'border-slate-700 bg-slate-900/60' : 'border-neutral-200 bg-white'
                        }`}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditCorrectAnswer(0)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                editCorrectAnswer === 0 
                                  ? isDark ? 'bg-cyan-500 text-slate-950' : 'bg-emerald-600 text-white'
                                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              A
                            </button>
                            <input
                              type="text"
                              value={editOptA}
                              onChange={e => setEditOptA(e.target.value)}
                              className="w-full text-xs outline-none bg-transparent"
                              placeholder="Đáp án A (chữ hoặc ảnh)"
                            />

                            <label
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
                              title="Đính kèm ảnh cho đáp án A"
                            >
                              <ImagePlus size={14} />
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, (dataUrl) => {
                                      setEditOptImages(prev => {
                                        const next = [...prev];
                                        next[0] = dataUrl;
                                        return next;
                                      });
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          {editOptImages[0] && (
                            <div className="flex items-center gap-2 pl-8">
                              <div
                                onClick={() => setModalImage({ url: editOptImages[0]!, title: 'Ảnh đáp án A' })}
                                className="relative group cursor-pointer overflow-hidden rounded-md border border-slate-300 dark:border-slate-700"
                              >
                                <img src={editOptImages[0]} alt="Đáp án A" className="h-8 w-12 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn size={10} />
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400">Ảnh A</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditOptImages(prev => {
                                    const next = [...prev];
                                    next[0] = undefined;
                                    return next;
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Edit Opt B */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                          editCorrectAnswer === 1 
                            ? isDark ? 'border-cyan-400 bg-slate-900' : 'border-emerald-500 bg-white ring-1 ring-emerald-200'
                            : isDark ? 'border-slate-700 bg-slate-900/60' : 'border-neutral-200 bg-white'
                        }`}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditCorrectAnswer(1)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                editCorrectAnswer === 1 
                                  ? isDark ? 'bg-cyan-500 text-slate-950' : 'bg-emerald-600 text-white'
                                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              B
                            </button>
                            <input
                              type="text"
                              value={editOptB}
                              onChange={e => setEditOptB(e.target.value)}
                              className="w-full text-xs outline-none bg-transparent"
                              placeholder="Đáp án B (chữ hoặc ảnh)"
                            />

                            <label
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
                              title="Đính kèm ảnh cho đáp án B"
                            >
                              <ImagePlus size={14} />
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, (dataUrl) => {
                                      setEditOptImages(prev => {
                                        const next = [...prev];
                                        next[1] = dataUrl;
                                        return next;
                                      });
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          {editOptImages[1] && (
                            <div className="flex items-center gap-2 pl-8">
                              <div
                                onClick={() => setModalImage({ url: editOptImages[1]!, title: 'Ảnh đáp án B' })}
                                className="relative group cursor-pointer overflow-hidden rounded-md border border-slate-300 dark:border-slate-700"
                              >
                                <img src={editOptImages[1]} alt="Đáp án B" className="h-8 w-12 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn size={10} />
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400">Ảnh B</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditOptImages(prev => {
                                    const next = [...prev];
                                    next[1] = undefined;
                                    return next;
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Edit Opt C */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                          editCorrectAnswer === 2 
                            ? isDark ? 'border-cyan-400 bg-slate-900' : 'border-emerald-500 bg-white ring-1 ring-emerald-200'
                            : isDark ? 'border-slate-700 bg-slate-900/60' : 'border-neutral-200 bg-white'
                        }`}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditCorrectAnswer(2)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                editCorrectAnswer === 2 
                                  ? isDark ? 'bg-cyan-500 text-slate-950' : 'bg-emerald-600 text-white'
                                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              C
                            </button>
                            <input
                              type="text"
                              value={editOptC}
                              onChange={e => setEditOptC(e.target.value)}
                              className="w-full text-xs outline-none bg-transparent"
                              placeholder="Đáp án C (tùy chọn)"
                            />

                            <label
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
                              title="Đính kèm ảnh cho đáp án C"
                            >
                              <ImagePlus size={14} />
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, (dataUrl) => {
                                      setEditOptImages(prev => {
                                        const next = [...prev];
                                        next[2] = dataUrl;
                                        return next;
                                      });
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          {editOptImages[2] && (
                            <div className="flex items-center gap-2 pl-8">
                              <div
                                onClick={() => setModalImage({ url: editOptImages[2]!, title: 'Ảnh đáp án C' })}
                                className="relative group cursor-pointer overflow-hidden rounded-md border border-slate-300 dark:border-slate-700"
                              >
                                <img src={editOptImages[2]} alt="Đáp án C" className="h-8 w-12 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn size={10} />
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400">Ảnh C</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditOptImages(prev => {
                                    const next = [...prev];
                                    next[2] = undefined;
                                    return next;
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Edit Opt D */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                          editCorrectAnswer === 3 
                            ? isDark ? 'border-cyan-400 bg-slate-900' : 'border-emerald-500 bg-white ring-1 ring-emerald-200'
                            : isDark ? 'border-slate-700 bg-slate-900/60' : 'border-neutral-200 bg-white'
                        }`}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditCorrectAnswer(3)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                editCorrectAnswer === 3 
                                  ? isDark ? 'bg-cyan-500 text-slate-950' : 'bg-emerald-600 text-white'
                                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              D
                            </button>
                            <input
                              type="text"
                              value={editOptD}
                              onChange={e => setEditOptD(e.target.value)}
                              className="w-full text-xs outline-none bg-transparent"
                              placeholder="Đáp án D (tùy chọn)"
                            />

                            <label
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
                              title="Đính kèm ảnh cho đáp án D"
                            >
                              <ImagePlus size={14} />
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, (dataUrl) => {
                                      setEditOptImages(prev => {
                                        const next = [...prev];
                                        next[3] = dataUrl;
                                        return next;
                                      });
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          {editOptImages[3] && (
                            <div className="flex items-center gap-2 pl-8">
                              <div
                                onClick={() => setModalImage({ url: editOptImages[3]!, title: 'Ảnh đáp án D' })}
                                className="relative group cursor-pointer overflow-hidden rounded-md border border-slate-300 dark:border-slate-700"
                              >
                                <img src={editOptImages[3]} alt="Đáp án D" className="h-8 w-12 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn size={10} />
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400">Ảnh D</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditOptImages(prev => {
                                    const next = [...prev];
                                    next[3] = undefined;
                                    return next;
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(q.id)}
                          className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start gap-4 ${
                      isSelected
                        ? isDark
                          ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500'
                          : 'bg-emerald-50/50 border-emerald-400 ring-1 ring-emerald-300'
                        : isDark
                        ? 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600'
                        : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-grow">
                      {/* Checkbox for selection */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(q.id)}
                        className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        title={isSelected ? 'Bỏ chọn câu này' : 'Chọn câu này'}
                      >
                        {isSelected ? (
                          <CheckSquare size={19} className={isDark ? 'text-cyan-400' : 'text-emerald-600'} />
                        ) : (
                          <Square size={19} />
                        )}
                      </button>

                      <div className="flex-grow space-y-2">
                        <div className="flex items-start gap-2.5">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isDark
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {idx + 1}
                          </span>
                          <h3 className={`font-bold text-sm leading-snug ${
                            isDark ? 'text-slate-100' : 'text-slate-800'
                          }`}>
                            {q.question}
                          </h3>
                        </div>

                        {/* Question Image (if attached) */}
                        {q.imageUrl && (
                          <div className="pl-8 pt-1">
                            <div
                              onClick={() => setModalImage({ url: q.imageUrl!, title: `Ảnh minh họa câu hỏi #${idx + 1}` })}
                              className="relative group cursor-pointer inline-flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm"
                              title="Bấm để xem ảnh phóng to"
                            >
                              <img
                                src={q.imageUrl}
                                alt={`Ảnh câu hỏi #${idx + 1}`}
                                className="h-16 w-auto object-contain bg-slate-900/10 dark:bg-slate-900/60 p-0.5"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                <ZoomIn size={13} />
                                <span>Phóng to</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Display options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correctAnswer === optIdx;
                            const optImg = q.optionImages?.[optIdx];
                            return (
                              <div
                                key={optIdx}
                                className={`text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-2 ${
                                  isCorrect
                                    ? isDark
                                      ? 'bg-cyan-950/70 text-cyan-300 font-bold border border-cyan-800'
                                      : 'bg-emerald-100/90 text-emerald-900 font-bold border border-emerald-300'
                                    : isDark
                                    ? 'bg-slate-900/60 text-slate-400 border border-slate-700/60'
                                    : 'bg-slate-50 text-slate-600 border border-slate-100'
                                }`}
                              >
                                <span className="font-extrabold w-4 text-center">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                {optImg && (
                                  <div
                                    onClick={() => setModalImage({ url: optImg, title: `Ảnh đáp án ${String.fromCharCode(65 + optIdx)} - Câu #${idx + 1}` })}
                                    className="relative group cursor-pointer overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 flex-shrink-0"
                                    title="Bấm để xem ảnh phóng to"
                                  >
                                    <img src={optImg} alt={`Đáp án ${String.fromCharCode(65 + optIdx)}`} className="h-7 w-11 object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <ZoomIn size={10} />
                                    </div>
                                  </div>
                                )}
                                <span className="flex-grow truncate">{opt || (optImg ? '(Hình ảnh)' : '')}</span>
                                {isCorrect && (
                                  <Check size={14} className={isDark ? 'text-cyan-400 flex-shrink-0' : 'text-emerald-700 flex-shrink-0'} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit, Duplicate, Delete */}
                    <div className="flex items-center gap-1 self-end sm:self-center flex-shrink-0 pl-8 sm:pl-0">
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(q)}
                        className={`p-2 rounded-xl transition-colors ${
                          isDark
                            ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-700'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title="Chỉnh sửa câu hỏi này"
                      >
                        <Edit3 size={17} />
                      </button>

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(q)}
                        className={`p-2 rounded-xl transition-colors ${
                          isDark
                            ? 'text-slate-400 hover:text-amber-300 hover:bg-slate-700'
                            : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                        }`}
                        title="Nhân bản / Tạo bản sao câu hỏi này"
                      >
                        <Copy size={17} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isDark
                            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Xóa câu hỏi này khỏi bộ đề"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Empty search state */}
              {questions.length > 0 && filteredQuestions.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Không tìm thấy câu hỏi nào phù hợp với từ khóa &ldquo;{searchFilter}&rdquo;.
                </div>
              )}

              {/* Zero questions empty state */}
              {questions.length === 0 && (
                <div className={`text-center py-12 px-6 rounded-3xl border-2 border-dashed ${
                  isDark ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  <Layers size={40} className="mx-auto mb-3 opacity-40" />
                  <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Bộ đề hiện chưa có câu hỏi nào
                  </h3>
                  <p className="text-xs max-w-md mx-auto mb-5">
                    Hãy thêm câu hỏi mới bằng form bên trên, khôi phục lại bộ 20 câu hỏi mẫu có sẵn hoặc tải lên file câu hỏi theo mẫu.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={scrollToNewQuestionForm}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                        isDark ? 'bg-cyan-500 text-slate-950' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <Plus size={16} />
                      <span>Thêm câu hỏi ngay</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD FILE VIA TEMPLATE */}
      {activeTab === 'upload' && (
        <div className="mt-6 space-y-6">
          {/* Step 1: Download Templates */}
          <div className={`p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-emerald-50/70 border-emerald-100'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? 'text-cyan-300' : 'text-emerald-950'
                }`}>
                  <FileSpreadsheet size={18} className={isDark ? 'text-cyan-400' : 'text-emerald-600'} />
                  Bước 1: Tải file mẫu chuẩn để soạn câu hỏi
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  File mẫu gồm các cột: <strong>STT</strong>, <strong>Câu hỏi</strong>, <strong>Đáp án A</strong>, <strong>Đáp án B</strong>, <strong>Đáp án C</strong>, <strong>Đáp án D</strong>, và <strong>Đáp án đúng (A/B/C/D)</strong>.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadQuestionTemplateExcel}
                  className={`px-4 py-2 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/40'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  <Download size={15} />
                  <span>Tải mẫu Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Template preview table info */}
            <div className={`mt-4 overflow-x-auto rounded-xl border ${
              isDark ? 'border-slate-700 bg-slate-900/80' : 'border-emerald-200/70 bg-white'
            }`}>
              <table className="w-full text-xs text-left">
                <thead className={isDark ? 'bg-slate-800 text-cyan-300 font-bold' : 'bg-emerald-100/50 text-emerald-900 font-bold'}>
                  <tr>
                    <th className="p-2 border-r border-slate-700/50 w-12 text-center">STT</th>
                    <th className="p-2 border-r border-slate-700/50">Câu hỏi</th>
                    <th className="p-2 border-r border-slate-700/50">Đáp án A</th>
                    <th className="p-2 border-r border-slate-700/50">Đáp án B</th>
                    <th className="p-2 border-r border-slate-700/50">Đáp án C</th>
                    <th className="p-2 border-r border-slate-700/50">Đáp án D</th>
                    <th className="p-2 text-center">Đáp án đúng</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-600'}`}>
                  <tr>
                    <td className="p-2 text-center font-bold">1</td>
                    <td className="p-2">Thủ đô của Việt Nam là gì?</td>
                    <td className="p-2">TP. Hồ Chí Minh</td>
                    <td className="p-2">Huế</td>
                    <td className="p-2">Đà Nẵng</td>
                    <td className="p-2">Hà Nội</td>
                    <td className={`p-2 text-center font-bold ${isDark ? 'text-cyan-400' : 'text-emerald-700'}`}>D</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2: Upload File Drag & Drop Zone */}
          <div>
            <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              <UploadCloud size={18} className={isDark ? 'text-cyan-400' : 'text-emerald-600'} />
              Bước 2: Chọn hoặc Kéo thả file câu hỏi (.xlsx, .xls, .csv, .json)
            </h3>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const input = fileInputRef.current;
                  if (input) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    input.files = dataTransfer.files;
                    handleFileUpload({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                }
              }}
              className={`border-2 border-dashed transition-all rounded-3xl p-8 text-center cursor-pointer group ${
                isDark
                  ? 'border-slate-700 hover:border-cyan-400 hover:bg-cyan-950/20 bg-slate-900/60'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-slate-50/60'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-inner ${
                isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <UploadCloud size={30} />
              </div>

              <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Kéo thả file vào đây hoặc <span className={isDark ? 'text-cyan-400 underline' : 'text-emerald-600 underline'}>Bấm để chọn file</span>
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Hỗ trợ định dạng Excel (.xlsx, .xls), CSV (.csv) hoặc JSON (.json)
              </p>

              {uploadFileName && (
                <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <FileText size={16} className={isDark ? 'text-cyan-400' : 'text-emerald-600'} />
                  <span>File đã chọn: {uploadFileName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error & Warning Display */}
          {uploadError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3 text-sm">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Không thể tải câu hỏi từ file</p>
                <p className="text-xs mt-0.5">{uploadError}</p>
              </div>
            </div>
          )}

          {uploadWarnings.length > 0 && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
              isDark ? 'bg-amber-950/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle size={15} /> Lưu ý cảnh báo ({uploadWarnings.length}):
              </p>
              <ul className="list-disc pl-5 space-y-0.5 max-h-32 overflow-y-auto">
                {uploadWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 3: Preview and Confirmation */}
          {parsedPreview.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border-2 shadow-xl space-y-4 ${
                isDark ? 'bg-slate-900 border-cyan-500' : 'bg-white border-emerald-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={isDark ? 'text-cyan-400' : 'text-emerald-600'} size={20} />
                    <h4 className="font-extrabold text-base">
                      Đã đọc thành công {parsedPreview.length} câu hỏi từ file!
                    </h4>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Hãy kiểm tra danh sách xem trước bên dưới và chọn cách thức áp dụng.
                  </p>
                </div>

                {/* Import Mode: Replace or Append */}
                <div className={`flex items-center gap-1.5 p-1 rounded-xl text-xs font-semibold border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      importMode === 'replace'
                        ? isDark ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-emerald-600 text-white font-bold'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Thay thế toàn bộ ({parsedPreview.length} câu)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      importMode === 'append'
                        ? isDark ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-emerald-600 text-white font-bold'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Thêm vào ({questions.length} + {parsedPreview.length})
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className={`max-h-64 overflow-y-auto rounded-xl border ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
              }`}>
                <table className="w-full text-xs text-left">
                  <thead className={`sticky top-0 font-bold ${
                    isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <tr>
                      <th className="p-2.5 text-center w-10">#</th>
                      <th className="p-2.5">Câu hỏi</th>
                      <th className="p-2.5">Đáp án A</th>
                      <th className="p-2.5">Đáp án B</th>
                      <th className="p-2.5">Đáp án C</th>
                      <th className="p-2.5">Đáp án D</th>
                      <th className="p-2.5 text-center">Đáp án đúng</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                    {parsedPreview.map((q, idx) => (
                      <tr key={idx} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                        <td className="p-2.5 text-center font-bold opacity-50">{idx + 1}</td>
                        <td className="p-2.5 font-medium">{q.question}</td>
                        <td className={`p-2.5 ${q.correctAnswer === 0 ? (isDark ? 'font-bold text-cyan-300 bg-cyan-950/30' : 'font-bold text-emerald-700 bg-emerald-50/60') : ''}`}>
                          {q.options[0] || '-'}
                        </td>
                        <td className={`p-2.5 ${q.correctAnswer === 1 ? (isDark ? 'font-bold text-cyan-300 bg-cyan-950/30' : 'font-bold text-emerald-700 bg-emerald-50/60') : ''}`}>
                          {q.options[1] || '-'}
                        </td>
                        <td className={`p-2.5 ${q.correctAnswer === 2 ? (isDark ? 'font-bold text-cyan-300 bg-cyan-950/30' : 'font-bold text-emerald-700 bg-emerald-50/60') : ''}`}>
                          {q.options[2] || '-'}
                        </td>
                        <td className={`p-2.5 ${q.correctAnswer === 3 ? (isDark ? 'font-bold text-cyan-300 bg-cyan-950/30' : 'font-bold text-emerald-700 bg-emerald-50/60') : ''}`}>
                          {q.options[3] || '-'}
                        </td>
                        <td className={`p-2.5 text-center font-extrabold ${isDark ? 'text-cyan-400' : 'text-emerald-700'}`}>
                          {String.fromCharCode(65 + q.correctAnswer)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Apply / Cancel buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedPreview([]);
                    setUploadFileName('');
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleApplyImportedQuestions}
                  className={`px-6 py-2.5 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/50'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  <Check size={18} />
                  <span>Áp dụng ngay bộ câu hỏi này</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Modal xác nhận xóa 1 câu hỏi */}
      {questionToDelete && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setQuestionToDelete(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className={`rounded-3xl p-6 max-w-lg w-full shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-rose-600 dark:text-rose-400">
                    Xác nhận xóa câu hỏi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bạn có chắc chắn muốn xóa câu hỏi này khỏi bộ đề ôn tập không?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chi tiết câu hỏi cần xóa */}
            <div className={`p-4 rounded-2xl mb-5 text-sm border space-y-2.5 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold flex items-start gap-2">
                <span className="text-rose-500 font-black flex-shrink-0">Câu hỏi:</span>
                <span className="leading-snug">{questionToDelete.question}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-3 border-l-2 border-rose-300 dark:border-rose-800">
                {questionToDelete.options.map((opt, i) => {
                  const isCorrect = questionToDelete.correctAnswer === i;
                  return (
                    <div 
                      key={i} 
                      className={`truncate px-2 py-1 rounded-lg ${
                        isCorrect ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : ''
                      }`}
                    >
                      <span className="font-black">{String.fromCharCode(65 + i)}.</span> {opt}
                      {isCorrect && ' ✓'}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal xác nhận xóa các câu đã chọn */}
      {showConfirmDeleteSelected && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowConfirmDeleteSelected(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className={`rounded-3xl p-6 max-w-md w-full shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-rose-600 dark:text-rose-400">
                    Xác nhận xóa {selectedIds.length} câu hỏi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bạn có chắc chắn muốn xóa {selectedIds.length} câu hỏi đã chọn khỏi bộ đề không?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmDeleteSelected(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteSelected(false)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSelected}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Xóa {selectedIds.length} câu</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal xác nhận xóa tất cả câu hỏi */}
      {showConfirmDeleteAll && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowConfirmDeleteAll(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className={`rounded-3xl p-6 max-w-md w-full shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-rose-600 dark:text-rose-400">
                    CẢNH BÁO: Xóa tất cả câu hỏi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bạn có chắc chắn muốn xóa toàn bộ {questions.length} câu hỏi trong bộ đề không?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmDeleteAll(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 mb-6 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900 leading-relaxed">
              Bộ đề sẽ trở nên trống rỗng. Bạn sẽ cần nhập câu hỏi mới hoặc khôi phục lại bộ câu hỏi mặc định.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteAll(false)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Xóa toàn bộ</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full-resolution Image Modal */}
      <ImageModal
        isOpen={!!modalImage}
        imageUrl={modalImage?.url || null}
        title={modalImage?.title}
        onClose={() => setModalImage(null)}
      />
    </motion.div>
  );
};
