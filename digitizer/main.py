"""
HomeForge Digitization Service
Detects walls, doors, and windows from uploaded floorplan images using OpenCV.

Pipeline:
1. Preprocess (grayscale, blur, adaptive threshold, morphology)
2. Edge detection (Canny)
3. Line detection (HoughLinesP)
4. Wall grouping (cluster parallel/collinear lines)
5. Door/Window detection (gap analysis)
6. Return structured JSON
"""
import base64
import time
import uuid
from io import BytesIO
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="HomeForge Digitizer")


# ============================================================
# Request / Response models
# ============================================================

class DigitizeRequest(BaseModel):
    image: str  # Base64 data URL
    pixels_per_foot: Optional[float] = None


class Point(BaseModel):
    x: float
    y: float


class WallOut(BaseModel):
    id: str
    start: Point
    end: Point
    type: str = "standard"
    thickness: float
    confidence: float


class DoorOut(BaseModel):
    id: str
    wallId: str
    offsetFromStart: float
    width: float
    swingDirection: str = "right"
    confidence: float


class WindowOut(BaseModel):
    id: str
    wallId: str
    offsetFromStart: float
    width: float
    sillHeight: float = 3.0
    confidence: float


class Metadata(BaseModel):
    imageWidth: int
    imageHeight: int
    processingTimeMs: float
    wallCount: int
    avgConfidence: float


class DigitizeResponse(BaseModel):
    walls: list[WallOut]
    doors: list[DoorOut]
    windows: list[WindowOut]
    metadata: Metadata


# ============================================================
# Digitization pipeline
# ============================================================

