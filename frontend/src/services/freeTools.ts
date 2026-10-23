import type { ViralHookTemplate } from "../models/types";

export const VIRAL_HOOKS: ViralHookTemplate[] = [
  // 1. Tò mò & Khám phá
  {
    category: "Tò mò & Bí mật",
    hook: "Cách mà 90% mọi người đang hiểu sai về [Chủ đề]...",
    framework: "[Tỷ lệ %] + Hiểu sai / Thổi phồng + [Chủ đề]",
    example: "Cách mà 90% người mới làm video đang hiểu sai về Thuật toán TikTok...",
  },
  {
    category: "Tò mò & Bí mật",
    hook: "Bí mật mà những chuyên gia trong ngành [Lĩnh vực] không muốn bạn biết.",
    framework: "Bí mật chuyên gia giấu kín + [Lĩnh vực]",
    example: "Bí mật mà các agency triệu view không muốn bạn biết về kịch bản 3 giây đầu.",
  },
  {
    category: "Tò mò & Bí mật",
    hook: "Tôi đã ước mình biết điều này về [Chủ đề] sớm hơn 3 năm...",
    framework: "Hối tiếc tích cực + [Khoảng thời gian] + [Chủ đề]",
    example: "Tôi đã ước mình biết cách tư duy bố cục này sớm hơn 2 năm...",
  },

  // 2. Tương phản & Đòn bẩy
  {
    category: "Tương phản & Đòn bẩy",
    hook: "Đừng mua [Sản phẩm / Công cụ] nếu bạn chưa biết 1 mẹo này.",
    framework: "Ngăn cản hành động phổ biến + Giải pháp ngầm",
    example: "Đừng vội mua mic thu âm đắt tiền nếu bạn chưa bật tính năng lọc âm này.",
  },
  {
    category: "Tương phản & Đòn bẩy",
    hook: "Thay vì làm [Cách cũ tốn sức], hãy thử [Cách mới siêu nhanh].",
    framework: "So sánh tiêu hao vs Đột phá tốc độ",
    example: "Thay vì ngồi gõ phụ đề 3 tiếng, hãy dùng quy tắc chia nhịp tự động này.",
  },
  {
    category: "Tương phản & Đòn bẩy",
    hook: "Lý do video của bạn bị kẹt ở 200 view không phải do chất lượng.",
    framework: "Phủ nhận nguyên nhân phổ biến + Hé lộ nguyên nhân gốc",
    example: "Lý do kênh của bạn đứng view không phải do thiết bị quay kém...",
  },

  // 3. Con số & Kết quả thực chứng
  {
    category: "Con số & Thực chứng",
    hook: "Tôi đã thử nghiệm [Hành động] liên tục trong 14 ngày và đây là kết quả.",
    framework: "Thử nghiệm thực tế + Thời gian cụ thể + Kết quả bất ngờ",
    example: "Tôi đã đăng 2 video mỗi ngày trong 14 ngày và thuật toán phản ứng thế nào?",
  },
  {
    category: "Con số & Thực chứng",
    hook: "3 bước đơn giản giúp tôi tăng [Mục tiêu] từ [Số cũ] lên [Số mới].",
    framework: "3 bước lộ trình + Số liệu tăng trưởng rõ ràng",
    example: "3 bước đơn giản giúp tôi tăng tỷ lệ xem hết từ 12% lên 48%.",
  },
  {
    category: "Con số & Thực chứng",
    hook: "Quy tắc 3 giây: Nếu không có chi tiết này, khán giả sẽ lướt qua ngay.",
    framework: "Quy tắc định lượng + Cảnh báo mất lượt xem",
    example: "Quy tắc 3 giây đầu: 1 câu hỏi tương phản giữ chân 70% người xem.",
  },

  // 4. Kể chuyện & Cảm xúc
  {
    category: "Kể chuyện & Cảm xúc",
    hook: "Khoảnh khắc tôi nhận ra mình đã lãng phí [Thời gian / Tiền] vào [Thói quen]...",
    framework: "Điểm bừng tỉnh cá nhân + Sự đồng cảm sâu sắc",
    example: "Khoảnh khắc tôi nhận ra mình đã lãng phí 6 tháng vào việc chỉnh màu video quá đà...",
  },
  {
    category: "Kể chuyện & Cảm xúc",
    hook: "Nếu bạn đang cảm thấy nản lòng vì [Khó khăn], hãy nghe câu chuyện này.",
    framework: "Đồng cảm nỗi đau + Kể chuyện truyền cảm hứng",
    example: "Nếu bạn đang nản lòng vì đăng 10 video chỉ được vài chục view, video này cho bạn.",
  },
];

