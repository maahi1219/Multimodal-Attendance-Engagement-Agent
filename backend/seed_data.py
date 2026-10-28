# Seed data generator for Multimodal Attendance & Engagement Agent
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import (
    Student, ClassroomSession, AttendanceRecord, EngagementMetric,
    AIRecommendation, PrivacySettings
)
from .services.recommendation_agent import recommendation_agent

SYNTHETIC_STUDENTS = [
    {"name": "Aria Chen", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"},
    {"name": "Marcus Vance", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"},
    {"name": "Zara Patel", "dept": "Data Science & AI", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"},
    {"name": "Liam Thorne", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"},
    {"name": "Elena Rostova", "dept": "Data Science & AI", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"},
    {"name": "Devin Brooks", "dept": "Software Engineering", "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"},
    {"name": "Ananya Sharma", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150"},
    {"name": "Mateo Silva", "dept": "Software Engineering", "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"},
    {"name": "Sophia Becker", "dept": "Data Science & AI", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"},
    {"name": "Kaito Tanaka", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150"},
    {"name": "Fatima Al-Mansoor", "dept": "Data Science & AI", "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"},
    {"name": "Noah Kim", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150"},
    {"name": "Chloe Dupont", "dept": "Software Engineering", "avatar": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150"},
    {"name": "Lucas Morales", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150"},
    {"name": "Nia Adebayo", "dept": "Data Science & AI", "avatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150"},
    {"name": "Ethan Wright", "dept": "Software Engineering", "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"},
    {"name": "Priya Nair", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"},
    {"name": "Leo Johansson", "dept": "Data Science & AI", "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"},
    {"name": "Maya Lin", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150"},
    {"name": "Oliver Quinn", "dept": "Software Engineering", "avatar": "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150"},
    {"name": "Siddharth Rao", "dept": "Data Science & AI", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"},
    {"name": "Isabella Rossi", "dept": "Computer Science & Engineering", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"},
    {"name": "Tariq Haidar", "dept": "Software Engineering", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"},
    {"name": "Hannah Ward", "dept": "Data Science & AI", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"}
]

CLASSES = [
    "CS-301 Computer Networks",
    "DS-202 Machine Learning",
    "SE-405 Cloud Computing"
]

SAMPLE_SESSIONS = [
    {
        "code": "SES-2026-101",
        "title": "Distributed Consensus & Raft Protocol",
        "class_name": "CS-301 Computer Networks",
        "subject": "Distributed Systems",
        "room": "Hall 3A - Systems Lab",
        "duration": 50,
        "days_ago": 3,
        "instructor": "Prof. Elena Vance"
    },
    {
        "code": "SES-2026-102",
        "title": "Neural Attention Mechanisms & Transformers",
        "class_name": "DS-202 Machine Learning",
        "subject": "Deep Learning Architecture",
        "room": "Amphitheater B",
        "duration": 45,
        "days_ago": 2,
        "instructor": "Dr. Aris Thorne"
    },
    {
        "code": "SES-2026-103",
        "title": "Microservices Resiliency & Circuit Breakers",
        "class_name": "SE-405 Cloud Computing",
        "subject": "Cloud Architecture",
        "room": "Virtual Studio 2",
        "duration": 55,
        "days_ago": 1,
        "instructor": "Prof. Elena Vance"
    },
    {
        "code": "SES-2026-104",
        "title": "TCP Congestion Control & Flow Simulation",
        "class_name": "CS-301 Computer Networks",
        "subject": "Network Protocols",
        "room": "Hall 3A - Systems Lab",
        "duration": 45,
        "days_ago": 0,
        "instructor": "Prof. Elena Vance"
    }
]

def seed_database(force: bool = False):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    existing_students = db.query(Student).count()
    if existing_students > 0 and not force:
        db.close()
        return

    if force:
        db.query(AIRecommendation).delete()
        db.query(EngagementMetric).delete()
        db.query(AttendanceRecord).delete()
        db.query(ClassroomSession).delete()
        db.query(Student).delete()
        db.query(PrivacySettings).delete()
        db.commit()

    print("Seeding students...")
    students = []
    for idx, s_info in enumerate(SYNTHETIC_STUDENTS):
        s_id = f"STU-2026-{idx+1:03d}"
        class_assigned = CLASSES[idx % len(CLASSES)]
        email = f"{s_info['name'].lower().replace(' ', '.')}@university.edu"
        student = Student(
            student_id=s_id,
            name=s_info["name"],
            email=email,
            class_name=class_assigned,
            department=s_info["dept"],
            enrollment_year=2024,
            consent_status=True,
            avatar_url=s_info["avatar"],
            face_token=f"TOKEN-PSEUDO-{idx+101:04d}",
            is_simulated=True
        )
        db.add(student)
        students.append(student)
    db.commit()

    print("Seeding privacy settings...")
    privacy = PrivacySettings(
        local_processing_only=True,
        camera_permission=True,
        microphone_permission=True,
        anonymize_student_identifiers=False,
        data_retention_days=30,
        auto_delete_raw_video=True,
        simulation_mode_active=False,
        disclaimer_accepted=True
    )
    db.add(privacy)
    db.commit()

    print("Seeding sessions and metrics...")
    now = datetime.utcnow()

    for s_meta in SAMPLE_SESSIONS:
        start_time = now - timedelta(days=s_meta["days_ago"], hours=random.randint(1, 4))
        end_time = start_time + timedelta(minutes=s_meta["duration"])
        
        session = ClassroomSession(
            session_code=s_meta["code"],
            title=s_meta["title"],
            class_name=s_meta["class_name"],
            subject=s_meta["subject"],
            instructor_name=s_meta["instructor"],
            room=s_meta["room"],
            status="completed",
            mode="simulation",
            scheduled_start=start_time,
            actual_start=start_time,
            actual_end=end_time,
            duration_minutes=s_meta["duration"],
            notes=f"Demonstration curriculum session for {s_meta['subject']}. Complete multimodal timeline recorded.",
            is_simulated=True
        )
        db.add(session)
        db.flush()

        # Find enrolled students for this class
        enrolled = [s for s in students if s.class_name == s_meta["class_name"]]
        if not enrolled:
            enrolled = students[:8]

        session.total_students_enrolled = len(enrolled)

        present_count = 0
        absent_count = 0
        late_count = 0

        # Create attendance records
        for s_idx, st in enumerate(enrolled):
            # Realistic probability: 80% present, 10% late, 10% absent
            roll = random.random()
            if roll < 0.78:
                status = "present"
                ratio = round(random.uniform(0.72, 0.98), 2)
                sustained_duration = int(s_meta["duration"] * ratio)
                first_seen = start_time + timedelta(minutes=random.randint(0, 4))
                last_seen = end_time - timedelta(minutes=random.randint(0, 3))
                present_count += 1
            elif roll < 0.90:
                status = "late"
                ratio = round(random.uniform(0.42, 0.68), 2)
                sustained_duration = int(s_meta["duration"] * ratio)
                first_seen = start_time + timedelta(minutes=random.randint(12, 22))
                last_seen = end_time - timedelta(minutes=random.randint(0, 4))
                late_count += 1
            else:
                status = "absent"
                ratio = 0.0
                sustained_duration = 0
                first_seen = None
                last_seen = None
                absent_count += 1

            att = AttendanceRecord(
                session_id=session.id,
                student_id=st.id,
                status=status,
                sustained_presence_duration=sustained_duration,
                sustained_presence_ratio=ratio,
                first_seen_time=first_seen,
                last_seen_time=last_seen,
                detection_confidence=round(random.uniform(0.82, 0.96), 2),
                verified_manually=(s_idx == 1), # One manual sample
                verification_note="Attendance verified by instructor override" if s_idx == 1 else None,
                is_simulated=True
            )
            db.add(att)

        session.present_count = present_count
        session.absent_count = absent_count
        session.late_count = late_count
        session.avg_attendance_rate = round(((present_count + 0.5 * late_count) / len(enrolled) * 100.0), 1)

        # Generate Time-Series Engagement Metrics (every 2 minutes)
        raw_metrics_for_agent = []
        duration_mins = s_meta["duration"]
        intervals = duration_mins // 2

        for step in range(intervals):
            offset_sec = step * 120
            minute = offset_sec / 60.0

            # Pedagogical curve modeling:
            # 0 - 10 min: Opening, high alertness, moderate audio
            # 10 - 24 min: Steady theoretical focus, moderate motion, high frontality
            # 24 - 34 min: Middle slump (inactivity rises, frontality dips slightly, low speech)
            # 34 - 42 min: Interactive Q&A discussion peak (high audio, speech bursts, active gestures)
            # 42 - end min: Wrap-up & summary (moderate activity, questions)

            if minute < 10:
                vis_act = random.uniform(45.0, 65.0)
                front = random.uniform(70.0, 88.0)
                speech = random.uniform(15.0, 30.0)
                turns = random.randint(1, 3)
                db_audio = random.uniform(-28.0, -22.0)
            elif minute < 24:
                vis_act = random.uniform(30.0, 48.0)
                front = random.uniform(75.0, 92.0)
                speech = random.uniform(10.0, 22.0)
                turns = random.randint(0, 2)
                db_audio = random.uniform(-32.0, -26.0)
            elif minute < 34: # Slump period
                vis_act = random.uniform(18.0, 32.0)
                front = random.uniform(48.0, 64.0)
                speech = random.uniform(5.0, 12.0)
                turns = 0
                db_audio = random.uniform(-38.0, -32.0)
            elif minute < 42: # Discussion peak
                vis_act = random.uniform(58.0, 85.0)
                front = random.uniform(72.0, 89.0)
                speech = random.uniform(32.0, 55.0)
                turns = random.randint(3, 6)
                db_audio = random.uniform(-22.0, -16.0)
            else: # Wrap-up
                vis_act = random.uniform(40.0, 60.0)
                front = random.uniform(65.0, 82.0)
                speech = random.uniform(20.0, 35.0)
                turns = random.randint(1, 4)
                db_audio = random.uniform(-28.0, -23.0)

            inact = max(0.0, 100.0 - vis_act * 1.3)
            silence = max(0.0, 100.0 - speech * 1.4)
            comp = float(np.clip(front * 0.45 + vis_act * 0.30 + speech * 0.25, 20.0, 96.0))

            quality = "optimal"
            if minute in [16, 18]:
                quality = "optimal" # normal
            elif s_meta["code"] == "SES-2026-103" and minute in [28, 30]:
                quality = "low_light" # simulate occasional camera flare

            metric_dict = {
                "session_id": session.id,
                "timestamp_offset_seconds": offset_sec,
                "visual_activity_score": round(vis_act, 1),
                "head_pose_frontality": round(front, 1),
                "visual_inactivity_ratio": round(inact, 1),
                "audio_level_db": round(db_audio, 1),
                "speech_activity_ratio": round(speech, 1),
                "silence_ratio": round(silence, 1),
                "interaction_turn_count": turns,
                "composite_engagement_score": round(comp, 1),
                "active_participants_detected": present_count if minute > 10 else int(present_count * 0.8),
                "data_source_type": "simulated",
                "signal_quality_flag": quality
            }
            raw_metrics_for_agent.append(metric_dict)

            db_metric = EngagementMetric(**metric_dict)
            db.add(db_metric)

        session.avg_engagement_score = round(float(np.mean([m["composite_engagement_score"] for m in raw_metrics_for_agent])), 1)

        # Generate AI Recommendations using the TeachingRecommendationAgent
        recs = recommendation_agent.analyze_session(raw_metrics_for_agent)
        for r in recs:
            rec_entry = AIRecommendation(
                session_id=session.id,
                category=r["category"],
                pattern_observed=r["pattern_observed"],
                supporting_metric=r["supporting_metric"],
                suggested_action=r["suggested_action"],
                pedagogical_rationale=r["pedagogical_rationale"],
                confidence_score=r["confidence_score"],
                data_quality_indicator=r["data_quality_indicator"],
                status="active"
            )
            db.add(rec_entry)

    db.commit()
    print("Database seeding completed successfully!")
    db.close()


if __name__ == "__main__":
    import numpy as np
    seed_database(force=True)