def preprocess(image: np.ndarray) -> np.ndarray:
    """Convert to grayscale, blur, threshold, and clean up noise."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    # Adaptive threshold handles varying lighting in scanned plans
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2,
    )
    # Morphological operations: close small gaps in lines
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    cleaned = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel, iterations=1)
    return cleaned


def detect_lines(binary: np.ndarray, min_length: int = 50) -> list[tuple]:
    """Detect line segments using probabilistic Hough transform."""
    lines = cv2.HoughLinesP(
        binary,
        rho=1,
        theta=np.pi / 180,
        threshold=30,
        minLineLength=min_length,
        maxLineGap=10,
    )
    if lines is None:
        return []
    return [line[0] for line in lines]


def angle_of_line(x1: float, y1: float, x2: float, y2: float) -> float:
    """Angle of a line in degrees [0, 180)."""
    dx = x2 - x1
    dy = y2 - y1
    angle = np.degrees(np.arctan2(dy, dx))
    if angle < 0:
        angle += 180
    return angle


def group_parallel_lines(
    segments: list[tuple],
    angle_tolerance: float = 10,
    dist_tolerance: float = 20,
) -> list[list[tuple]]:
    """
    Group line segments that are parallel and close to each other.
    Each group ideally represents a single wall (two parallel lines for thickness).
    """
    if not segments:
        return []

    groups: list[list[tuple]] = []
    for seg in segments:
        x1, y1, x2, y2 = seg
        seg_angle = angle_of_line(x1, y1, x2, y2)
        placed = False
        for group in groups:
            rep_angle = angle_of_line(*group[0])
            diff = abs(seg_angle - rep_angle)
            if diff > 90:
                diff = 180 - diff
            if diff <= angle_tolerance:
                # Check if the average position is close
                rep_cx = (group[0][0] + group[0][2]) / 2
                rep_cy = (group[0][1] + group[0][3]) / 2
                seg_cx = (x1 + x2) / 2
                seg_cy = (y1 + y2) / 2
                dist = np.sqrt((rep_cx - seg_cx) ** 2 + (rep_cy - seg_cy) ** 2)
                if dist <= dist_tolerance * len(group):
                    group.append(seg)
                    placed = True
                    break
        if not placed:
            groups.append([seg])
    return groups


def merge_collinear(segments: list[tuple], gap_tolerance: float = 30) -> tuple:
    """Merge collinear segments that are close together into single longer lines."""
    if not segments:
        return None
    if len(segments) == 1:
        return segments[0]

    # Sort by start coordinate
    segs = list(segments)
    segs.sort(key=lambda s: min(s[0], s[2]))

    merged = [list(segs[0])]

    for seg in segs[1:]:
        last = merged[-1]
        last_end_x = max(last[0], last[2])
        last_end_y = max(last[1], last[3])
        gap = np.sqrt((seg[0] - last_end_x) ** 2 + (seg[1] - last_end_y) ** 2)

        if gap <= gap_tolerance:
            # Extend the last segment
            last[2] = max(last[2], seg[2])
            last[3] = max(last[3], seg[3])
            last[0] = min(last[0], seg[0])
            last[1] = min(last[1], seg[1])
        else:
            merged.append(list(seg))

    if len(merged) == 1:
        return tuple(merged[0])
    # Return the longest merged segment as the best representative
    best = max(merged, key=lambda s: np.sqrt((s[2] - s[0]) ** 2 + (s[3] - s[1]) ** 2))
    return tuple(best)


def detect_gaps(
    walls: list[tuple],
    image_shape: tuple,
    min_gap: int = 25,
    max_gap: int = 120,
) -> list[dict]:
    """
    Detect gaps in walls that may represent doors or windows.
    A gap is a missing line segment between two detected wall endpoints.
    
    Returns list of gap dicts with position, size, and type (door/window).
    """
    openings = []

    # Check for horizontal walls with gaps (doors typically 28-36 inches,
    # windows 24-60 inches at typical resolution)
    for wall in walls:
        x1, y1, x2, y2 = wall
        length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        if length < max_gap * 2:
            continue  # Too short to have an opening

        # Check perpendicular to wall direction for breaks
        # Simple heuristic: look for perpendicular lines that interrupt this wall
        angle = angle_of_line(x1, y1, x2, y2)

        # For roughly horizontal walls, check vertical interruptions
        if abs(angle) < 15 or abs(180 - angle) < 15:
            # Look for vertical features crossing this wall
            pass  # Simplified: gaps detected via missing segments

    # Placeholder: return a few standard openings for MVP
    # In production, this would do detailed gap analysis
    return openings


def calculate_thickness(
    segments: list[tuple],
) -> float:
    """Estimate wall thickness from the spread of parallel line groups."""
    if len(segments) < 2:
        return 6.0  # default

    # Use the perpendicular distance between parallel line pairs as thickness
    centers = []
    for seg in segments:
        cx = (seg[0] + seg[2]) / 2
        cy = (seg[1] + seg[3]) / 2
        centers.append((cx, cy))

    # Simple estimate: standard deviation of center positions perpendicular to wall
    cx_vals = [c[0] for c in centers]
    cy_vals = [c[1] for c in centers]

    # For roughly horizontal walls: thickness is spread in Y
    angle = angle_of_line(*segments[0])
    if abs(angle) < 45 or abs(180 - angle) < 45:
        thickness = max(np.std(cy_vals) * 2, 3)
    else:
        thickness = max(np.std(cx_vals) * 2, 3)

    return min(max(thickness, 3), 12)  # Clamp between 3 and 12


# ============================================================
# API endpoint
# ============================================================

@app.post("/digitize", response_model=DigitizeResponse)
async def digitize(request: DigitizeRequest):
    """
    Detect walls, doors, and windows from a floorplan image.
    
    Accepts a base64 data URL of a PNG or JPG.
    Returns structured JSON with wall coordinates, door positions, and window positions.
    """
    start_time = time.time()

    try:
        # Parse data URL
        if "," in request.image:
            header, data = request.image.split(",", 1)
        else:
            data = request.image

        image_bytes = base64.b64decode(data)
        img_array = np.asarray(bytearray(image_bytes), dtype=np.uint8)
        image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image")

        img_height, img_width = image.shape[:2]

        # Run pipeline
        binary = preprocess(image)
        segments = detect_lines(binary)

        if not segments:
            # No lines detected - return empty result
            elapsed = (time.time() - start_time) * 1000
            return DigitizeResponse(
                walls=[],
                doors=[],
                windows=[],
                metadata=Metadata(
                    imageWidth=img_width,
                    imageHeight=img_height,
                    processingTimeMs=round(elapsed, 1),
                    wallCount=0,
                    avgConfidence=0.0,
                ),
            )

        # Group and merge lines
        groups = group_parallel_lines(segments)

        walls_out = []
        for group in groups:
            merged = merge_collinear(group)
            if merged is None:
                continue

            x1, y1, x2, y2 = merged
            length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            group_thickness = calculate_thickness(group)

            # Confidence based on line strength and length
            confidence = min(length / 200, 1.0)

            walls_out.append(WallOut(
                id=str(uuid.uuid4()),
                start=Point(x=float(x1), y=float(y1)),
                end=Point(x=float(x2), y=float(y2)),
                type="standard",
                thickness=round(group_thickness, 1),
                confidence=round(confidence, 2),
            ))

        # Detect door/window openings
        openings = detect_gaps(
            [(w.start.x, w.start.y, w.end.x, w.end.y) for w in walls_out],
            image_shape=image.shape[:2],
        )

        doors_out: list[DoorOut] = []
        windows_out: list[WindowOut] = []

        elapsed = (time.time() - start_time) * 1000
        avg_confidence = (
            sum(w.confidence for w in walls_out) / len(walls_out)
            if walls_out
            else 0.0
        )

        return DigitizeResponse(
            walls=walls_out,
            doors=doors_out,
            windows=windows_out,
            metadata=Metadata(
                imageWidth=img_width,
                imageHeight=img_height,
                processingTimeMs=round(elapsed, 1),
                wallCount=len(walls_out),
                avgConfidence=round(avg_confidence, 2),
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Digitization failed: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "homeforge-digitizer"}
