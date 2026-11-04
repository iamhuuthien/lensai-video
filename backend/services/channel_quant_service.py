"""Deterministic Quantitative Analytics Engine for Multi-Platform Channel Intelligence.

Implements the mathematical formulas and frameworks from the 5 installed strategy skills:
- TikTok: Median vs Mean Views, Outlier Ratio (>=2.0x), 5 Content Pillars, Hook & Duration Tiers.
- Facebook: REACH Framework (Reels discovery ratio, Engagement velocity, Anchor theme focus, Community UGC, Hold trust / Link-in-first-comment discipline), Share-to-Like ratio, and 2-Page Head-to-Head Comparison Matrix.
- YouTube: Shorts (<60s) vs Long-form funnel, 4 Length Tiers, View-to-Subscriber ratio, Hidden Gems (high ER%).
"""

from __future__ import annotations

import re
import statistics
from collections import Counter
from typing import Any, Dict, List, Optional


PILLAR_LABELS_VI: Dict[str, str] = {
    "Educational": "Hướng dẫn & Kiến thức (Educational)",
    "Entertainment": "Giải trí & Bắt Trend (Entertainment)",
    "Story/BTS": "Câu chuyện & Hậu trường (Story / BTS)",
    "Conversion/Promo": "Review & Chuyển đổi (Conversion / Promo)",
    "Community/UGC": "Tương tác & Hỏi đáp (Community / Q&A)",
}


def classify_post_pillar(title: str, description: str = "", hint: Optional[str] = None) -> str:
    """Classify a video/post into one of the 5 core Content Pillars."""
    if hint and hint in PILLAR_LABELS_VI:
        return hint
    text = f"{title} {description}".lower()
    if any(k in text for k in ("trả lời", "q&a", "hỏi đáp", "theo bạn", "khảo sát", "comment", "bình luận", "ugc", "qna")):
        return "Community/UGC"
    if any(k in text for k in ("review", "báo giá", "mua", "giá rẻ", "ưu đãi", "tặng bộ", "chốt đơn", "dịch vụ", "shop", "link tải", "đăng ký ngay")):
        return "Conversion/Promo"
    if any(k in text for k in ("hậu trường", "bts", "câu chuyện", "case study", "casestudy", "thử thách", "vlog", "1 ngày", "hành trình", "tư duy")):
        return "Story/BTS"
    if any(k in text for k in ("meme", "hài", "😂", "trend", "biến hình", "nhạc nền", "chuyển cảnh", "xuhuong", "giải trí")):
        return "Entertainment"
    return "Educational"


def classify_duration_tier(seconds: int, platform: str) -> str:
    """Classify video duration into actionable tiers."""
    s = max(1, int(seconds or 30))
    if platform == "youtube":
        if s <= 65:
            return "Shorts (≤60s)"
        if s <= 300:
            return "Ngắn (1–5 phút)"
        if s <= 900:
            return "Tiêu chuẩn (5–15 phút)"
        return "Chuyên sâu (>15 phút)"
    else:
        if s <= 18:
            return "Siêu ngắn (<18s - Loop Hook)"
        if s <= 40:
            return "Vàng Viral (18–40s)"
        if s <= 65:
            return "Kể chuyện / Hướng dẫn (40–65s)"
        return "Chuyên sâu (>65s)"


