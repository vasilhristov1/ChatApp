import type { RefObject } from "react";
import type { CallResponse } from "../types/call";

interface VideoCallModalProps {
    call: CallResponse;
    localVideoRef: RefObject<HTMLVideoElement | null>;
    remoteVideoRef: RefObject<HTMLVideoElement | null>;
    isMuted: boolean;
    isCameraOff: boolean;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onEndCall: () => void;
    connectionState: RTCPeerConnectionState;
    callError?: string | null;
}

export function VideoCallModal({
    call,
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    onToggleMute,
    onToggleCamera,
    onEndCall,
    connectionState,
    callError,
}: VideoCallModalProps) {
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <header style={styles.header}>
                    <div>
                        <h2 style={{ margin: 0 }}>Video call</h2>
                        <p style={{ margin: 0, color: "#6b7280" }}>
                            {call.receiverUsername ?? call.callerUsername}
                        </p>

                        <p style={{ margin: 0, color: "#6b7280" }}>
                            Status: {connectionState}
                        </p>

                        {callError && (
                            <p style={{ margin: 0, color: "#dc2626" }}>
                                {callError}
                            </p>
                        )}
                    </div>

                    <button onClick={onEndCall} style={styles.endButton}>
                        End
                    </button>
                </header>

                <div style={styles.videoGrid}>
                    <div style={styles.videoBox}>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={styles.video}
                        />
                        <span style={styles.videoLabel}>Remote</span>
                    </div>

                    <div style={styles.videoBox}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={styles.video}
                        />
                        <span style={styles.videoLabel}>You</span>
                    </div>
                </div>

                <footer style={styles.controls}>
                    <button onClick={onToggleMute} style={styles.controlButton}>
                        {isMuted ? "Unmute" : "Mute"}
                    </button>

                    <button onClick={onToggleCamera} style={styles.controlButton}>
                        {isCameraOff ? "Camera On" : "Camera Off"}
                    </button>

                    <button onClick={onEndCall} style={styles.dangerButton}>
                        End Call
                    </button>
                </footer>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        width: "80vw",
        maxWidth: 1000,
        background: "white",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    },
    header: {
        padding: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e5e7eb",
    },
    videoGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        padding: 20,
        background: "#111827",
    },
    videoBox: {
        position: "relative",
        background: "black",
        borderRadius: 12,
        overflow: "hidden",
        height: 360,
    },
    video: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        background: "black",
    },
    videoLabel: {
        position: "absolute",
        left: 12,
        bottom: 12,
        background: "rgba(0,0,0,0.6)",
        color: "white",
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 12,
    },
    controls: {
        padding: 20,
        display: "flex",
        justifyContent: "center",
        gap: 12,
    },
    controlButton: {
        padding: "10px 16px",
        border: "none",
        borderRadius: 8,
        background: "#e5e7eb",
        cursor: "pointer",
    },
    dangerButton: {
        padding: "10px 16px",
        border: "none",
        borderRadius: 8,
        background: "#dc2626",
        color: "white",
        cursor: "pointer",
    },
    endButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: 8,
        background: "#dc2626",
        color: "white",
        cursor: "pointer",
    },
};