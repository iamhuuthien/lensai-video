"""AI Strategic Channel Intelligence Synthesizer (Gemini 2.5 Pro / Flash + Deterministic Fallback).

Synthesizes quantitative channel metrics, top viral outliers, hidden gems, and cross-page
comparison data into a structured strategic report covering:
1. Định hướng kênh (Channel Positioning & Audience Persona)
2. Xu hướng nội dung (Content Trends & Momentum)
3. Phân tích Key thành công trên 3 nền tảng (TikTok, Facebook REACH, YouTube)
4. Điểm mạnh, Điểm nghẽn cần cải thiện & Chiến thuật vượt mặt đối thủ (Head-to-Head)
5. Kịch bản 5 Video Tiếp Theo (Next-5-Videos Playbook) tích hợp thẳng sang Studio CapCut.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

logger = logging.getLogger("video-explainer.channel_ai")


def _build_deterministic_strategy(
    primary_metrics: Dict[str, Any],
    secondary_metrics: Optional[Dict[str, Any]] = None,
    comparison: Optional[Dict[str, Any]] = None,
    focus_goal: str = "comprehensive",
) -> Dict[str, Any]:
    """Generate a deep, data-backed strategic report directly from the channel's quantitative metrics."""
    platform = primary_metrics.get("platform", "tiktok")
    handle = primary_metrics.get("handle") or primary_metrics.get("channel_title") or "@channel"
    title = primary_metrics.get("channel_title") or handle
    median_v = primary_metrics.get("median_views", 0)
    max_v = primary_metrics.get("max_views", 0)
    er = primary_metrics.get("avg_weighted_engagement_rate", 0.0)
    share_pct = primary_metrics.get("avg_share_to_like_pct", 0.0)
    comment_pct = primary_metrics.get("avg_comment_to_like_pct", 0.0)
    cadence = primary_metrics.get("posting_cadence_per_week", 3.0)
    momentum_lbl = primary_metrics.get("momentum_label", "Ổn định")
    health = primary_metrics.get("channel_health_score", 75)
    opt_dur = primary_metrics.get("optimal_duration_tier", "18–40s")
    best_pillar = (primary_metrics.get("best_pillar") or {}).get(
        "label", "Hướng dẫn & Kiến thức (Educational)"
    )
    outliers = primary_metrics.get("viral_outliers") or []
    top_outlier_title = outliers[0]["title"] if outliers else "Video hướng dẫn thực chiến"
    top_tags = [t["tag"] for t in (primary_metrics.get("top_hashtags") or [])[:5]]
    tags_str = ", ".join(top_tags) if top_tags else "#ai, #contentstrategy, #xuhuong"

    positioning = {
        "core_niche": (
            f"Kênh {title} định vị ở ngách **{best_pillar}**, tập trung giải quyết bài toán thực chiến "
            f"với nhóm từ khóa chủ lực ({tags_str})."
        ),
        "audience_persona": (
            "Người xem mục tiêu từ 18–35 tuổi (Creator, Marketer, Dân văn phòng/Công nghệ & Chủ kinh doanh nhỏ) "
            "ưu tiên thông tin cô đọng, có ví dụ minh họa trực quan và áp dụng được ngay trong 3–5 bước."
        ),
        "brand_voice": (
            "Trực diện, thực chiến (Action-oriented), kết hợp số liệu cụ thể và câu hỏi kích thích thảo luận."
        ),
        "pillar_assessment": (
            f"Trụ cột **{best_pillar}** đang mang lại hiệu suất cao nhất (vượt trung vị kênh). "
            f"Tần suất đăng hiện đạt **{cadence} bài/tuần** với thời lượng vàng nằm ở khung **{opt_dur}**."
        ),
    }

    content_trends = {
        "momentum_diagnosis": (
            f"Chỉ số sức khỏe kênh đạt **{health}/100** — Trạng thái: **{momentum_lbl}**. "
            f"Trung vị mỗi bài đạt **{median_v:,} views**, đỉnh viral đạt **{max_v:,} views** "
            f"(gấp {round(max_v / max(median_v, 1), 1)} lần mặt bằng chung)."
        ),
        "winning_topics": (
            f"Các chủ đề mở đầu bằng con số cụ thể, bóc tách sai lầm hoặc tặng quy trình/công cụ "
            f"(điển hình như: *\"{top_outlier_title[:85]}...\"*) có tỷ lệ Chia sẻ/Thích đạt **{share_pct}%** — "
            "đây là động cơ chính kích hoạt thuật toán đề xuất."
        ),
        "fatigue_warning": (
            "Các bài đăng mang tính thông báo thuần túy, tiêu đề thiếu khoảng trống tò mò (Curiosity Gap) "
            "hoặc chèn link trực tiếp trong phần mô tả đang kéo tụt trung bình lượt xem của kênh."
        ),
    }

    platform_keys_analysis = {
        "tiktok_key": (
            f"**🎵 Key TikTok (Hook 3s & Loop Mechanics)**: "
            f"Tối ưu hóa thời lượng ở khung **{opt_dur}**. Trong 3 giây đầu bắt buộc có: "
            f"(1) Câu Hook đánh vào nỗi đau/con số phản trực giác, (2) Chữ Text Tag cỡ lớn giữa màn hình, "
            f"và (3) Nhịp cắt cảnh 2.5 giây/frame để giữ Completion Rate > 65%. Tận dụng TikTok SEO bằng cách "
            f"đặt từ khóa chính ({tags_str}) ngay trong 2 dòng đầu của Caption và phụ đề .SRT."
        ),
        "facebook_key": (
            f"**📘 Key Facebook (REACH Framework)**: "
            f"(R) Duy trì tỷ trọng **Reels ≥ 65%** để ăn luồng đề xuất Unconnected Discovery (tiếp cận người lạ chưa Follow). "
            f"(E) Tăng vận tốc bình luận 60 phút đầu (hiện đạt **{comment_pct}%** Comment/Like) bằng câu hỏi lựa chọn A/B ở cuối clip. "
            f"(A) Giữ kỷ luật 2 trụ cột nội dung chính trong 12 bài liên tiếp. "
            f"(C & H) **Tuyệt đối không để link ngoài trong bài đăng** (chuyển 100% link sang bình luận đầu tiên để tránh bị bóp 80% reach)."
        ),
        "youtube_key": (
            f"**▶️ Key YouTube (Searchable + Shareable Funnel)**: "
            f"Kết hợp phễu **Shorts (≤60s)** để hút khán giả mới (Top-of-Funnel) rồi gắn **Related Video Link** "
            f"trỏ thẳng về **Video dài 5–15 phút** cùng chủ đề. Tối ưu cặp **Title + Thumbnail** theo công thức "
            f"*[Kết quả cụ thể / Con số] + [Rào cản được gỡ bỏ]* và chèn Chapters `[MM:SS]` để ăn trọn Google/YouTube Search."
        ),
    }

    strengths = [
        f"Trụ cột chủ lực **{best_pillar}** có sức hút rõ rệt, tạo ra video đỉnh đạt **{max_v:,} views**.",
        f"Tỷ lệ tương tác trọng số đạt **{er}%** (Share/Like đạt **{share_pct}%**, Comment/Like đạt **{comment_pct}%**).",
        f"Khung thời lượng **{opt_dur}** đã chứng minh độ tương thích cao với tệp khán giả hiện tại.",
        f"Hệ thống chủ đề và cụm hashtag ({tags_str}) bám sát nhu cầu tìm kiếm thực tế trong ngách.",
    ]

    weaknesses = [
        f"Khoảng cách giữa video đỉnh (**{max_v:,} views**) và trung vị (**{median_v:,} views**) còn lớn — cần chuẩn hóa công thức Hook 3s đầu để nâng sàn view.",
        (
            f"Phát hiện **{primary_metrics.get('external_link_violations', 0)} bài đăng chèn link trực tiếp** trong nội dung gây bóp tương tác tự nhiên."
            if primary_metrics.get("external_link_violations", 0) > 0
            else "Tỷ lệ bài tương tác cộng đồng (Q&A / Khảo sát bình luận) còn thấp, chưa vắt kiệt thuật toán thảo luận giờ đầu."
        ),
        "Thiếu chuỗi Series nhiều tập (Phần 1, Phần 2, Phần 3) từ các video Hidden Gems có tỷ lệ tương tác cao.",
        "Chưa đồng bộ hóa 100% quy trình tái sử dụng (Repurpose) 1 kịch bản gốc sang đồng thời TikTok, Facebook Reels và YouTube Shorts.",
    ]

    action_plan_30d = [
        "**Tuần 1 — Chuẩn hóa Hook 3 Giây Đầu**: Áp dụng công thức *Phản trực giác / Cảnh báo sai lầm* (giống Top 1 Outlier của kênh) cho toàn bộ video mới.",
        f"**Tuần 2 — Tối ưu Thời Lượng & Nhịp Đăng**: Duy trì kỷ luật **{max(4.0, cadence):.0f} video/tuần** tập trung vào khung thời lượng vàng **{opt_dur}**.",
        "**Tuần 3 — Kích hoạt Phễu Thảo Luận & Share**: Cuối mỗi video luôn cài 1 tài liệu/checklist miễn phí hoặc câu hỏi 2 phương án để đẩy tỷ lệ Comment & Save lên gấp đôi.",
        "**Tuần 4 — Nhân bản Đa Kênh (Cross-Platform)**: Xuất file phụ đề `.SRT` chuẩn nhịp từ Studio CapCut, đăng đồng bộ lên TikTok + Facebook Reels (link ở comment 1) + YouTube Shorts.",
    ]

    competitor_strategy = None
    if secondary_metrics and comparison:
        name_a = comparison["page_a_name"]
        name_b = comparison["page_b_name"]
        competitor_strategy = {
            "headline": comparison["verdict"],
            "why_winner_leads": (
                f"**{comparison['overall_winner']}** dẫn trước nhờ sự vượt trội về nhịp độ đăng bài và tỷ lệ "
                f"tương tác chiều sâu (Share & Thảo luận bình luận trong giờ đầu tiên)."
            ),
            "page_a_counter_attack": [
                f"Khai thác ngay khoảng trống nội dung mà **{name_b}** đang thu hút nhiều tương tác nhưng chưa đi sâu vào hướng dẫn chi tiết.",
                f"Nâng tỷ trọng Reels/Short-form của **{name_a}** và loại bỏ hoàn toàn các bài đăng chèn link trực tiếp trong phần mô tả.",
                f"Tổ chức chuỗi bài **So sánh trực diện / Case Study thực tế** — định dạng đang có tỷ lệ Share cao nhất của cả 2 trang.",
            ],
        }

    next_5_video_scripts = [
        {
            "episode": 1,
            "title": "3 Sai Lầm Khiến 90% Người Mới Thất Bại Trong Ngách Này (& Cách Sửa Trong 5 Phút)",
            "pillar": "Educational",
            "platform_fit": "TikTok + Facebook Reels + YouTube Shorts (35–45s)",
            "hook_3s": "Dừng lại ngay nếu bạn vẫn đang làm theo cách cũ này mà hỏi sao mãi không có kết quả!",
            "body_outline": "00:00–00:03: Hook cảnh báo trực diện + Text Tag đỏ.\n00:03–00:18: Chỉ ra 3 sai lầm phổ biến nhất kèm ví dụ màn hình thực tế.\n00:18–00:35: Đưa quy trình 3 bước chuẩn hóa mới nhất.",
            "cta": "Comment từ khóa 'QUYTRINH' để mình gửi trọn bộ Checklist áp dụng ngay nhé!",
            "capcut_script": "Dừng lại ngay nếu bạn vẫn đang làm theo cách cũ này. Rất nhiều bạn tốn hàng giờ mỗi ngày nhưng hiệu quả bằng không vì mắc 3 lỗi chí mạng sau. Thứ nhất là mở đầu quá lan man trong 5 giây đầu. Thứ hai là thiếu điểm nhấn thị giác trên màn hình. Và thứ ba là không có lời kêu gọi hành động rõ ràng. Hãy áp dụng ngay công thức 3 bước chuẩn này để lật ngược tình thế. Bình luận chữ QUY TRÌNH bên dưới để nhận tài liệu chi tiết nhé.",
        },
        {
            "episode": 2,
            "title": "Bóc Tách Thực Chiến: Quy Trình Từ Con Số 0 Đạt Kết Quả Đột Biến Trong 7 Ngày",
            "pillar": "Story/BTS",
            "platform_fit": "Facebook Reels + YouTube (50–60s)",
            "hook_3s": "Đây là toàn bộ hậu trường và số liệu thật 100% sau 7 ngày mình thử nghiệm phương pháp mới này.",
            "body_outline": "00:00–00:04: Show kết quả trước (Before/After) ngay khung hình đầu.\n00:04–00:35: Kể lại 3 cột mốc quan trọng nhất trong 7 ngày.\n00:35–00:50: Đúc kết bài học xương máu cho người xem.",
            "cta": "Lưu lại video này trước khi nó trôi mất và chia sẻ cho đồng đội của bạn!",
            "capcut_script": "Đây là toàn bộ hậu trường và số liệu thật một trăm phần trăm sau bảy ngày mình thử nghiệm phương pháp mới. Ngày đầu tiên mọi thứ gần như đứng yên. Nhưng ngay khi mình thay đổi cấu trúc ba giây đầu và tối ưu lại nhịp cắt cảnh trên CapCut, chỉ số giữ chân đã tăng vọt lên bảy mươi phần trăm. Bí quyết nằm ở việc cắt bỏ toàn bộ khoảng nghỉ thừa. Hãy lưu lại video này để áp dụng ngay cho kênh của bạn.",
        },
        {
            "episode": 3,
            "title": "So Sánh Trực Diện 2 Công Cụ / Phương Pháp Hot Nhất 2026: Đâu Là Lựa Chọn Tối Ưu?",
            "pillar": "Conversion/Promo",
            "platform_fit": "YouTube + TikTok Search SEO (45–60s)",
            "hook_3s": "Đừng xuống tiền hay tốn thời gian chọn bừa khi chưa xem bảng đối đầu trực diện này!",
            "body_outline": "00:00–00:03: Đặt 2 lựa chọn lên bàn cân.\n00:03–00:30: Chấm điểm 3 tiêu chí: Tốc độ, Chi phí, Độ hiệu quả thực tế.\n00:30–00:45: Kết luận lựa chọn nào phù hợp với ai.",
            "cta": "Bạn đang nghiêng về phương án 1 hay phương án 2? Để lại số 1 hoặc 2 dưới phần bình luận!",
            "capcut_script": "Đừng vội tốn thời gian chọn bừa khi chưa xem bảng đối đầu trực diện này. Hôm nay chúng ta sẽ đặt hai phương pháp phổ biến nhất lên bàn cân ở ba tiêu chí: tốc độ triển khai, chi phí và độ hiệu quả thực tế. Nếu bạn cần tốc độ nhanh và tự động hóa, phương án một chiến thắng tuyệt đối. Ngược lại nếu cần tùy biến sâu, phương án hai mới là chân ái. Bạn chọn số một hay số hai? Bình luận ngay bên dưới nhé.",
        },
        {
            "episode": 4,
            "title": "Trả Lời Bình Luận Nóng Nhất Tuần: Giải Pháp Cho Người Bận Rộn Chỉ Có 30 Phút Mỗi Ngày",
            "pillar": "Community/UGC",
            "platform_fit": "TikTok Reply Video + Facebook Group/Reels (30–40s)",
            "hook_3s": "Trả lời câu hỏi được thả tim nhiều nhất tuần qua: Chỉ có 30 phút mỗi ngày thì bắt đầu từ đâu?",
            "body_outline": "00:00–00:03: Ghim bình luận của khán giả lên màn hình.\n00:03–00:25: Chia khung 30 phút thành 3 chặng 10 phút cực gọn.\n00:25–00:35: Mời khán giả đặt câu hỏi tiếp theo.",
            "cta": "Bạn còn vướng mắc ở bước nào? Comment câu hỏi bên dưới để mình làm video giải đáp riêng nhé!",
            "capcut_script": "Trả lời câu hỏi được thả tim nhiều nhất tuần qua: Bận rộn chỉ có ba mươi phút mỗi ngày thì làm sao duy trì đều đặn? Bí quyết là chia nhỏ thành ba chặng mười phút. Mười phút đầu dùng AI lên dàn ý và câu mở đầu. Mười phút tiếp theo thu âm và tạo phụ đề tự động. Mười phút cuối xuất bản đa kênh. Bạn còn câu hỏi nào khó hơn không? Để lại dưới bình luận mình sẽ làm video trả lời nhé.",
        },
        {
            "episode": 5,
            "title": "Bộ Khung 5 Bước Đóng Gói Kiến Thức Thành Hệ Thống Tự Động Hóa (Deep-Dive Guide)",
            "pillar": "Educational",
            "platform_fit": "YouTube Long-form + Facebook/TikTok Highlights",
            "hook_3s": "Sau khi phân tích hơn 100 kênh thành công, đây là đúng 5 mảnh ghép tạo nên cỗ máy tăng trưởng tự động.",
            "body_outline": "00:00–00:05: Tổng quan 5 mảnh ghép trên sơ đồ 1 trang.\n00:05–00:40: Đi sâu từng mảnh ghép kèm ví dụ thực tế.\n00:40–00:55: Cách kết nối từ Video ngắn sang Chuyển đổi khách hàng.",
            "cta": "Xem đường link tài liệu đầy đủ mình ghim ở Bình Luận Đầu Tiên và nhấn Follow kênh!",
            "capcut_script": "Sau khi phân tích hơn một trăm kênh tăng trưởng nhanh nhất, đây là năm mảnh ghép tạo nên cỗ máy nội dung tự động. Một: Định vị đúng hai trụ cột cốt lõi. Hai: Mở đầu ba giây đánh trúng tâm lý tò mò. Ba: Phụ đề hiển thị chuẩn nhịp đọc. Bốn: Kích hoạt thảo luận ngay trong giờ đầu tiên. Và năm: Điều hướng khéo léo dưới bình luận. Nhấn theo dõi kênh ngay để không bỏ lỡ phần tiếp theo.",
        },
    ]

    return {
        "positioning": positioning,
        "content_trends": content_trends,
        "platform_keys_analysis": platform_keys_analysis,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "action_plan_30d": action_plan_30d,
        "competitor_strategy": competitor_strategy,
        "next_5_video_scripts": next_5_video_scripts,
        "model_used": "deterministic-quant-engine",
    }


