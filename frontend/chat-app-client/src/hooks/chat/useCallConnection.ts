import { useEffect, useRef, useState } from "react";
import type * as signalR from "@microsoft/signalr";
import { createCallConnection } from "../../signalr/callConnection";
import type {
    CallResponse,
    StartCallRequest,
    WebRtcSignalRequest,
} from "../../types/call";

interface UseCallConnectionParams {
    accessToken: string | null;
    currentUserId?: string;
}

export function useCallConnection({
    accessToken,
    currentUserId,
}: UseCallConnectionParams) {
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const activeCallRef = useRef<CallResponse | null>(null);

    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

    const [isConnected, setIsConnected] = useState(false);
    const [incomingCall, setIncomingCall] = useState<CallResponse | null>(null);
    const [activeCall, setActiveCall] = useState<CallResponse | null>(null);
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isStartingCall, setIsStartingCall] = useState(false);
    const [isAcceptingCall, setIsAcceptingCall] = useState(false);
    const [callError, setCallError] = useState<string | null>(null);
    const [connectionState, setConnectionState] =
        useState<RTCPeerConnectionState>("new");

    const setActiveCallSafe = (call: CallResponse | null) => {
        activeCallRef.current = call;
        setActiveCall(call);
    };

    const getOtherUserId = (call: CallResponse) => {
        if (!currentUserId) {
            throw new Error("Current user is missing.");
        }

        return call.callerId === currentUserId ? call.receiverId! : call.callerId;
    };

    const attachStreamsToVideoElements = () => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(() => { });
        }

        if (remoteVideoRef.current && remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play().catch(() => { });
        }
    };

    useEffect(() => {
        if (isCallOpen) {
            setTimeout(attachStreamsToVideoElements, 0);
        }
    }, [isCallOpen]);

    const startLocalStream = async () => {
        if (localStreamRef.current) {
            return localStreamRef.current;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            localStreamRef.current = stream;
            attachStreamsToVideoElements();

            setCallError(null);

            return stream;
        } catch {
            setCallError(
                "Camera or microphone access was denied. Please allow permissions and try again."
            );

            throw new Error("Camera or microphone access was denied.");
        }
    };

    const attachLocalTracks = (
        peerConnection: RTCPeerConnection,
        stream: MediaStream
    ) => {
        const existingSenders = peerConnection.getSenders();

        stream.getTracks().forEach((track) => {
            const alreadyAdded = existingSenders.some(
                (sender) => sender.track?.id === track.id
            );

            if (!alreadyAdded) {
                peerConnection.addTrack(track, stream);
            }
        });
    };

    const flushPendingIceCandidates = async () => {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection || !peerConnection.remoteDescription) {
            return;
        }

        for (const candidate of pendingIceCandidatesRef.current) {
            await peerConnection.addIceCandidate(candidate);
        }

        pendingIceCandidatesRef.current = [];
    };

    const createPeerConnection = (call: CallResponse) => {
        const connection = connectionRef.current;

        if (!connection) {
            throw new Error("Call connection is not active.");
        }

        if (peerConnectionRef.current) {
            return peerConnectionRef.current;
        }

        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peerConnection.onicecandidate = async (event) => {
            if (!event.candidate) {
                return;
            }

            await connection.invoke("SendIceCandidate", {
                callId: call.id,
                targetUserId: getOtherUserId(call),
                data: JSON.stringify(event.candidate),
            });
        };

        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;

            remoteStreamRef.current = remoteStream;
            attachStreamsToVideoElements();
        };

        peerConnection.onconnectionstatechange = () => {
            setConnectionState(peerConnection.connectionState);

            if (
                peerConnection.connectionState === "failed" ||
                peerConnection.connectionState === "disconnected"
            ) {
                setCallError("The call connection was interrupted.");
            }
        };

        peerConnectionRef.current = peerConnection;

        return peerConnection;
    };

    const cleanupCall = () => {
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;

        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;

        remoteStreamRef.current = null;
        pendingIceCandidatesRef.current = [];

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        activeCallRef.current = null;

        setIncomingCall(null);
        setActiveCall(null);
        setIsCallOpen(false);
        setIsMuted(false);
        setIsCameraOff(false);
        setIsStartingCall(false);
        setIsAcceptingCall(false);
        setCallError(null);
        setConnectionState("new");
    };

    useEffect(() => {
        if (!accessToken) {
            return;
        }

        const connection = createCallConnection(accessToken);
        connectionRef.current = connection;

        connection.on("IncomingCall", (call: CallResponse) => {
            setIncomingCall(call);
        });

        connection.on("CallStarted", async (call: CallResponse) => {
            setActiveCallSafe(call);
            setIsCallOpen(true);
            await startLocalStream();
        });

        connection.on("CallAccepted", async (call: CallResponse) => {
            setActiveCallSafe(call);
            setIsCallOpen(true);

            const stream = await startLocalStream();

            const peerConnection = createPeerConnection(call);
            attachLocalTracks(peerConnection, stream);

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            await connection.invoke("SendOffer", {
                callId: call.id,
                targetUserId: getOtherUserId(call),
                data: JSON.stringify(offer),
            });
        });

        connection.on("CallRejected", () => {
            cleanupCall();
        });

        connection.on("CallEnded", () => {
            cleanupCall();
        });

        connection.on("ReceiveOffer", async (request: WebRtcSignalRequest) => {
            const call = activeCallRef.current;

            if (!call) {
                console.error("Received offer but active call is missing.");
                return;
            }

            const stream = await startLocalStream();

            const peerConnection = createPeerConnection(call);
            attachLocalTracks(peerConnection, stream);

            const offer = JSON.parse(request.data) as RTCSessionDescriptionInit;

            await peerConnection.setRemoteDescription(offer);
            await flushPendingIceCandidates();

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            await connection.invoke("SendAnswer", {
                callId: request.callId,
                targetUserId: getOtherUserId(call),
                data: JSON.stringify(answer),
            });
        });

        connection.on("ReceiveAnswer", async (request: WebRtcSignalRequest) => {
            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) {
                return;
            }

            const answer = JSON.parse(request.data) as RTCSessionDescriptionInit;

            await peerConnection.setRemoteDescription(answer);
            await flushPendingIceCandidates();
        });

        connection.on(
            "ReceiveIceCandidate",
            async (request: WebRtcSignalRequest) => {
                const peerConnection = peerConnectionRef.current;

                if (!peerConnection) {
                    return;
                }

                const candidate = JSON.parse(request.data) as RTCIceCandidateInit;

                if (!peerConnection.remoteDescription) {
                    pendingIceCandidatesRef.current.push(candidate);
                    return;
                }

                await peerConnection.addIceCandidate(candidate);
            }
        );

        connection.onreconnected(() => setIsConnected(true));
        connection.onreconnecting(() => setIsConnected(false));
        connection.onclose(() => setIsConnected(false));

        connection
            .start()
            .then(() => setIsConnected(true))
            .catch((error) => {
                console.error("Call connection failed:", error);
                setIsConnected(false);
            });

        return () => {
            cleanupCall();
            connection.stop();
            connectionRef.current = null;
        };
    }, [accessToken, currentUserId]);

    const startCall = async (request: StartCallRequest) => {
        if (isStartingCall || activeCallRef.current) {
            return;
        }

        const connection = connectionRef.current;

        if (!connection || connection.state !== "Connected") {
            setCallError("Call connection is not active.");
            throw new Error("Call connection is not active.");
        }

        setIsStartingCall(true);
        setCallError(null);

        try {
            await startLocalStream();
            await connection.invoke("StartCall", request);
        } catch (error) {
            cleanupCall();
            throw error;
        } finally {
            setIsStartingCall(false);
        }
    };

    const acceptCall = async () => {
        if (!incomingCall || isAcceptingCall) {
            return;
        }

        const connection = connectionRef.current;

        if (!connection || connection.state !== "Connected") {
            setCallError("Call connection is not active.");
            throw new Error("Call connection is not active.");
        }

        setIsAcceptingCall(true);
        setCallError(null);

        try {
            setActiveCallSafe(incomingCall);
            setIsCallOpen(true);

            const stream = await startLocalStream();

            const peerConnection = createPeerConnection(incomingCall);
            attachLocalTracks(peerConnection, stream);

            await connection.invoke("AcceptCall", incomingCall.id);

            setIncomingCall(null);
        } catch (error) {
            cleanupCall();
            throw error;
        } finally {
            setIsAcceptingCall(false);
        }
    };

    const rejectCall = async () => {
        if (!incomingCall) {
            return;
        }

        const connection = connectionRef.current;

        if (connection && connection.state === "Connected") {
            await connection.invoke("RejectCall", incomingCall.id);
        }

        setIncomingCall(null);
    };

    const endCall = async () => {
        const connection = connectionRef.current;

        if (activeCallRef.current && connection && connection.state === "Connected") {
            await connection.invoke("EndCall", activeCallRef.current.id);
        }

        cleanupCall();
    };

    const toggleMute = () => {
        const stream = localStreamRef.current;

        if (!stream) {
            return;
        }

        const audioTrack = stream.getAudioTracks()[0];

        if (!audioTrack) {
            return;
        }

        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
    };

    const toggleCamera = () => {
        const stream = localStreamRef.current;

        if (!stream) {
            return;
        }

        const videoTrack = stream.getVideoTracks()[0];

        if (!videoTrack) {
            return;
        }

        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
    };

    return {
        isConnected,
        incomingCall,
        activeCall,
        isCallOpen,
        isMuted,
        isCameraOff,
        isStartingCall,
        isAcceptingCall,
        callError,
        connectionState,
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
    };
}