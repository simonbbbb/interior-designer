# AI Digitization Pipeline

## Pipeline Flow

1. User uploads image (JPG/PNG/PDF)
2. Frontend resizes to max 4000px (maintains aspect ratio)
3. POST /api/digitize (Next.js API route)
4. Proxy to Python FastAPI
5. OpenCV pipeline runs:
   a. Grayscale conversion
   b. Gaussian blur (reduce noise)
   c. Adaptive thresholding
   d. Morphological operations (close small gaps)
   e. Canny edge detection (sigma=0.33)
   f. Hough Line Transform (probabilistic, min 50px lines)
6. Wall grouping:
   a. Cluster parallel lines within tolerance
   b. Find perpendicular intersections
   c. Merge collinear segments
   d. Calculate wall thickness from parallel pairs
7. Door/Window detection:
   a. Identify gaps in detected wall lines
   b. Classify by size (door vs window)
   c. Heuristic swing direction
8. Confidence scoring per element
9. Return structured JSON
10. Frontend renders as semi-transparent overlays

## Fallback Strategy

- Zero walls returned: auto-enable tracing mode with message
- avgConfidence < 0.3: show warning + tracing option
- Processing error: show error + tracing mode
- Timeout (>15s): client timeout with tracing fallback

Manual tracing is a first-class feature, not an afterthought.

## Docker Deployment

Python FastAPI container with OpenCV:
- python:3.11-slim base
- opencv-python-headless (no system GUI deps)
- uvicorn for ASGI server
- Dependencies: fastapi, opencv-python-headless, numpy, pillow, pydantic