def _format_strategy_markdown(
    primary_metrics: Dict[str, Any],
    strategy: Dict[str, Any],
    comparison: Optional[Dict[str, Any]] = None,
) -> str:
    """Format the full Channel Intelligence report into clean Markdown for export & reading."""
    pos = strategy.get("positioning", {})
    trends = strategy.get("content_trends", {})
    p_keys = strategy.get("platform_keys_analysis", {})
    strengths = strategy.get("strengths", [])
    weaknesses = strategy.get("weaknesses", [])
    actions = strategy.get("action_plan_30d", [])
    scripts = strategy.get("next_5_video_scripts", [])

    lines = [
        f"# 📊 Báo Cáo Tình Báo Kênh: {primary_metrics.get('channel_title') or primary_metrics.get('handle')}",
        f"- **Nền tảng**: {primary_metrics.get('platform', '').upper()} | **Điểm Sức Khỏe Kênh**: `{primary_metrics.get('channel_health_score')}/100`",
        f"- **Trung vị Lượt xem (Median)**: `{primary_metrics.get('median_views', 0):,}` | **Đỉnh Viral (Max Outlier)**: `{primary_metrics.get('max_views', 0):,}`",
        f"- **Tương tác Trọng số (Weighted ER)**: `{primary_metrics.get('avg_weighted_engagement_rate')}%` | **Nhịp đăng**: `{primary_metrics.get('posting_cadence_per_week')} bài/tuần`",
        "",
        "## 1. Định Hướng Kênh & Chân Dung Độc Giả (Channel Positioning)",
        f"- **Định vị Ngách (Core Niche)**: {pos.get('core_niche', '')}",
        f"- **Chân dung Khán giả (Persona)**: {pos.get('audience_persona', '')}",
        f"- **Giọng điệu Thương hiệu**: {pos.get('brand_voice', '')}",
        f"- **Đánh giá Trụ cột Nội dung**: {pos.get('pillar_assessment', '')}",
        "",
        "## 2. Xu Hướng Nội Dung & Động Lực Tăng Trưởng (Content Trends)",
        f"- **Chẩn đoán Đà tăng trưởng**: {trends.get('momentum_diagnosis', '')}",
        f"- **Chủ đề Chiến thắng (Winning Topics)**: {trends.get('winning_topics', '')}",
        f"- **Cảnh báo Bão hòa (Fatigue Warning)**: {trends.get('fatigue_warning', '')}",
        "",
        "## 3. Phân Tích Key Thành Công Ở 3 Nền Tảng (TikTok · Facebook · YouTube)",
        f"- {p_keys.get('tiktok_key', '')}",
        f"- {p_keys.get('facebook_key', '')}",
        f"- {p_keys.get('youtube_key', '')}",
        "",
        "## 4. Điểm Mạnh Cần Nhân Bản & Điểm Nghẽn Cần Khắc Phục",
        "### ✅ Điểm mạnh cốt lõi",
    ]
    for s in strengths:
        lines.append(f"- {s}")
    lines.append("\n### ⚠️ Điểm nghẽn cần cải thiện ngay")
    for w in weaknesses:
        lines.append(f"- {w}")

    if comparison and strategy.get("competitor_strategy"):
        comp_strat = strategy["competitor_strategy"]
        lines.extend(
            [
                "",
                f"## 5. Đối Đầu Trực Diện: {comparison.get('page_a_name')} vs. {comparison.get('page_b_name')}",
                f"- **Kết luận tổng quan**: {comp_strat.get('headline', '')}",
                f"- **Lý do dẫn trước**: {comp_strat.get('why_winner_leads', '')}",
                "### ⚔️ Chiến thuật vượt mặt đối thủ",
            ]
        )
        for step in comp_strat.get("page_a_counter_attack", []):
            lines.append(f"- {step}")

    lines.append("\n## 6. Lộ Trình Hành Động Cải Thiện Kênh Trong 30 Ngày")
    for act in actions:
        lines.append(f"- {act}")

    lines.append("\n## 7. Playbook 5 Kịch Bản Video Tiếp Theo (Sẵn Sàng Cho Studio CapCut)")
    for sc in scripts:
        lines.extend(
            [
                f"### 🎬 Tập {sc.get('episode')}: {sc.get('title')}",
                f"- **Trụ cột**: `{sc.get('pillar')}` | **Nền tảng tối ưu**: {sc.get('platform_fit')}",
                f"- **Hook 3 giây đầu**: *\"{sc.get('hook_3s')}\"*",
                f"- **Lời kêu gọi (CTA)**: {sc.get('cta')}",
            ]
        )

    return "\n".join(lines)


