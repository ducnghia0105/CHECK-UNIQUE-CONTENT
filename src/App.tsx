import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  FileCode
} from 'lucide-react';
import { mixContent, MixedContent } from './services/gemini';

export default function App() {
  const [inputText, setInputText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<MixedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setError('Vui lòng chọn tệp .txt');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      setError(null);
    };
    reader.readAsText(file);
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
    } catch (err) {
      setError('Có lỗi xảy ra khi xử lý nội dung. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!result) return;

    const exportContent = `
Tiêu đề: ${result.title}
Mô tả ngắn: ${result.shortDescription}
Mô tả chi tiết: ${result.detailedDescription}

Nội dung chính (HTML):
${result.mainContent}
    `.trim();

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mixed_${fileName || 'content'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                Tải lên tệp .txt hoặc dán nội dung trực tiếp để bắt đầu mix lại bài viết chuẩn SEO.
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
                  accept=".txt"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">
                      {fileName ? fileName : 'Nhấp để tải tệp .txt'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ định dạng văn bản thuần túy</p>
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
                    <p className="mt-6 font-bold text-gray-700 animate-pulse">Gemini đang sáng tạo...</p>
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
                    {/* Title Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded">Tiêu đề SEO</span>
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

                    {/* Export Button */}
                    <button
                      onClick={handleExport}
                      className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-[0.98]"
                    >
                      <Download size={20} />
                      Xuất tệp .txt (HTML)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

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
      `}} />
    </div>
  );
}
