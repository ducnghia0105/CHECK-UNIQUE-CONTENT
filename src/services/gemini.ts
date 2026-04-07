import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MixedContent {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  mainContent: string;
}

export async function mixContent(originalText: string): Promise<MixedContent> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = `
    Bạn là một chuyên gia SEO và Content Writer chuyên nghiệp cấp cao. 
    Nhiệm vụ của bạn là viết lại (mix/spin) nội dung bài viết dưới đây để tối ưu SEO, đảm bảo tỷ lệ không trùng lặp (unique) cao nhưng vẫn giữ nguyên giá trị thông tin.
    
    YÊU CẦU QUAN TRỌNG:
    1. TƯƠNG ĐƯƠNG BẢN GỐC: Nội dung mới phải có cấu trúc và ý nghĩa tương đương hoàn toàn với bản gốc. Không được rút gọn, không được thêm thắt các ý kiến cá nhân làm sai lệch thông tin.
    2. GIỮ NGUYÊN THÔNG TIN CÔNG TY: Toàn bộ các thông tin liên quan đến công ty (Tên công ty, địa chỉ, số điện thoại, email, website, mã số thuế, v.v.) PHẢI ĐƯỢC GIỮ NGUYÊN 100%, KHÔNG ĐƯỢC THAY ĐỔI DÙ CHỈ MỘT KÝ TỰ.
    3. KỸ THUẬT MIX NỘI DUNG: Chỉ thay đổi một số từ ngữ, cụm từ bằng các từ đồng nghĩa hoặc thay đổi cấu trúc câu một cách khéo léo để tránh bị Google đánh giá là nội dung trùng lặp (duplicate content).
    4. TIÊU ĐỀ: Sáng tạo tiêu đề mới hấp dẫn, chứa từ khóa chính, kích thích click (CTR).
    5. MÔ TẢ NGẮN (META DESCRIPTION): Viết mô tả ngắn gọn trong khoảng 150-160 ký tự, chứa từ khóa chính.
    6. MÔ TẢ CHI TIẾT: Giới thiệu tổng quan về bài viết một cách chuyên nghiệp.
    7. CẤU TRÚC HTML: Sử dụng các thẻ HTML <h2>, <h3>, <h4> cho các tiêu đề phụ và <p> cho các đoạn văn. Đảm bảo cấu trúc bài viết rõ ràng, mạch lạc và chuẩn SEO.
    
    Nội dung gốc cần xử lý:
    ${originalText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Tiêu đề bài viết tối ưu SEO" },
            shortDescription: { type: Type.STRING, description: "Mô tả ngắn (Meta Description)" },
            detailedDescription: { type: Type.STRING, description: "Mô tả chi tiết bài viết" },
            mainContent: { type: Type.STRING, description: "Nội dung chính bài viết với các thẻ HTML (h2, h3, h4, p)" },
          },
          required: ["title", "shortDescription", "detailedDescription", "mainContent"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as MixedContent;
  } catch (error) {
    console.error("Error mixing content:", error);
    throw error;
  }
}
