# Computer Vision Service for Multimodal Attendance & Engagement Agent
import cv2
import numpy as np
import base64
import time
from typing import List, Dict, Any, Tuple, Optional

class ParticipantTracker:
    """
    Lightweight Euclidean Centroid & Bounding-Box Tracker.
    Maintains sustained presence across video frames to avoid duplicate counts,
    bridges temporary occlusions (up to max_disappeared frames), and logs sustained time.
    """
    def __init__(self, max_disappeared=30, min_sustained_frames=15):
        self.next_object_id = 1
        self.objects = {} # id -> centroid (x, y)
        self.bboxes = {} # id -> (x, y, w, h)
        self.disappeared = {} # id -> count of frames disappeared
        self.first_seen = {} # id -> timestamp
        self.last_seen = {} # id -> timestamp
        self.total_frames_seen = {} # id -> count of frames detected
        self.max_disappeared = max_disappeared
        self.min_sustained_frames = min_sustained_frames

    def register(self, centroid, bbox):
        now = time.time()
        obj_id = self.next_object_id
        self.objects[obj_id] = centroid
        self.bboxes[obj_id] = bbox
        self.disappeared[obj_id] = 0
        self.first_seen[obj_id] = now
        self.last_seen[obj_id] = now
        self.total_frames_seen[obj_id] = 1
        self.next_object_id += 1
        return obj_id

    def deregister(self, obj_id):
        if obj_id in self.objects:
            del self.objects[obj_id]
            del self.bboxes[obj_id]
            del self.disappeared[obj_id]

    def update(self, rects):
        """
        rects: list of (x, y, w, h)
        """
        now = time.time()
        if len(rects) == 0:
            for obj_id in list(self.disappeared.keys()):
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    self.deregister(obj_id)
            return self.get_active_participants()

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for (i, (x, y, w, h)) in enumerate(rects):
            input_centroids[i] = (int(x + w / 2.0), int(y + h / 2.0))

        if len(self.objects) == 0:
            for i in range(len(rects)):
                self.register(input_centroids[i], rects[i])
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())

            # Distance matrix
            distances = np.linalg.norm(np.array(object_centroids)[:, np.newaxis] - input_centroids, axis=2)
            rows = distances.min(axis=1).argsort()
            cols = distances.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for (row, col) in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue
                if distances[row, col] > 150: # Threshold in pixels
                    continue

                obj_id = object_ids[row]
                self.objects[obj_id] = input_centroids[col]
                self.bboxes[obj_id] = rects[col]
                self.disappeared[obj_id] = 0
                self.last_seen[obj_id] = now
                self.total_frames_seen[obj_id] = self.total_frames_seen.get(obj_id, 0) + 1

                used_rows.add(row)
                used_cols.add(col)

            unused_rows = set(range(distances.shape[0])).difference(used_rows)
            unused_cols = set(range(distances.shape[1])).difference(used_cols)

            for row in unused_rows:
                obj_id = object_ids[row]
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    self.deregister(obj_id)

            for col in unused_cols:
                self.register(input_centroids[col], rects[col])

        return self.get_active_participants()

    def get_active_participants(self):
        active = []
        for obj_id, centroid in self.objects.items():
            bbox = self.bboxes.get(obj_id, (0, 0, 0, 0))
            sustained_frames = self.total_frames_seen.get(obj_id, 0)
            is_sustained = sustained_frames >= self.min_sustained_frames
            active.append({
                "participant_id": f"P-{obj_id:03d}",
                "centroid": (int(centroid[0]), int(centroid[1])),
                "bbox": [int(b) for b in bbox],
                "frames_seen": sustained_frames,
                "is_sustained": is_sustained,
                "first_seen": self.first_seen.get(obj_id, 0),
                "last_seen": self.last_seen.get(obj_id, 0),
            })
        return active


