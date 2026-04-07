import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  FileCode,
  Eye,
  X,
  FileDown,
  ShieldCheck
} from 'lucide-react';
import { mixContent, MixedContent, AIProvider } from './services/aiService';

export default function App() {
  const [inputText, setInputText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<MixedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isTxt = file.name.endsWith('.txt');
    const isDocx = file.name.endsWith('.docx');
    const isDoc = file.name.endsWith('.doc');

    if (!isTxt && !isDocx && !isDoc) {
      setError('Vui lòng chọn tệp .txt, .doc hoặc .docx');
      return;
    }

    setFileName(file.name);
    setError(null);

    try {
      if (isDocx) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setInputText(result.value);
      } else if (isTxt) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setInputText(content);
        };
        reader.readAsText(file);
      } else if (isDoc) {
        setError('Tệp .doc (cũ) không được hỗ trợ tốt trong trình duyệt. Vui lòng chuyển sang .docx hoặc .txt');
        setInputText('');
      }
    } catch (err) {
      setError('Không thể đọc tệp này. Vui lòng kiểm tra lại định dạng.');
      console.error(err);
    }
  };

  const handleMix = async () => {
    if (!inputText.trim()) {
      setError('Vui lòng nhập nội dung hoặc tải lên tệp .txt');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const mixed = await mixContent(inputText);
      setResult(mixed);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi xử lý nội dung. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportTxt = () => {
    if (!result) return;

    const exportContent = `
Tiêu đề: ${result.title}
Mô tả ngắn: ${result.shortDescription}
Mô tả chi tiết: ${result.detailedDescription}

Nội dung chính (HTML):
${result.mainContent}
    `.trim();

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `mixed_${fileName.split('.')[0] || 'content'}.txt`);
  };

  const handleExportWord = () => {
    if (!result) return;

    // Create a simple HTML document that Word can open
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${result.title}</title></head>
      <body style="font-family: 'Times New Roman', serif;">
        <h1 style="font-size: 24pt; font-weight: bold; margin-bottom: 20pt;">${result.title}</h1>
        <div style="background: #f0f7ff; padding: 15pt; border: 1pt solid #cce4ff; margin-bottom: 20pt; font-style: italic;">
          <strong>Mô tả ngắn:</strong> ${result.shortDescription}
        </div>
        <div style="margin-bottom: 20pt;">
          <strong>Mô tả chi tiết:</strong> ${result.detailedDescription}
        </div>
        <hr style="margin-bottom: 20pt;">
        <div class="content">
          ${result.mainContent}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    saveAs(blob, `mixed_${fileName.split('.')[0] || 'content'}.doc`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Sparkles size={22} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SEO Content Mixer</h1>
          </div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            Powered by Gemini AI
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Input */}
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="text-blue-600" size={24} />
                Nội dung đầu vào
              </h2>
              <p className="text-gray-500 text-sm">
                Tải lên tệp .txt, .doc, .docx hoặc dán nội dung trực tiếp để bắt đầu mix lại bài viết chuẩn SEO.
              </p>
            </div>

            <div className="space-y-4">
              {/* File Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-8 transition-all hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer text-center"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.doc,.docx"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">
                      {fileName ? fileName : 'Nhấp để tải tệp .txt, .doc, .docx'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ định dạng văn bản và Word</p>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Hoặc dán nội dung bài viết tại đây..."
                  className="w-full h-64 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                />
                {inputText && (
                  <button 
                    onClick={() => setInputText('')}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <button
                onClick={handleMix}
                disabled={isProcessing || !inputText.trim()}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isProcessing || !inputText.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Đang xử lý nội dung...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Mix lại nội dung ngay
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Right Column: Result */}
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={24} />
                Kết quả tối ưu
              </h2>
              <p className="text-gray-500 text-sm">
                Nội dung đã được viết lại chuẩn SEO, sẵn sàng để xuất bản.
              </p>
            </div>

            <div className="min-h-[400px] relative">
              <AnimatePresence mode="wait">
                {!result && !isProcessing && (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-3xl border border-gray-100"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 mb-4 shadow-sm">
                      <FileCode size={32} />
                    </div>
                    <p className="text-gray-400 font-medium">Chưa có kết quả xử lý</p>
                    <p className="text-xs text-gray-300 mt-2 max-w-[200px]">
                      Kết quả mix nội dung sẽ hiển thị tại đây sau khi bạn nhấn nút xử lý.
                    </p>
                  </motion.div>
                )}

                {isProcessing && (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl z-10"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
                    </div>
                    <p className="mt-6 font-bold text-gray-700 animate-pulse">
                      {process.env.GEMINI_API_KEY ? 'Gemini đang sáng tạo...' : 'GPT đang sáng tạo...'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Quá trình này có thể mất vài giây</p>
                  </motion.div>
                )}

                {result && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Uniqueness Score Card */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.uniquenessScore >= 80 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                          <ShieldCheck size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tỷ lệ Unique ước tính</p>
                          <p className="text-lg font-black">{result.uniquenessScore}%</p>
                        </div>
                      </div>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.uniquenessScore}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${result.uniquenessScore >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                        />
                      </div>
                    </div>

                    {/* Title Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded">Tiêu đề SEO</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${result.provider === 'Gemini' ? 'text-purple-500 bg-purple-50' : 'text-green-500 bg-green-50'}`}>
                            Sử dụng: {result.provider}
                          </span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(result.title)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <h3 className="text-lg font-bold leading-tight">{result.title}</h3>
                    </div>

                    {/* Descriptions */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-50 px-2 py-1 rounded">Mô tả ngắn (Meta)</span>
                        <p className="text-sm text-gray-600 leading-relaxed">{result.shortDescription}</p>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500 bg-purple-50 px-2 py-1 rounded">Mô tả chi tiết</span>
                        <p className="text-sm text-gray-600 leading-relaxed">{result.detailedDescription}</p>
                      </div>
                    </div>

                    {/* Main Content Preview */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-1 rounded">Nội dung HTML</span>
                        <button 
                          onClick={() => copyToClipboard(result.mainContent)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {result.mainContent}
                        </pre>
                      </div>
                    </div>

                    {/* Preview & Export Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowPreview(true)}
                        className="w-full py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all active:scale-[0.98]"
                      >
                        <Eye size={20} />
                        Xem trước HTML
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={handleExportTxt}
                          className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-[0.98]"
                        >
                          <Download size={20} />
                          Xuất tệp .txt ( html )
                        </button>

                        <button
                          onClick={handleExportWord}
                          className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-[0.98]"
                        >
                          <FileDown size={20} />
                          Xuất tệp Word
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

      {/* HTML Preview Modal */}
      <AnimatePresence>
        {showPreview && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Eye size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Xem trước nội dung trực quan</h3>
                    <p className="text-xs text-gray-400">Hiển thị định dạng HTML thực tế</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white custom-scrollbar">
                <article className="prose prose-blue max-w-none">
                  <h1 className="text-3xl font-black mb-6 text-gray-900 leading-tight">{result.title}</h1>
                  <div className="mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 italic text-gray-600 leading-relaxed">
                    {result.shortDescription}
                  </div>
                  <div 
                    className="preview-content"
                    dangerouslySetInnerHTML={{ __html: result.mainContent }} 
                  />
                </article>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-8 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-black transition-all active:scale-[0.95]"
                >
                  Đóng bản xem trước
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Sparkles size={18} />
            <span className="text-sm font-medium">SEO Content Mixer v1.0</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-400 font-medium">
            <a href="#" className="hover:text-blue-600 transition-colors">Hướng dẫn</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Chính sách</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Liên hệ</a>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F1F1F1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DDD;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CCC;
        }
        
        .preview-content h2 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #111;
          line-height: 1.3;
        }
        .preview-content h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #222;
        }
        .preview-content h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #333;
        }
        .preview-content p {
          margin-bottom: 1.25rem;
          line-height: 1.7;
          color: #444;
        }
        .preview-content ul, .preview-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        .preview-content li {
          margin-bottom: 0.5rem;
        }
      `}} />
    </div>
  );
}
