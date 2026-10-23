import React, { useRef, type ReactNode } from "react";
import { Paper, type PaperProps } from "@mui/material";
import { APPLE_PALETTE } from "../../theme/theme";

interface SpotlightCardProps extends PaperProps {
  children: ReactNode;
  spotlightColor?: string;
  hoverBorderColor?: string;
  enableScaleHover?: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  spotlightColor = "rgba(41, 151, 255, 0.12)",
  hoverBorderColor = "rgba(255, 255, 255, 0.22)",
  enableScaleHover = false,
  sx,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <Paper
      ref={cardRef}
      elevation={0}
      onMouseMove={handleMouseMove}
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: APPLE_PALETTE.tile1,
        border: `1px solid ${APPLE_PALETTE.hairline}`,
        borderRadius: "18px",
        transition: "border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "--mouse-x": "50%",
        "--mouse-y": "50%",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `radial-gradient(550px circle at var(--mouse-x) var(--mouse-y), ${spotlightColor}, transparent 55%)`,
          opacity: 0,
          transition: "opacity 0.35s ease",
          pointerEvents: "none",
          zIndex: 0,
        },
        "&:hover": {
          borderColor: hoverBorderColor,
          ...(enableScaleHover && {
            transform: "translateY(-3px)",
          }),
        },
        "&:hover::before": {
          opacity: 1,
        },
        "&:active": {
          transform: enableScaleHover ? "scale(0.985)" : undefined,
        },
        "& > *": {
          position: "relative",
          zIndex: 1,
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
};
