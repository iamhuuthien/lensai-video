/**
 * Figma Code Connect — LensAI Video Intelligence (v2.5 Multi-Device Auto-Scaling)
 * Live Figma File: https://www.figma.com/design/px8ECubgHUiA5JsYwtWC3U/len?node-id=0-1
 *
 * Maps Figma Canvas Frames (#1:5, #1:66, #1:150) directly to the Apple Liquid Glass
 * + React Bits + Universal Fluid Auto-Scaling frontend implementation.
 */

export const FIGMA_FILE_KEY = "px8ECubgHUiA5JsYwtWC3U";
export const FIGMA_FILE_URL = "https://www.figma.com/design/px8ECubgHUiA5JsYwtWC3U/len";

export const FIGMA_CODE_CONNECT_MAP = {
  designSystemAndFluidScale: {
    figmaNodeId: "1:5",
    figmaUrl: `${FIGMA_FILE_URL}?node-id=1-5`,
    name: "Frame_01_Design_System_Tokens",
    sourceFiles: [
      "public/style.css",
      "DESIGN.md",
      "FIGMA_DESIGN_SPEC.md"
    ],
    tokens: {
      canvas: "#000000",
      surfaceElevated: "#0D0D12",
      glassSurface: "rgba(255, 255, 255, 0.04)",
      appleBlue: "#0071E3",
      cyanGlow: "#2997FF",
      studioPurple: "#BF5AF2",
      viralOrange: "#FF9F0A",
      capcutGreen: "#30D158",
      fluidDisplayHero: "clamp(1.65rem, 3.2vw + 0.75rem, 2.75rem)",
      fluidSectionTitle: "clamp(1.15rem, 1.8vw + 0.5rem, 1.65rem)",
      fluidCardPadding: "clamp(14px, 2.2vw, 24px)"
    }
  },
  tab1LinkModeResponsive: {
    figmaNodeId: "1:66",
    figmaUrl: `${FIGMA_FILE_URL}?node-id=1-66`,
    name: "Frame_02_Screen_Tab1_Link_Mode",
    sourceFiles: [
      "public/index.html",
      "public/app.js",
      "public/style.css"
    ],
    breakpoints: {
      desktop: ">= 1080px (2-Column Sticky Video + Bento Insights)",
      tablet: "768px - 1079px (Single-column max-width 760px + 2-col Bento)",
      mobile: "<= 767px (Full-bleed 100% width + iOS Bottom-Sheet Modals)"
    }
  },
  tab2StudioCreatorVip: {
    figmaNodeId: "1:150",
    figmaUrl: `${FIGMA_FILE_URL}?node-id=1-150`,
    name: "Frame_03_Screen_Tab2_Studio_Creator_VIP",
    sourceFiles: [
      "public/pro.js",
      "public/index.html",
      "public/style.css"
    ],
    features: [
      "Local Video Upload Dropzone (MP4/MOV/WebM <= 100MB)",
      "Viral Hook Score Ring (0-100)",
      "Retention Drop-off Timestamp Fixes",
      "1-Click CapCut .SRT Subtitle Export"
    ]
  }
} as const;
