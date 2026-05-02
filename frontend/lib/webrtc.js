'use client';

/**
 * WebRTC utility class for managing peer connections
 * Handles video, audio, and screen sharing
 */
export class WebRTCManager {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.screenStream = null;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;

    // STUN/TURN servers for NAT traversal
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };
  }

  /**
   * Get local media stream (camera + microphone)
   */
  async getLocalStream(video = true, audio = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      return this.localStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      throw new Error('Camera/microphone access denied. Please allow access and try again.');
    }
  }

  /**
   * Create and configure peer connection
   */
  createPeerConnection(socket, targetUserId) {
    this.peerConnection = new RTCPeerConnection(this.config);
    this.remoteStream = new MediaStream();

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle incoming remote tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    // Monitor connection state
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('WebRTC connection state:', state);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }
    };

    return this.peerConnection;
  }

  /**
   * Create and send SDP offer (caller side)
   */
  async createOffer(socket, targetUserId) {
    if (!this.peerConnection) return;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    socket.emit('webrtc:offer', {
      targetUserId,
      offer: this.peerConnection.localDescription,
    });
  }

  /**
   * Handle incoming SDP offer and create answer (receiver side)
   */
  async handleOffer(socket, offer, callerId) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    socket.emit('webrtc:answer', {
      targetUserId: callerId,
      answer: this.peerConnection.localDescription,
    });
  }

  /**
   * Handle incoming SDP answer (caller side)
   */
  async handleAnswer(answer) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(candidate) {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      // Replace video track in peer connection
      const screenTrack = this.screenStream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      // When user stops sharing via browser UI
      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      return this.screenStream;
    } catch (err) {
      console.error('Screen sharing error:', err);
      throw new Error('Screen sharing was cancelled or denied.');
    }
  }

  /**
   * Stop screen sharing and restore camera
   */
  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    // Restore camera track
    const cameraTrack = this.localStream?.getVideoTracks()[0];
    const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
    if (sender && cameraTrack) {
      await sender.replaceTrack(cameraTrack);
    }
  }

  /**
   * Toggle microphone
   */
  toggleAudio() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  /**
   * Toggle camera
   */
  toggleVideo() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  /**
   * Clean up all connections and streams
   */
  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }
}
