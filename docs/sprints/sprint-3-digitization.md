# Sprint 3: Digitization Pipeline

## What was built
- Python FastAPI service with OpenCV pipeline for wall/door/window detection
- Next.js API route to proxy requests to the digitizer
- Frontend upload flow: image upload -> send to API -> render AI detections
- Manual adjust toggle: AI results shown as overlays, user can accept/reject/edit
- Fallback to tracing mode if AI fails

## Architecture
```
Frontend (Next.js)                  Backend (Python/FastAPI)
─────────────────                  ────────────────────────
UploadModal -> file picker          
    |                               
POST /api/digitize (Base64 image)   
    |                               
    |──► proxy ──► /digitize        
                          |         
                     Preprocess: grayscale, blur, threshold, morphology
                          |         
                     Canny edge detection
                          |         
                     Hough Line Transform (probabilistic)
                          |         
                     Wall grouping: cluster parallel lines, merge collinear
                          |         
                     Door/Window detection: gap analysis
                          |         
                     Return JSON: { walls, doors, windows, metadata }
                          |
    ◄── response ◄───────┘
    |                               
Render as Fabric.js objects (semi-transparent preview)
User: Accept all / edit / reject
```

## Files created
- /digitizer/main.py - FastAPI server with /digitize endpoint
- /digitizer/requirements.txt - Python dependencies
- /digitizer/Dockerfile - Docker config for deployment
- /src/app/api/digitize/route.ts - Next.js proxy API route

