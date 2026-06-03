'use client';
import { useState, useEffect, useRef, useCallback, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
import { WebRTCManager } from '@/lib/webrtc';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Monitor, MonitorOff, Maximize, Minimize,
  MessageCircle, Clock
} from 'lucide-react';

export default function VideoCallPage({ params }) {
  const resolvedParams = use(params);
  const { odId: odIdRaw, odId: _, ...rest } = resolvedParams;
  const odId = resolvedParams.odId;
  const { user } = useAuth();
  const router = useRouter();

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcRef = useRef(null);

  // State
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, active, ended
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteName, setRemoteName] = useState('');
  const [error, setError] = useState('');

  // Timer for call duration
  useEffect(() => {
    let interval;
    if (callStatus === 'active') {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Initialize call
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const webrtc = new WebRTCManager();
    webrtcRef.current = webrtc;

    const setupCall = async () => {
      try {
        // Determine call type from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const isCaller = urlParams.get('caller') === 'true';
        const callerName = urlParams.get('name') || 'Unknown';
        const callType = urlParams.get('type') || 'video';
        const wantVideo = callType !== 'audio';
        setRemoteName(callerName);
        setVideoEnabled(wantVideo);

        // Fetch TURN credentials (falls back to static if no API key)
        await webrtc.fetchTurnCredentials();

        // Get local media (audio-only for voice calls)
        const localStream = await webrtc.getLocalStream(wantVideo, true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Create peer connection
        webrtc.createPeerConnection(socket, odId);

        // Handle remote stream
        webrtc.onRemoteStream = (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        };

        // Handle connection state changes
        webrtc.onConnectionStateChange = (state) => {
          if (state === 'connected') {
            setCallStatus('active');
          } else if (state === 'disconnected' || state === 'failed') {
            setCallStatus('ended');
          }
        };

        if (isCaller) {
          // Caller: initiate the call
          setCallStatus('ringing');
          socket.emit('call:initiate', {
            targetUserId: odId,
            callerName: user.name,
            callType,
          });
        } else {
          // Callee: we were redirected here after accepting
          setCallStatus('connecting');
          socket.emit('call:accept', { targetUserId: odId });
        }

        // ---- Socket event handlers ----

        // Call accepted → create offer
        socket.on('call:accepted', async ({ userId }) => {
          setCallStatus('connecting');
          await webrtc.createOffer(socket, userId);
        });

        // Call rejected
        socket.on('call:rejected', ({ reason }) => {
          setError(reason || 'Call was declined');
          setCallStatus('ended');
        });

        // Incoming WebRTC offer
        socket.on('webrtc:offer', async ({ offer, callerId }) => {
          await webrtc.handleOffer(socket, offer, callerId);
        });

        // Incoming WebRTC answer
        socket.on('webrtc:answer', async ({ answer }) => {
          await webrtc.handleAnswer(answer);
        });

        // Incoming ICE candidate
        socket.on('webrtc:ice-candidate', async ({ candidate }) => {
          await webrtc.handleIceCandidate(candidate);
        });

        // Remote ended call
        socket.on('call:ended', () => {
          setCallStatus('ended');
        });

        // Screen share notification
        socket.on('call:screen-share', ({ isSharing }) => {
          // Remote user toggled screen sharing
          setIsRemoteScreenSharing(isSharing);
        });

      } catch (err) {
        setError(err.message);
        setCallStatus('ended');
      }
    };

    setupCall();

    // Cleanup on unmount
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.cleanup();
      }
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('call:ended');
      socket.off('call:screen-share');
    };
  }, [odId, user]);

  // Toggle audio
  const handleToggleAudio = useCallback(() => {
    if (webrtcRef.current) {
      const enabled = webrtcRef.current.toggleAudio();
      setAudioEnabled(enabled);
    }
  }, []);

  // Toggle video
  const handleToggleVideo = useCallback(() => {
    if (webrtcRef.current) {
      const enabled = webrtcRef.current.toggleVideo();
      setVideoEnabled(enabled);
    }
  }, []);

  // Toggle screen sharing
  const handleScreenShare = useCallback(async () => {
    if (!webrtcRef.current) return;
    const socket = getSocket();

    try {
      if (screenSharing) {
        await webrtcRef.current.stopScreenShare();
        setScreenSharing(false);
        socket?.emit('call:screen-share', { targetUserId: odId, isSharing: false });
      } else {
        await webrtcRef.current.startScreenShare();
        setScreenSharing(true);
        socket?.emit('call:screen-share', { targetUserId: odId, isSharing: true });

        // Listen for screen share stop via browser UI
        webrtcRef.current.screenStream?.getVideoTracks()[0].addEventListener('ended', () => {
          setScreenSharing(false);
          socket?.emit('call:screen-share', { targetUserId: odId, isSharing: false });
        });
      }
    } catch (err) {
      console.error('Screen share toggle error:', err);
    }
  }, [screenSharing, odId]);

  // End call
  const handleEndCall = useCallback(() => {
    const socket = getSocket();
    socket?.emit('call:end', { targetUserId: odId });
    if (webrtcRef.current) {
      webrtcRef.current.cleanup();
    }
    setCallStatus('ended');
    setTimeout(() => router.back(), 1500);
  }, [odId, router]);

  // Toggle fullscreen
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
            {remoteName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="text-white font-medium text-sm">{remoteName || 'Connecting...'}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {callStatus === 'active' ? formatDuration(callDuration) :
               callStatus === 'ringing' ? 'Ringing...' :
               callStatus === 'connecting' ? 'Connecting...' :
               callStatus === 'ended' ? 'Call ended' : ''}
            </div>
          </div>
        </div>

        {/* Call status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            callStatus === 'active' ? 'bg-green-500 animate-pulse' :
            callStatus === 'ringing' ? 'bg-amber-500 animate-pulse' :
            callStatus === 'ended' ? 'bg-red-500' : 'bg-gray-500 animate-pulse'
          }`} />
          <span className="text-xs text-gray-400 capitalize">{callStatus}</span>
        </div>
      </div>

      {/* Remote Video (Full screen) */}
      <div className="flex-1 relative bg-black">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />

        {/* Placeholder when no remote stream */}
        {callStatus !== 'active' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                {remoteName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{remoteName}</h2>
              {callStatus === 'ringing' && (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full bg-indigo-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm">Ringing</span>
                </div>
              )}
              {callStatus === 'connecting' && (
                <div className="text-sm text-gray-400">Setting up connection...</div>
              )}
              {callStatus === 'ended' && (
                <div className="text-sm text-red-400">{error || 'Call ended'}</div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Local Video (PiP) */}
      <motion.div
        drag
        dragConstraints={{ left: -600, right: 0, top: -400, bottom: 0 }}
        className="absolute bottom-28 right-6 w-44 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-move z-10 bg-black"
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full ${screenSharing ? 'object-contain' : 'object-cover -scale-x-100'} ${!videoEnabled ? 'hidden' : ''}`}
        />
        {!videoEnabled && (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-16 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Mic toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              audioEnabled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-500/80 text-white'
            }`}
          >
            {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </motion.button>

          {/* Camera toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              videoEnabled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-500/80 text-white'
            }`}
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </motion.button>

          {/* Screen share */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              screenSharing
                ? 'bg-indigo-500/80 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {screenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </motion.button>

          {/* End call */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="w-7 h-7" />
          </motion.button>

          {/* Fullscreen */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFullscreen}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Incoming call overlay for callees */}
      <AnimatePresence>
        {callStatus === 'ended' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-30"
          >
            <div className="text-center">
              <PhoneOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Call Ended</h2>
              <p className="text-gray-400 text-sm mb-1">Duration: {formatDuration(callDuration)}</p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <p className="text-gray-500 text-xs mt-3">Redirecting back...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
