import React, { useState } from 'react';
import { Question } from '../../types/game';
import { X, Sparkles, Download, Upload, CheckCircle2, AlertCircle, Image as ImageIcon, HelpCircle } from 'lucide-react';

interface GameStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCustomGame: (config: {
    secretMedia: { keyword: string; imageUrl: string; hint?: string };
    questions: Question[];
  }) => void;
  initialConfig?: {
    secretMedia: { keyword: string; imageUrl: string; hint?: string };
    questions: Question[];
  };
}

export const GameStudioModal: React.FC<GameStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyCustomGame,
  initialConfig,
}) => {
  const [keyword, setKeyword] = useState(initialConfig?.secretMedia?.keyword || 'Vịnh Hạ Long');
  const [imageUrl, setImageUrl] = useState(
    initialConfig?.secretMedia?.imageUrl ||
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
  );
  const [hint, setHint] = useState(initialConfig?.secretMedia?.hint || 'Di sản thiên nhiên thế giới');

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initialConfig?.questions && initialConfig.questions.length === 16) {
      return initialConfig.questions;
    }
    return Array.from({ length: 16 }, (_, i) => ({
      id: `custom-q-${i + 1}`,
      text: `Câu hỏi số ${i + 1}: Nội dung câu hỏi trắc nghiệm?`,
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctIndex: 0,
      timeLimit: 15,
    }));
  });

  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentQ = questions[activeQuestionIdx];

  const handleUpdateQuestion = (field: keyof Question, value: any) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[activeQuestionIdx] = { ...next[activeQuestionIdx], [field]: value };
      return next;
    });
  };

  const handleUpdateOption = (optIdx: number, val: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[activeQuestionIdx].options];
      opts[optIdx] = val;
      next[activeQuestionIdx] = { ...next[activeQuestionIdx], options: opts };
      return next;
    });
  };

  const handleExportJson = () => {
    const data = {
      secretMedia: { keyword, imageUrl, hint },
      questions,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mln_game_deck_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.secretMedia) {
          if (parsed.secretMedia.keyword) setKeyword(parsed.secretMedia.keyword);
          if (parsed.secretMedia.imageUrl) setImageUrl(parsed.secretMedia.imageUrl);
          if (parsed.secretMedia.hint) setHint(parsed.secretMedia.hint);
        }
        const isValidQuestion = (q: any): q is Question => {
          return (
            q &&
            typeof q.text === 'string' &&
            q.text.trim().length > 0 &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            q.options.every((opt: any) => typeof opt === 'string' && opt.trim().length > 0) &&
            typeof q.correctIndex === 'number' &&
            q.correctIndex >= 0 &&
            q.correctIndex <= 3
          );
        };

        if (
          Array.isArray(parsed.questions) &&
          parsed.questions.length === 16 &&
          parsed.questions.every(isValidQuestion)
        ) {
          setQuestions(parsed.questions);
          setErrorMsg(null);
        } else {
          setErrorMsg('File JSON không hợp lệ! Phải chứa chính xác 16 câu hỏi với đầy đủ text, 4 đáp án và correctIndex từ 0 đến 3.');
        }
      } catch (err: any) {
        setErrorMsg('Lỗi định dạng JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!keyword.trim() || !imageUrl.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Từ khóa và URL hình ảnh bí ẩn!');
      return;
    }
    const isAllValid = questions.every((q) => q.text.trim() && q.options.every((o) => o.trim()));
    if (!isAllValid) {
      setErrorMsg('Một số câu hỏi hoặc phương án trả lời đang bị để trống!');
      return;
    }

    onApplyCustomGame({
      secretMedia: { keyword: keyword.trim(), imageUrl: imageUrl.trim(), hint: hint.trim() },
      questions,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 select-none">
      <div className="glass-panel max-w-4xl w-full max-h-[92vh] flex flex-col rounded-3xl border border-gray-700/80 shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                STUDIO THIẾT KẾ TRẬN ĐẤU & BỘ ĐỀ
              </h2>
              <p className="text-xs text-gray-400">
                Tùy chỉnh ảnh bí ẩn, từ khóa chiến thắng và 16 câu hỏi trắc nghiệm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-gray-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất JSON</span>
            </button>

            <label className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-gray-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập JSON</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-950/80 border border-red-500/80 text-red-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Secret Media Config */}
          <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-4">
            <h3 className="text-xs font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> 1. HÌNH ẢNH & TỪ KHÓA BÍ ẨN (ULTIMATE GUESS)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Từ khóa chính xác:</label>
                <input
                  type="text"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Ví dụ: Vịnh Hạ Long, Chùa Một Cột..."
                  className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">URL Ảnh chất lượng cao:</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Gợi ý thêm (Hint):</label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Gợi ý thêm cho MC..."
                  className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: 16 Questions Config */}
          <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> 2. DANH SÁCH 16 CÂU HỎI TRẮC NGHIỆM
              </h3>
              <span className="text-[11px] text-gray-400 font-medium">
                Đang chỉnh sửa: <strong className="text-white">Ô thẻ số {activeQuestionIdx + 1}</strong>
              </span>
            </div>

            {/* Grid 16 tabs */}
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
              {questions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`py-2 rounded-lg text-xs font-black transition-all ${
                    activeQuestionIdx === idx
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-black shadow-lg scale-105'
                      : 'bg-gray-900/80 hover:bg-gray-800 text-gray-300 border border-gray-800'
                  }`}
                >
                  Câu {idx + 1}
                </button>
              ))}
            </div>

            {/* Question Editor Form */}
            {currentQ && (
              <div className="space-y-4 pt-2 bg-gray-950/60 p-4 rounded-xl border border-gray-800">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Nội dung câu hỏi số {activeQuestionIdx + 1}:
                  </label>
                  <textarea
                    rows={2}
                    value={currentQ.text}
                    onChange={(e) => handleUpdateQuestion('text', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                        currentQ.correctIndex === optIdx
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-gray-800 bg-gray-900/80'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion('correctIndex', optIdx)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                          currentQ.correctIndex === optIdx
                            ? 'bg-emerald-500 text-black shadow'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                        title="Chọn làm đáp án đúng"
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </button>

                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                        className="flex-1 bg-transparent border-b border-gray-700 text-white text-sm font-medium focus:outline-none focus:border-cyan-400 pb-1"
                        placeholder={`Phương án ${String.fromCharCode(65 + optIdx)}...`}
                      />

                      {currentQ.correctIndex === optIdx && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            * Nhấn nút áp dụng để khởi tạo lại toàn bộ bàn cờ 16 ô cho tất cả người chơi.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95"
            >
              ÁP DỤNG ĐỀ THI VÀO TRẬN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
