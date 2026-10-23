import React, { useRef, useEffect } from "react";
import { Paper, Box, Typography } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import type { VideoInfo } from "../../models/types";
import { APPLE_PALETTE } from "../../theme/theme";

interface VideoPlayerProps {
  sessionId: string;
  videoInfo: VideoInfo;
  seekTime: number | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ sessionId, videoInfo, seekTime }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (seekTime !== null && videoRef.current) {
      videoRef.current.currentTime = seekTime;
      videoRef.current.play().catch(() => {});
    }
  }, [seekTime]);

  const videoSrc = `/api/video/${sessionId}`;

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        borderRadius: "18px",
        backgroundColor: APPLE_PALETTE.black,
        border: `1px solid ${APPLE_PALETTE.hairline}`,
        mb: 3.5,
      }}
    >
      <Box sx={{ position: "relative", width: "100%", maxHeight: "520px", display: "flex", justifyContent: "center", bgcolor: "#000" }}>
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          playsInline
          style={{
            width: "100%",
            maxHeight: "520px",
            objectFit: "contain",
            display: "block",
          }}
        />
      </Box>

      {/* Video title and metadata bar */}
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderTop: `1px solid ${APPLE_PALETTE.hairline}` }}>
        <VideocamIcon sx={{ color: APPLE_PALETTE.skyLink, fontSize: 20 }} />
        <Box sx={{ overflow: "hidden" }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: "#ffffff" }}>
            {videoInfo.title || "Video phân tích"}
          </Typography>
          {videoInfo.author && (
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
              Tác giả: {videoInfo.author}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};