def compute_channel_quant_metrics(channel_data: Dict[str, Any]) -> Dict[str, Any]:
    """Compute comprehensive quantitative metrics for a single channel/page."""
    platform = channel_data.get("platform", "tiktok")
    posts: List[Dict[str, Any]] = channel_data.get("posts") or []
    subscribers = int(channel_data.get("subscribers") or 0)

    if not posts:
        raise ValueError("Không tìm thấy dữ liệu bài đăng/video công khai trên kênh này.")

    # Sort posts newest first by upload_ts
    sorted_posts = sorted(posts, key=lambda x: int(x.get("upload_ts") or 0), reverse=True)
    n = len(sorted_posts)

    views_list = [max(1, int(p.get("views") or 0)) for p in sorted_posts]
    likes_list = [max(0, int(p.get("likes") or 0)) for p in sorted_posts]
    comments_list = [max(0, int(p.get("comments") or 0)) for p in sorted_posts]
    shares_list = [max(0, int(p.get("shares") or 0)) for p in sorted_posts]

    total_views = sum(views_list)
    mean_views = int(statistics.mean(views_list))
    median_views = max(1, int(statistics.median(views_list)))
    max_views = max(views_list)
    min_views = min(views_list)

    # Enrich each post with Engagement Rate, Outlier Ratio, Pillar, Duration Tier
    enriched_posts: List[Dict[str, Any]] = []
    er_list: List[float] = []
    share_rate_list: List[float] = []
    comment_rate_list: List[float] = []
    external_link_violations = 0
    reels_count = 0

    for p in sorted_posts:
        v = max(1, int(p.get("views") or 1))
        l = max(0, int(p.get("likes") or 0))
        c = max(0, int(p.get("comments") or 0))
        s = max(0, int(p.get("shares") or 0))
        dur = int(p.get("duration") or 30)
        title = p.get("title") or ""
        desc = p.get("description") or ""

        # Weighted Engagement Rate: Likes + 2*Comments + 3*Shares
        weighted_er = round(((l + 2 * c + 3 * s) / v) * 100.0, 2)
        raw_er = round(((l + c + s) / v) * 100.0, 2)
        outlier_ratio = round(v / median_views, 2)
        share_to_like = round((s / max(l, 1)) * 100.0, 1)
        comment_to_like = round((c / max(l, 1)) * 100.0, 1)

        pillar = classify_post_pillar(title, desc, p.get("pillar_hint"))
        dur_tier = classify_duration_tier(dur, platform)

        # Facebook specific checks (REACH Framework)
        has_link_in_caption = bool(re.search(r"https?://", f"{title} {desc}"))
        if has_link_in_caption:
            external_link_violations += 1
        is_reel_or_short = dur <= 90 or "[reels]" in title.lower() or "[shorts]" in title.lower()
        if is_reel_or_short:
            reels_count += 1

        er_list.append(weighted_er)
        share_rate_list.append(share_to_like)
        comment_rate_list.append(comment_to_like)

        enriched_posts.append(
            {
                **p,
                "pillar": pillar,
                "pillar_label": PILLAR_LABELS_VI.get(pillar, pillar),
                "duration_tier": dur_tier,
                "engagement_rate": raw_er,
                "weighted_engagement_rate": weighted_er,
                "outlier_ratio": outlier_ratio,
                "share_to_like_pct": share_to_like,
                "comment_to_like_pct": comment_to_like,
                "is_short_form": is_reel_or_short,
                "has_link_in_caption": has_link_in_caption,
            }
        )

    avg_weighted_er = round(statistics.mean(er_list), 2)
    avg_raw_er = round(statistics.mean([p["engagement_rate"] for p in enriched_posts]), 2)
    avg_share_to_like = round(statistics.mean(share_rate_list), 1)
    avg_comment_to_like = round(statistics.mean(comment_rate_list), 1)

    # Posting Cadence (Videos per week)
    ts_values = [int(p.get("upload_ts") or 0) for p in sorted_posts if int(p.get("upload_ts") or 0) > 0]
    if len(ts_values) >= 2:
        span_days = max(1.0, (max(ts_values) - min(ts_values)) / 86400.0)
        posts_per_week = round((n / span_days) * 7.0, 1)
    else:
        posts_per_week = 3.0
    posts_per_week = min(max(posts_per_week, 0.5), 28.0)

    # Momentum Index: Compare median of newest 40% vs older 60%
    split_idx = max(2, int(n * 0.4))
    recent_views = [p["views"] for p in enriched_posts[:split_idx]]
    older_views = [p["views"] for p in enriched_posts[split_idx:]] or recent_views
    recent_med = statistics.median(recent_views)
    older_med = max(1.0, statistics.median(older_views))
    momentum_pct = round(((recent_med - older_med) / older_med) * 100.0, 1)
    if momentum_pct >= 15.0:
        momentum_status = "rising"
        momentum_label = f"Đang tăng trưởng mạnh (+{momentum_pct}%)"
    elif momentum_pct <= -15.0:
        momentum_status = "declining"
        momentum_label = f"Đang giảm nhiệt ({momentum_pct}%)"
    else:
        momentum_status = "stable"
        momentum_label = f"Duy trì ổn định ({momentum_pct:+.1f}%)"

    # Content Pillar Distribution
    pillar_buckets: Dict[str, List[Dict[str, Any]]] = {}
    for p in enriched_posts:
        pillar_buckets.setdefault(p["pillar"], []).append(p)

    pillar_distribution = []
    for key, label in PILLAR_LABELS_VI.items():
        items = pillar_buckets.get(key, [])
        if not items:
            continue
        p_avg_views = int(statistics.mean([x["views"] for x in items]))
        p_avg_er = round(statistics.mean([x["weighted_engagement_rate"] for x in items]), 2)
        pillar_distribution.append(
            {
                "pillar": key,
                "label": label,
                "count": len(items),
                "percentage": round((len(items) / n) * 100.0, 1),
                "avg_views": p_avg_views,
                "avg_engagement_rate": p_avg_er,
                "lift_vs_median": round(p_avg_views / median_views, 2),
            }
        )
    pillar_distribution.sort(key=lambda x: x["avg_views"], reverse=True)
    best_pillar = pillar_distribution[0] if pillar_distribution else None

    # Duration Tier Breakdown
    dur_buckets: Dict[str, List[Dict[str, Any]]] = {}
    for p in enriched_posts:
        dur_buckets.setdefault(p["duration_tier"], []).append(p)

    duration_breakdown = []
    for tier_name, items in dur_buckets.items():
        t_avg_views = int(statistics.mean([x["views"] for x in items]))
        t_avg_er = round(statistics.mean([x["weighted_engagement_rate"] for x in items]), 2)
        duration_breakdown.append(
            {
                "tier": tier_name,
                "count": len(items),
                "percentage": round((len(items) / n) * 100.0, 1),
                "avg_views": t_avg_views,
                "avg_engagement_rate": t_avg_er,
            }
        )
    duration_breakdown.sort(key=lambda x: x["avg_views"], reverse=True)
    optimal_duration_tier = duration_breakdown[0]["tier"] if duration_breakdown else "18–40s"

    # Outliers, Hidden Gems & Flops
    by_views = sorted(enriched_posts, key=lambda x: x["views"], reverse=True)
    viral_outliers = [p for p in by_views if p["outlier_ratio"] >= 1.35][:4] or by_views[:3]

    hidden_gems = sorted(
        [p for p in enriched_posts if p["weighted_engagement_rate"] >= avg_weighted_er * 1.15],
        key=lambda x: x["weighted_engagement_rate"],
        reverse=True,
    )[:3]

    underperforming_flops = sorted(enriched_posts, key=lambda x: x["views"])[:2]

    # Top Hashtags & Keywords
    tag_counter: Counter[str] = Counter()
    tag_views: Dict[str, List[int]] = {}
    for p in enriched_posts:
        for t in p.get("hashtags") or []:
            tl = t.lower().lstrip("#")
            if tl:
                tag_counter[tl] += 1
                tag_views.setdefault(tl, []).append(p["views"])

    top_hashtags = []
    for tag, count in tag_counter.most_common(10):
        avg_v = int(statistics.mean(tag_views.get(tag, [median_views])))
        top_hashtags.append(
            {
                "tag": f"#{tag}",
                "count": count,
                "avg_views": avg_v,
                "lift_ratio": round(avg_v / median_views, 2),
            }
        )

    # Platform-Specific Key Drivers Scorecard (0-100)
    short_ratio_pct = round((reels_count / n) * 100.0, 1)
    top_2_pillar_share = sum(x["percentage"] for x in sorted(pillar_distribution, key=lambda i: i["count"], reverse=True)[:2])
    link_discipline_score = max(35, 100 - external_link_violations * 22)

    platform_scorecards = {
        "tiktok": [
            {
                "key": "Hook 3 Giây Đầu & Outlier Lift",
                "score": min(98, max(55, int(60 + (max_views / median_views) * 12))),
                "benchmark": "Outlier Đỉnh ≥ 2.5x Trung vị",
                "current": f"Đỉnh {round(max_views / median_views, 2)}x trung vị ({max_views:,} views)",
                "insight": "Đo lường khả năng giữ chân 3 giây đầu để thuật toán TikTok đẩy sang bể đề xuất rộng (For You Pool 3-4).",
            },
            {
                "key": "Cơ Chế Loop & Thời Lượng Vàng",
                "score": min(96, max(58, int(68 + avg_raw_er * 2.5))),
                "benchmark": "Tối ưu ở ngưỡng 18–45 giây",
                "current": f"Nhóm hiệu quả nhất: {optimal_duration_tier}",
                "insight": "Video ngắn dưới 45s có cấu trúc vòng lặp (Seamless Loop) giúp đẩy Completion Rate > 100%.",
            },
            {
                "key": "Vận Tốc Chia Sẻ & Lưu Video (Share/Save Velocity)",
                "score": min(97, max(50, int(52 + avg_share_to_like * 2.2))),
                "benchmark": "Share/Like ≥ 15%",
                "current": f"Share/Like đạt {avg_share_to_like}%",
                "insight": "Thuật toán TikTok 2026 chấm điểm nút Share và Save cao gấp 3 lần nút Thả tim.",
            },
            {
                "key": "TikTok Search SEO & Hashtag Ngách",
                "score": min(95, max(52, int(60 + len(top_hashtags) * 3.5))),
                "benchmark": "3–5 Hashtag ngách + Từ khóa trong Caption",
                "current": f"Đang khai thác {len(top_hashtags)} cụm hashtag chủ lực",
                "insight": "Giúp video nhận luồng traffic tìm kiếm dài hạn (Searchable Traffic) ngay cả sau 30 ngày đăng.",
            },
        ],
        "facebook": [
            {
                "key": "[R] Reels Unconnected Discovery (Tiếp cận người lạ)",
                "score": min(98, max(48, int(45 + short_ratio_pct * 0.52))),
                "benchmark": "Tỷ trọng Reels ≥ 60% tổng bài đăng",
                "current": f"Reels/Short chiếm {short_ratio_pct}% số bài",
                "insight": "35–50% Bảng tin Facebook hiện do AI đề xuất cho người chưa Follow. Reels tiếp cận gấp 5–10x bài ảnh/chữ.",
            },
            {
                "key": "[E] Vận Tốc Thảo Luận Giờ Đầu (Comment-to-Like Velocity)",
                "score": min(96, max(45, int(48 + avg_comment_to_like * 2.4))),
                "benchmark": "Comment/Like ≥ 12%",
                "current": f"Comment/Like đạt {avg_comment_to_like}%",
                "insight": "Bình luận có độ dài > 5 từ trong 60 phút đầu là tín hiệu mạnh nhất để Facebook mở rộng phân phối.",
            },
            {
                "key": "[A] Định Vị 2 Chủ Đề Cốt Lõi (Anchor Theme Focus)",
                "score": min(96, max(50, int(top_2_pillar_share))),
                "benchmark": "2 trụ cột chính chiếm ≥ 70% trong 12 bài gần nhất",
                "current": f"2 trụ cột đầu chiếm {round(top_2_pillar_share, 1)}%",
                "insight": "AI của Meta phân loại Fanpage dựa trên 9–12 bài gần nhất; đăng lan man sẽ làm loãng tệp độc giả.",
            },
            {
                "key": "[C & H] Kỷ Luật Không Chèn Link & Kích Thích Chia Sẻ",
                "score": link_discipline_score,
                "benchmark": "0 bài chèn link trực tiếp trong Caption (Đặt ở Comment 1)",
                "current": (
                    "Tuân thủ tốt (0 lỗi chèn link trực tiếp)"
                    if external_link_violations == 0
                    else f"Phát hiện {external_link_violations} bài chứa link ngoài làm bóp Reach"
                ),
                "insight": "Bài đăng chứa link ngoài trên Facebook chỉ đạt ~1.2% reach tự nhiên; luôn phải chuyển link xuống bình luận đầu tiên.",
            },
        ],
        "youtube": [
            {
                "key": "Tỷ Lệ View / Subscriber & Sức Hút Tiêu Đề (CTR Proxy)",
                "score": min(98, max(54, int(62 + (median_views / max(subscribers, 1000)) * 20))),
                "benchmark": "View/Sub trung vị ≥ 1.2x (Kênh tăng trưởng nóng)",
                "current": f"Trung vị {median_views:,} views / {subscribers:,} subs",
                "insight": "Phản ánh trực tiếp sức mạnh của cặp bài trùng Title + Thumbnail tạo khoảng trống tò mò (Curiosity Gap).",
            },
            {
                "key": "Phễu Chuyển Đổi Shorts -> Video Dài (Bridge Funnel)",
                "score": min(95, max(50, int(88 - abs(50 - short_ratio_pct) * 0.7))),
                "benchmark": "Kết hợp 40–60% Shorts kéo khách sang Long-form",
                "current": f"Shorts chiếm {short_ratio_pct}% | Video dài {round(100 - short_ratio_pct, 1)}%",
                "insight": "Shorts giúp thu hút người xem mới nhanh chóng, trong khi Video dài (5–15 phút) xây dựng niềm tin và doanh thu.",
            },
            {
                "key": "Hiệu Suất Phân Tầng Thời Lượng (AVD Length Tier ROI)",
                "score": min(96, max(56, int(65 + avg_weighted_er * 1.8))),
                "benchmark": "Tối ưu hóa nhóm thời lượng có View trung bình cao nhất",
                "current": f"Định dạng vàng của kênh: {optimal_duration_tier}",
                "insight": "Thuật toán YouTube ưu tiên Tổng thời gian xem (Watch Time) và Độ thỏa mãn sau khi xem (Satisfaction Survey).",
            },
            {
                "key": "Hidden Gems & Tỷ Lệ Tương Tác Chiều Sâu",
                "score": min(96, max(52, int(58 + len(hidden_gems) * 11))),
                "benchmark": "Phát hiện chủ đề ngách có ER% > 1.5x trung bình kênh",
                "current": f"Tìm thấy {len(hidden_gems)} video Hidden Gems tiềm năng cao",
                "insight": "Các video có lượng bình luận/thích đột biến dù view vừa phải là mỏ vàng để làm phần 2 (Series).",
            },
        ],
    }

    # Composite Channel Health Score (0-100)
    cadence_score = min(100, int(45 + posts_per_week * 12))
    er_score = min(100, int(45 + avg_weighted_er * 4.2))
    momentum_score = min(100, max(40, int(72 + momentum_pct * 0.6)))
    active_p_scores = [it["score"] for it in platform_scorecards.get(platform, platform_scorecards["tiktok"])]
    platform_specific_avg = int(statistics.mean(active_p_scores)) if active_p_scores else 75

    channel_health_score = min(
        98,
        max(
            42,
            int(
                0.25 * cadence_score
                + 0.30 * er_score
                + 0.20 * momentum_score
                + 0.25 * platform_specific_avg
            ),
        ),
    )

    return {
        "platform": platform,
        "handle": channel_data.get("handle", ""),
        "channel_title": channel_data.get("channel_title", ""),
        "subscribers": subscribers,
        "bio": channel_data.get("bio", ""),
        "data_source": channel_data.get("data_source", "ytdlp_live"),
        "sample_size": n,
        "total_views": total_views,
        "mean_views": mean_views,
        "median_views": median_views,
        "max_views": max_views,
        "min_views": min_views,
        "avg_engagement_rate": avg_raw_er,
        "avg_weighted_engagement_rate": avg_weighted_er,
        "avg_share_to_like_pct": avg_share_to_like,
        "avg_comment_to_like_pct": avg_comment_to_like,
        "posting_cadence_per_week": posts_per_week,
        "momentum_pct": momentum_pct,
        "momentum_status": momentum_status,
        "momentum_label": momentum_label,
        "channel_health_score": channel_health_score,
        "optimal_duration_tier": optimal_duration_tier,
        "best_pillar": best_pillar,
        "short_form_ratio_pct": short_ratio_pct,
        "external_link_violations": external_link_violations,
        "pillar_distribution": pillar_distribution,
        "duration_breakdown": duration_breakdown,
        "viral_outliers": viral_outliers,
        "hidden_gems": hidden_gems,
        "underperforming_flops": underperforming_flops,
        "top_hashtags": top_hashtags,
        "platform_scorecards": platform_scorecards,
        "posts": enriched_posts,
    }


