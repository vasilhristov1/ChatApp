import type { CallResponse } from "../types/call";

interface IncomingCallPopupProps {
    call: CallResponse;
    isAccepting?: boolean;
    onAccept: () => void;
    onReject: () => void;
}

export function IncomingCallPopup({
    call,
    isAccepting = false,
    onAccept,
    onReject,
}: IncomingCallPopupProps) {
    return (
        <div style={styles.popup}>
            <h3>Incoming video call</h3>
            <p>{call.callerUsername} is calling you...</p>

            <div style={styles.actions}>
                <button
                    onClick={onReject}
                    disabled={isAccepting}
                    style={styles.rejectButton}
                >
                    Reject
                </button>

                <button
                    onClick={onAccept}
                    disabled={isAccepting}
                    style={styles.acceptButton}
                >
                    {isAccepting ? "Accepting..." : "Accept"}
                </button>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    popup: {
        position: "fixed",
        right: 24,
        bottom: 24,
        width: 320,
        background: "white",
        borderRadius: 14,
        padding: 20,
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        zIndex: 1001,
    },
    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 16,
    },
    rejectButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: 8,
        background: "#e5e7eb",
        cursor: "pointer",
    },
    acceptButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: 8,
        background: "#16a34a",
        color: "white",
        cursor: "pointer",
    },
};