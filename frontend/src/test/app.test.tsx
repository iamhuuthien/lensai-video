import { describe, it, expect } from "vitest";
import { FreeToolsService, VIRAL_HOOKS } from "../services/freeTools";
import { ExportService } from "../services/export";

describe("FreeToolsService", () => {
  it("converts script text to valid SRT subtitle format", () => {
    const script = "Xin chào mọi người. Hôm nay mình sẽ chia sẻ mẹo làm video.";
    const srt = FreeToolsService.generateSrtFromScript(script, 150, 5);

    expect(srt).toContain("1\n");
    expect(srt).toContain("-->");
    expect(srt).toContain("Xin chào");
  });

  it("calculates pacing and word count accurately", () => {
    const text = "Một hai ba bốn năm sáu bảy tám chín mười.";
    const pacing = FreeToolsService.calculatePacing(text);

    expect(pacing.wordCount).toBe(10);
    expect(pacing.standardSeconds).toBeGreaterThan(0);
    expect(pacing.pacingCategory).toBe("Siêu ngắn (Dưới 30s)");
  });

  it("has curated viral hooks with frameworks", () => {
    expect(VIRAL_HOOKS.length).toBeGreaterThanOrEqual(10);
    const firstHook = VIRAL_HOOKS[0];
    expect(firstHook.category).toBeDefined();
    expect(firstHook.hook).toBeDefined();
    expect(firstHook.framework).toBeDefined();
  });
});

describe("ExportService", () => {
  it("formats VND currency cleanly", () => {
    expect(ExportService.formatVnd(29000)).toBe("29.000đ");
    expect(ExportService.formatVnd(99000)).toBe("99.000đ");
  });

  it("formats seconds into mm:ss duration", () => {
    expect(ExportService.formatDuration(65)).toBe("1:05");
    expect(ExportService.formatDuration(180)).toBe("3:00");
  });
});