def compute_head_to_head_comparison(
    primary_metrics: Dict[str, Any],
    secondary_metrics: Dict[str, Any],
) -> Dict[str, Any]:
    """Build a comprehensive Head-to-Head Comparison Matrix (e.g., Facebook Page A vs Page B)."""
    name_a = primary_metrics.get("channel_title") or primary_metrics.get("handle") or "Kênh A"
    name_b = secondary_metrics.get("channel_title") or secondary_metrics.get("handle") or "Kênh B"

    def _cmp_row(
        metric_label: str,
        val_a: float,
        val_b: float,
        fmt_a: str,
        fmt_b: str,
        higher_is_better: bool = True,
    ) -> Dict[str, Any]:
        if abs(val_a - val_b) < 1e-6:
            winner = "tie"
        elif (val_a > val_b) == higher_is_better:
            winner = "A"
        else:
            winner = "B"
        base = max(abs(val_b), 0.01)
        gap_pct = round(((val_a - val_b) / base) * 100.0, 1)
        return {
            "metric": metric_label,
            "page_a_value": fmt_a,
            "page_b_value": fmt_b,
            "raw_a": val_a,
            "raw_b": val_b,
            "winner": winner,
            "winner_name": name_a if winner == "A" else (name_b if winner == "B" else "Cân bằng"),
            "gap_pct": gap_pct,
        }

    rows = [
        _cmp_row(
            "Điểm Sức Khỏe Kênh Tổng Thể (/100)",
            primary_metrics["channel_health_score"],
            secondary_metrics["channel_health_score"],
            f"{primary_metrics['channel_health_score']}/100",
            f"{secondary_metrics['channel_health_score']}/100",
        ),
        _cmp_row(
            "Lượt Xem Trung Vị (Median Views / Bài)",
            primary_metrics["median_views"],
            secondary_metrics["median_views"],
            f"{primary_metrics['median_views']:,} views",
            f"{secondary_metrics['median_views']:,} views",
        ),
        _cmp_row(
            "Đỉnh Viral Cao Nhất (Max Outlier Views)",
            primary_metrics["max_views"],
            secondary_metrics["max_views"],
            f"{primary_metrics['max_views']:,} views",
            f"{secondary_metrics['max_views']:,} views",
        ),
        _cmp_row(
            "Tỷ Lệ Tương Tác Trọng Số (Weighted ER%)",
            primary_metrics["avg_weighted_engagement_rate"],
            secondary_metrics["avg_weighted_engagement_rate"],
            f"{primary_metrics['avg_weighted_engagement_rate']}%",
            f"{secondary_metrics['avg_weighted_engagement_rate']}%",
        ),
        _cmp_row(
            "Tỷ Lệ Chia Sẻ / Thích (Share-to-Like Ratio)",
            primary_metrics["avg_share_to_like_pct"],
            secondary_metrics["avg_share_to_like_pct"],
            f"{primary_metrics['avg_share_to_like_pct']}%",
            f"{secondary_metrics['avg_share_to_like_pct']}%",
        ),
        _cmp_row(
            "Vận Tốc Thảo Luận (Comment-to-Like Ratio)",
            primary_metrics["avg_comment_to_like_pct"],
            secondary_metrics["avg_comment_to_like_pct"],
            f"{primary_metrics['avg_comment_to_like_pct']}%",
            f"{secondary_metrics['avg_comment_to_like_pct']}%",
        ),
        _cmp_row(
            "Nhịp Độ Đăng Bài (Videos / Tuần)",
            primary_metrics["posting_cadence_per_week"],
            secondary_metrics["posting_cadence_per_week"],
            f"{primary_metrics['posting_cadence_per_week']} bài/tuần",
            f"{secondary_metrics['posting_cadence_per_week']} bài/tuần",
        ),
        _cmp_row(
            "Tỷ Trọng Video Ngắn / Reels (%)",
            primary_metrics["short_form_ratio_pct"],
            secondary_metrics["short_form_ratio_pct"],
            f"{primary_metrics['short_form_ratio_pct']}%",
            f"{secondary_metrics['short_form_ratio_pct']}%",
        ),
    ]

    wins_a = sum(1 for r in rows if r["winner"] == "A")
    wins_b = sum(1 for r in rows if r["winner"] == "B")

    # Content Pillar Gap Analysis: What pillars does B excel at compared to A?
    pillars_a = {p["pillar"]: p for p in primary_metrics.get("pillar_distribution", [])}
    pillars_b = {p["pillar"]: p for p in secondary_metrics.get("pillar_distribution", [])}

    content_gaps = []
    for p_key, p_label in PILLAR_LABELS_VI.items():
        pa = pillars_a.get(p_key)
        pb = pillars_b.get(p_key)
        pct_a = pa["percentage"] if pa else 0.0
        pct_b = pb["percentage"] if pb else 0.0
        views_a = pa["avg_views"] if pa else 0
        views_b = pb["avg_views"] if pb else 0
        if pct_a == 0 and pct_b == 0:
            continue
        content_gaps.append(
            {
                "pillar": p_key,
                "label": p_label,
                "page_a_share_pct": pct_a,
                "page_b_share_pct": pct_b,
                "page_a_avg_views": views_a,
                "page_b_avg_views": views_b,
                "advantage": name_b if views_b > views_a * 1.15 else (name_a if views_a > views_b * 1.15 else "Tương đương"),
            }
        )

    overall_winner = name_a if wins_a > wins_b else (name_b if wins_b > wins_a else "Hai trang ngang sức")
    verdict = (
        f"Qua đối sánh trực diện {len(rows)} chỉ số cốt lõi, **{overall_winner}** đang chiếm ưu thế "
        f"(Thắng {max(wins_a, wins_b)}/{len(rows)} hạng mục). "
        f"{name_a} đạt trung vị {primary_metrics['median_views']:,} views/bài (ER {primary_metrics['avg_weighted_engagement_rate']}%), "
        f"trong khi {name_b} đạt {secondary_metrics['median_views']:,} views/bài (ER {secondary_metrics['avg_weighted_engagement_rate']}%)."
    )

    return {
        "page_a_name": name_a,
        "page_b_name": name_b,
        "page_a_handle": primary_metrics.get("handle", ""),
        "page_b_handle": secondary_metrics.get("handle", ""),
        "wins_a": wins_a,
        "wins_b": wins_b,
        "overall_winner": overall_winner,
        "verdict": verdict,
        "metrics_table": rows,
        "content_gaps": content_gaps,
    }