class ComputerVisionService:
    def __init__(self):
        import os
        # Load local OpenCV Haar cascade for offline face detection
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        local_cascade = os.path.join(base_dir, "data", "haarcascade_frontalface_default.xml")
        
        if os.path.exists(local_cascade):
            self.face_cascade = cv2.CascadeClassifier(local_cascade)
        else:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
        self.tracker = ParticipantTracker(max_disappeared=45, min_sustained_frames=10)
        self.prev_gray_frame = None

    def analyze_frame(self, frame_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes a single video frame for:
        1. Participant detection & tracking (OpenCV cascade + tracker)
        2. Visual movement & activity level (frame differencing optical flow proxy)
        3. Head pose & frontality proxy (face symmetry & aspect ratio analysis)
        4. Signal quality assessment (brightness, blur check)
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return {"error": "Invalid frame"}

        h, w = frame_bgr.shape[:2]
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)

        # 1. Image Quality Assessment
        brightness = float(np.mean(gray))
        blur_laplacian = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        quality_flag = "optimal"
        if brightness < 45:
            quality_flag = "low_light"
        elif brightness > 230:
            quality_flag = "overexposed"
        elif blur_laplacian < 60:
            quality_flag = "blurry"

        # 2. Motion / Visual Activity Assessment
        visual_activity_score = 0.0
        if self.prev_gray_frame is not None and self.prev_gray_frame.shape == gray.shape:
            frame_diff = cv2.absdiff(self.prev_gray_frame, gray)
            _, diff_thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)
            motion_pixels = np.count_nonzero(diff_thresh)
            motion_ratio = motion_pixels / (h * w)
            # Normalize to 0-100 scale: standard classroom movement is 1-15% of frame
            visual_activity_score = min(100.0, float(motion_ratio * 700.0))
        self.prev_gray_frame = gray.copy()

        # 3. Face Detection & Tracking
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.15,
            minNeighbors=4,
            minSize=(35, 35)
        )

        rects = [tuple(f) for f in faces]
        tracked = self.tracker.update(rects)

        # 4. Head Pose Frontality Estimation (Observable proxy)
        # Using face bounding box aspect ratio and upper-half symmetry
        frontality_scores = []
        annotated_participants = []

        for p in tracked:
            bx, by, bw, bh = p["bbox"]
            # Ensure bbox within bounds
            bx = max(0, bx)
            by = max(0, by)
            bw = min(w - bx, bw)
            bh = min(h - by, bh)

            if bw > 15 and bh > 15:
                face_roi = gray[by:by+bh, bx:bx+bw]
                # Aspect ratio proxy (frontal faces are near 1:1.2 to 1:1.3)
                ratio = bh / float(bw)
                aspect_score = max(0.0, 100.0 - abs(ratio - 1.25) * 60.0)

                # Horizontal symmetry proxy
                half_w = bw // 2
                left_half = face_roi[:, :half_w]
                right_half = cv2.flip(face_roi[:, half_w:half_w*2], 1)
                min_len = min(left_half.shape[1], right_half.shape[1])
                if min_len > 5:
                    sym_diff = np.mean(np.abs(left_half[:, :min_len].astype(float) - right_half[:, :min_len].astype(float)))
                    sym_score = max(0.0, 100.0 - sym_diff * 1.5)
                else:
                    sym_score = 65.0

                participant_frontality = float(np.clip(aspect_score * 0.4 + sym_score * 0.6, 20.0, 95.0))
            else:
                participant_frontality = 60.0

            frontality_scores.append(participant_frontality)
            annotated_participants.append({
                **p,
                "frontality_score": round(participant_frontality, 1),
                "motion_active": visual_activity_score > 25.0
            })

        avg_frontality = float(np.mean(frontality_scores)) if frontality_scores else 65.0
        inactivity_ratio = float(max(0.0, 100.0 - visual_activity_score * 1.4))

        # Composite visual proxy index
        composite_visual = float(np.clip(avg_frontality * 0.55 + visual_activity_score * 0.35 + (100.0 - inactivity_ratio) * 0.1, 10.0, 98.0))

        return {
            "participants_detected": len(annotated_participants),
            "sustained_participants": len([p for p in annotated_participants if p["is_sustained"]]),
            "participants": annotated_participants,
            "visual_activity_score": round(visual_activity_score, 1),
            "head_pose_frontality": round(avg_frontality, 1),
            "visual_inactivity_ratio": round(inactivity_ratio, 1),
            "composite_visual_score": round(composite_visual, 1),
            "quality_flag": quality_flag,
            "is_simulated": False
        }

    def process_base64_image(self, b64_str: str) -> Dict[str, Any]:
        """
        Decodes base64 JPEG/PNG from web canvas or client camera and processes it.
        """
        try:
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            image_data = base64.b64decode(b64_str)
            np_arr = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                return {"error": "Failed to decode image"}
            return self.analyze_frame(frame)
        except Exception as e:
            return {"error": str(e)}

    def annotate_frame_with_overlays(self, frame_bgr: np.ndarray, analysis: Dict[str, Any]) -> str:
        """
        Draws privacy-respecting analytical HUD overlays on the frame:
        - Bounding boxes with anonymized ID & Frontality %
        - Visual activity indicator bar
        - Status badges
        Returns base64 encoded JPEG.
        """
        annotated = frame_bgr.copy()
        for p in analysis.get("participants", []):
            bx, by, bw, bh = p["bbox"]
            pid = p["participant_id"]
            frontality = p.get("frontality_score", 70.0)
            is_sustained = p.get("is_sustained", False)

            # Elegant color scheme: Emerald for sustained present, Violet for new/evaluating
            color = (80, 200, 120) if is_sustained else (200, 130, 80)
            cv2.rectangle(annotated, (bx, by), (bx + bw, by + bh), color, 2)

            label = f"{pid} | Ori: {int(frontality)}%"
            cv2.rectangle(annotated, (bx, by - 22), (bx + 160, by), (20, 25, 35), -1)
            cv2.putText(annotated, label, (bx + 5, by - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        # Draw top banner
        cv2.rectangle(annotated, (0, 0), (annotated.shape[1], 36), (15, 23, 42), -1)
        header_text = f"LOCAL CV TRACKER | Sustained: {analysis.get('sustained_participants', 0)} | Act: {analysis.get('visual_activity_score', 0)}% | Frontal: {analysis.get('head_pose_frontality', 0)}%"
        cv2.putText(annotated, header_text, (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 230, 245), 1)

        _, buffer = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return base64.b64encode(buffer).decode('utf-8')


cv_service = ComputerVisionService()