export const HASHTAG_PRESETS: Record<string, string[]> = {
  "Sáng tạo nội dung": ["#sangtaonoidung", "#videoviral", "#lamvideotiktok", "#creatorvn", "#kiemtienonline", "#xuhuongtiktok"],
  "Công nghệ & AI": ["#congnghe", "#aivietnam", "#trietueshantao", "#chatgpt", "#congngheso", "#meocongnghe"],
  "Kinh doanh & Khởi nghiệp": ["#kinhdoanh", "#khoinghiep", "#marketingvn", "#phattrienbanthan", "#taichinhcanhan", "#baihockinhdoanh"],
  "Học tập & Kỹ năng": ["#hoctap", "#kynangsong", "#hieuquacongviec", "#phattrienbanthan", "#tuduy", "#sachhay"],
};

export const FreeToolsService = {
  /**
   * Chuyển đổi văn bản kịch bản thành phụ đề .SRT chuẩn 100% trên client
   * Chi phí 0đ, không tốn AI token, không tải máy chủ!
   */
  generateSrtFromScript(
    scriptText: string,
    wordsPerMinute: number = 155,
    maxWordsPerLine: number = 5
  ): string {
    const cleanText = scriptText
      .replace(/\r\n/g, "\n")
      .trim();

    if (!cleanText) return "";

    // Phân tách thành các đoạn hoặc câu
    const rawParagraphs = cleanText.split(/\n+/);
    const phrases: string[] = [];

    for (const para of rawParagraphs) {
      const sentences = para.split(/(?<=[.?!,;:])\s+/);
      for (const sent of sentences) {
        const trimmed = sent.trim();
        if (!trimmed) continue;

        // Cắt nhỏ câu nếu dài hơn maxWordsPerLine để đọc ngắn gọn kiểu TikTok
        const words = trimmed.split(/\s+/);
        for (let i = 0; i < words.length; i += maxWordsPerLine) {
          const chunk = words.slice(i, i + maxWordsPerLine).join(" ");
          if (chunk) phrases.push(chunk);
        }
      }
    }

    if (phrases.length === 0) return "";

    const secondsPerWord = 60 / Math.max(100, Math.min(240, wordsPerMinute));
    let currentSeconds = 0.5; // Bắt đầu ở giây 0.5 để người xem bắt kịp
    const srtBlocks: string[] = [];

    const formatTimestamp = (totalSec: number): string => {
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = Math.floor(totalSec % 60);
      const ms = Math.floor((totalSec - Math.floor(totalSec)) * 1000);
      const pad = (n: number, z = 2) => String(n).padStart(z, "0");
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
    };

    phrases.forEach((phrase, idx) => {
      const wordCount = phrase.split(/\s+/).length;
      const duration = Math.max(1.1, wordCount * secondsPerWord);
      const startTime = formatTimestamp(currentSeconds);
      const endTime = formatTimestamp(currentSeconds + duration);

      srtBlocks.push(`${idx + 1}\n${startTime} --> ${endTime}\n${phrase}\n`);
      currentSeconds += duration + 0.08; // 80ms nghỉ giữa các câu
    });

    return srtBlocks.join("\n");
  },

  /**
   * Tính toán thời lượng ước tính & nhịp độ của kịch bản
   */
  calculatePacing(text: string) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const standardSeconds = Math.round((words / 150) * 60);
    const fastSeconds = Math.round((words / 185) * 60);

    let pacingCategory = "Chuẩn";
    let recommendation = "Nhịp độ cân bằng, phù hợp đa số nội dung.";

    if (standardSeconds < 30) {
      pacingCategory = "Siêu ngắn (Dưới 30s)";
      recommendation = "Cực kỳ thích hợp cho TikTok Shorts, tập trung 1 ý duy nhất.";
    } else if (standardSeconds <= 60) {
      pacingCategory = "Tiêu chuẩn TikTok (30s - 60s)";
      recommendation = "Độ dài vàng cho thuật toán đề xuất, cần hook mạnh 3 giây đầu.";
    } else if (standardSeconds <= 180) {
      pacingCategory = "Nội dung sâu (1 - 3 phút)";
      recommendation = "Cần thêm tương phản và đổi bối cảnh mỗi 10-15s để giữ chân người xem.";
    } else {
      pacingCategory = "Dài (> 3 phút)";
      recommendation = "Nên phân đoạn thành các chương nội dung rõ ràng.";
    }

    return {
      wordCount: words,
      standardSeconds,
      fastSeconds,
      pacingCategory,
      recommendation,
    };
  },
};
