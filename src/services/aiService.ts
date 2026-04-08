import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";

let geminiInstance: GoogleGenAI | null = null;
let gptInstance: OpenAI | null = null;

export type AIProvider = 'Gemini' | 'GPT';

export interface MixedContent {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  mainContent: string;
  uniquenessScore: number;
  provider: AIProvider;
}

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiInstance) {
    geminiInstance = new GoogleGenAI({ apiKey });
  }
  return geminiInstance;
}

function getGPT() {
  const apiKey = process.env.GPT_KEY;
  if (!apiKey) return null;
  if (!gptInstance) {
    gptInstance = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  return gptInstance;
}

export async function mixContent(originalText: string): Promise<MixedContent> {
  const gemini = getGemini();
  const gpt = getGPT();

  const prompt = `
    Bạn là một chuyên gia SEO và Content Writer chuyên nghiệp cấp cao trong lĩnh vực Công nghệ thông tin và Thiết kế Website. 
    Nhiệm vụ của bạn là viết lại (mix/spin) nội dung bài viết dưới đây để tối ưu SEO, đảm bảo tỷ lệ không trùng lặp (unique) cao nhưng vẫn giữ nguyên giá trị thông tin.
    
    YÊU CẦU QUAN TRỌNG:
    1. ĐẶC THÙ NGÀNH WEBSITE: Đây là nội dung chuyên ngành về website/công nghệ. Bạn phải cực kỳ cẩn thận với các thuật ngữ kỹ thuật (ví dụ: Hosting, Domain, Source code, UI/UX, CMS, v.v.). KHÔNG ĐƯỢC thay đổi các thuật ngữ này sang từ tiếng Việt không sát nghĩa hoặc làm sai lệch bản chất kỹ thuật.
    2. BẢO TOÀN NGỮ NGHĨA: Việc mix nội dung phải đảm bảo tính logic và độ chính xác cao. Tuyệt đối không vì cố gắng tăng tỷ lệ unique mà làm hư ngữ nghĩa hoặc khiến câu văn trở nên khó hiểu, lủng củng.
    3. TƯƠNG ĐƯƠNG BẢN GỐC: Nội dung mới phải có cấu trúc và ý nghĩa tương đương hoàn toàn với bản gốc. Không được rút gọn, không được thêm thắt các ý kiến cá nhân làm sai lệch thông tin.
    4. GIỮ NGUYÊN THÔNG TIN CÔNG TY: Toàn bộ các thông tin liên quan đến công ty (Tên công ty, địa chỉ, số điện thoại, email, website, mã số thuế, v.v.) PHẢI ĐƯỢC GIỮ NGUYÊN 100%, KHÔNG ĐƯỢC THAY ĐỔI DÙ CHỈ MỘT KÝ TỰ.
    3. KỸ THUẬT MIX NỘI DUNG: Chỉ thay đổi một số từ ngữ, cụm từ bằng các từ đồng nghĩa hoặc thay đổi cấu trúc câu một cách khéo léo để tránh bị Google đánh giá là nội dung trùng lặp (duplicate content).
    4. TIÊU ĐỀ: Sáng tạo tiêu đề mới hấp dẫn, chứa từ khóa chính, kích thích click (CTR).
    5. MÔ TẢ NGẮN (META DESCRIPTION): Viết mô tả ngắn gọn trong khoảng 150-160 ký tự, chứa từ khóa chính.
    6. MÔ TẢ CHI TIẾT: Giới thiệu tổng quan về bài viết một cách chuyên nghiệp.
    7. CẤU TRÚC HTML: Sử dụng các thẻ HTML <h2>, <h3>, <h4> cho các tiêu đề phụ và <p> cho các đoạn văn. Đảm bảo cấu trúc bài viết rõ ràng, mạch lạc và chuẩn SEO.
    
    Nội dung gốc cần xử lý:
    ${originalText}

    YÊU CẦU ĐỊNH DẠNG ĐẦU RA: Trả về một đối tượng JSON với các trường:
    - title: Tiêu đề SEO
    - shortDescription: Meta description
    - detailedDescription: Giới thiệu tổng quan
    - mainContent: Nội dung chính với thẻ HTML
    - uniquenessScore: Ước tính tỷ lệ unique (%) so với bản gốc (số từ 0-100)
  `;

  // Try Gemini first
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              shortDescription: { type: Type.STRING },
              detailedDescription: { type: Type.STRING },
              mainContent: { type: Type.STRING },
              uniquenessScore: { type: Type.NUMBER },
            },
            required: ["title", "shortDescription", "detailedDescription", "mainContent", "uniquenessScore"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");
      return { ...result, provider: 'Gemini' } as MixedContent;
    } catch (error: any) {
      console.error("Gemini error, trying GPT if available...", error);
      if (!gpt) throw new Error(error?.message || "Lỗi kết nối với Gemini AI.");
    }
  }

  // Try GPT if Gemini failed or is not available
  if (gpt) {
    try {
      const model = process.env.GPT_MODEL || "gpt-4o-mini";
      const response = await gpt.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content || "{}");
      return { ...result, provider: 'GPT' } as MixedContent;
    } catch (error: any) {
      console.error("GPT error:", error);
      throw new Error(error?.message || "Lỗi kết nối với GPT AI.");
    }
  }

  throw new Error("Không tìm thấy cấu hình API Key (Gemini hoặc GPT). Vui lòng kiểm tra Environment Variables.");
}