def generate_channel_strategy_with_ai(
    primary_metrics: Dict[str, Any],
    secondary_metrics: Optional[Dict[str, Any]] = None,
    comparison: Optional[Dict[str, Any]] = None,
    focus_goal: str = "comprehensive",
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Run Gemini AI on the channel metrics to produce deep strategic recommendations, with deterministic fallback."""
    base_strategy = _build_deterministic_strategy(
        primary_metrics=primary_metrics,
        secondary_metrics=secondary_metrics,
        comparison=comparison,
        focus_goal=focus_goal,
    )

    resolved_key = (api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("MASTER_GEMINI_API_KEY") or "").strip()
    if not resolved_key or os.environ.get("LENSAI_SKIP_LIVE_GEMINI_CHANNEL") == "1":
        base_strategy["raw_markdown"] = _format_strategy_markdown(primary_metrics, base_strategy, comparison)
        return base_strategy

    # Select Gemini model
    target_model = "gemini-2.5-flash"
    if model and "pro" in model.lower():
        target_model = "gemini-2.5-pro"

    top_posts_summary = [
        {
            "title": p["title"],
            "views": p["views"],
            "outlier_ratio": p["outlier_ratio"],
            "weighted_er_pct": p["weighted_engagement_rate"],
            "pillar": p["pillar"],
            "duration_sec": p["duration"],
        }
        for p in (primary_metrics.get("posts") or [])[:12]
    ]

    comp_context = ""
    if secondary_metrics and comparison:
        comp_context = (
            f"\nDỮ LIỆU ĐỐI ĐẦU 2 TRANG ({comparison['page_a_name']} vs {comparison['page_b_name']}):\n"
            f"- Kết luận số liệu: {comparison['verdict']}\n"
            f"- Top bài của Trang B: {json.dumps([{'title': p['title'], 'views': p['views'], 'pillar': p['pillar']} for p in (secondary_metrics.get('posts') or [])[:6]], ensure_ascii=False)}\n"
        )

    prompt = f"""Bạn là Giám đốc Chiến lược Nội dung Đa nền tảng (TikTok, Facebook REACH, YouTube) của LensAI 4.0.
Dưới đây là số liệu định lượng thực tế của kênh "{primary_metrics.get('channel_title') or primary_metrics.get('handle')}" trên nền tảng {primary_metrics.get('platform', '').upper()}:
- Điểm sức khỏe kênh: {primary_metrics.get('channel_health_score')}/100 | Đà tăng trưởng: {primary_metrics.get('momentum_label')}
- Trung vị lượt xem (Median): {primary_metrics.get('median_views'):,} | Đỉnh Viral: {primary_metrics.get('max_views'):,}
- Tỷ lệ tương tác trọng số: {primary_metrics.get('avg_weighted_engagement_rate')}% | Share/Like: {primary_metrics.get('avg_share_to_like_pct')}% | Comment/Like: {primary_metrics.get('avg_comment_to_like_pct')}%
- Tần suất đăng: {primary_metrics.get('posting_cadence_per_week')} bài/tuần | Thời lượng hiệu quả nhất: {primary_metrics.get('optimal_duration_tier')}
- Phân bổ trụ cột nội dung: {json.dumps(primary_metrics.get('pillar_distribution', []), ensure_ascii=False)}
- Danh sách video tiêu biểu: {json.dumps(top_posts_summary, ensure_ascii=False)}
{comp_context}

Hãy trả về ĐÚNG 1 khối JSON hợp lệ (không bọc markdown ngoài nếu có thể) theo cấu trúc sau bằng tiếng Việt sắc bén, thực chiến:
{{
  "positioning": {{
    "core_niche": "Định vị ngách cốt lõi của kênh...",
    "audience_persona": "Chân dung khán giả mục tiêu...",
    "brand_voice": "Giọng điệu thương hiệu...",
    "pillar_assessment": "Đánh giá tỷ trọng các trụ cột nội dung..."
  }},
  "content_trends": {{
    "momentum_diagnosis": "Chẩn đoán xu hướng tăng/giảm của kênh...",
    "winning_topics": "Các chủ đề và công thức Hook đang thắng lớn...",
    "fatigue_warning": "Cảnh báo các dạng nội dung đang làm tụt view..."
  }},
  "platform_keys_analysis": {{
    "tiktok_key": "Phân tích Key TikTok (Hook 3s, Loop, TikTok SEO) áp dụng cho kênh này...",
    "facebook_key": "Phân tích Key Facebook theo khung REACH (Reels discovery, thảo luận giờ đầu, kỷ luật không chèn link trực tiếp)...",
    "youtube_key": "Phân tích Key YouTube (Title/Thumbnail Curiosity Gap, Shorts-to-Longform funnel, AVD)..."
  }},
  "strengths": ["Điểm mạnh 1...", "Điểm mạnh 2...", "Điểm mạnh 3...", "Điểm mạnh 4..."],
  "weaknesses": ["Điểm nghẽn cần sửa 1...", "Điểm nghẽn 2...", "Điểm nghẽn 3...", "Điểm nghẽn 4..."],
  "action_plan_30d": ["Bước hành động 1...", "Bước 2...", "Bước 3...", "Bước 4..."]
}}"""

    try:
        client = genai.Client(api_key=resolved_key)
        resp = client.models.generate_content(
            model=target_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.35,
                response_mime_type="application/json",
            ),
        )
        raw_text = (resp.text or "").strip()
        # Strip optional markdown code fences if present
        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text)
        parsed = json.loads(raw_text)
        if isinstance(parsed, dict):
            for section in ("positioning", "content_trends", "platform_keys_analysis"):
                if isinstance(parsed.get(section), dict):
                    base_strategy[section].update(parsed[section])
            for list_key in ("strengths", "weaknesses", "action_plan_30d"):
                if isinstance(parsed.get(list_key), list) and len(parsed[list_key]) >= 2:
                    base_strategy[list_key] = [str(x) for x in parsed[list_key][:6]]
            base_strategy["model_used"] = target_model
    except Exception as exc:
        logger.warning("Gemini channel synthesis fallback to deterministic engine: %s", exc)

    base_strategy["raw_markdown"] = _format_strategy_markdown(primary_metrics, base_strategy, comparison)
    return base_strategy
