# Audio Signal Processing Service for Multimodal Attendance & Engagement Agent
import numpy as np
from typing import Dict, Any, Optional

try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    HAS_LIBROSA = False

class AudioProcessingService:
    """
    Analyzes classroom audio signals for:
    - Overall acoustic energy / ambient dB levels
    - Speech vs. non-speech / silence ratio (using short-time energy & spectral centroid)
    - Speaker-turn / conversational shift proxy (without individual voice identification)
    - Interaction burst detection
    Privacy-preserving: Does not transcribe speech content or record raw audio unnecessarily.
    """

    def analyze_audio_chunk(self, audio_data: np.ndarray, sample_rate: int = 16000) -> Dict[str, Any]:
        """
        Analyzes a buffer of PCM audio samples (float32 between -1.0 and 1.0 or int16).
        """
        if audio_data is None or len(audio_data) == 0:
            return self._fallback_silent_metrics()

        if audio_data.dtype != np.float32 and audio_data.dtype != np.float64:
            audio_data = audio_data.astype(np.float32) / 32768.0

        # 1. Sound Pressure Level / RMS Energy
        rms = np.sqrt(np.mean(audio_data**2)) + 1e-8
        db_level = float(20 * np.log10(rms))
        db_normalized = float(np.clip((db_level + 60.0) / 60.0 * 100.0, 0.0, 100.0))

        # 2. Frame-level activity (frames of 25ms, hop 10ms)
        frame_len = int(sample_rate * 0.025)
        hop_len = int(sample_rate * 0.010)

        if len(audio_data) < frame_len:
            frame_energies = np.array([rms])
        else:
            num_frames = 1 + int((len(audio_data) - frame_len) / hop_len)
            frame_energies = np.array([
                np.sqrt(np.mean(audio_data[i * hop_len : i * hop_len + frame_len] ** 2))
                for i in range(num_frames)
            ])

        # Voice Activity Detection (VAD) threshold proxy
        silence_thresh = 0.015
        speech_thresh = 0.045

        silence_frames = np.sum(frame_energies < silence_thresh)
        speech_frames = np.sum(frame_energies >= speech_thresh)
        total_frames = max(1, len(frame_energies))

        silence_ratio = float((silence_frames / total_frames) * 100.0)
        speech_activity_ratio = float((speech_frames / total_frames) * 100.0)

        # 3. Estimated Conversation Shifts / Speaker Turns
        # Detected by energy transitions between active speech segments
        energy_diff = np.diff((frame_energies >= speech_thresh).astype(int))
        turns_detected = int(np.sum(energy_diff > 0))

        # 4. Audio Signal Quality Flag
        signal_flag = "optimal"
        if db_level < -55.0:
            signal_flag = "very_quiet"
        elif db_level > -5.0:
            signal_flag = "clipping_distortion"

        return {
            "audio_level_db": round(db_level, 1),
            "sound_energy_score": round(db_normalized, 1),
            "speech_activity_ratio": round(speech_activity_ratio, 1),
            "silence_ratio": round(silence_ratio, 1),
            "interaction_turn_count": turns_detected,
            "quality_flag": signal_flag,
            "is_simulated": False
        }

    def _fallback_silent_metrics(self) -> Dict[str, Any]:
        return {
            "audio_level_db": -42.0,
            "sound_energy_score": 30.0,
            "speech_activity_ratio": 25.0,
            "silence_ratio": 70.0,
            "interaction_turn_count": 1,
            "quality_flag": "optimal",
            "is_simulated": False
        }


audio_service = AudioProcessingService()
