# Risk Register

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | AI wall detection produces poor results on scanned/hand-drawn plans | High | High | Auto-fallback to tracing mode. Manual tools are first-class citizens, not afterthought. |
| R2 | Canvas performance degrades with many objects | Medium | Medium | Spatial indexing (R-tree). requestAnimationFrame rendering. Limit visible objects at high zoom-out. |
| R3 | Scope creep -- "just add 3D" | High | High | Strict MVP boundary. 3D is explicitly P1. Enforced in architecture and sprint planning. |
| R4 | PDF parsing complexity on server | Medium | Medium | Use pdf2image (Poppler) -- well-tested. Fallback to "convert to image first" if unavailable. |
| R5 | Browser memory limits with large images | Medium | Low | Resize images > 4000px to 4000px max on upload, maintaining aspect ratio. |
| R6 | Fabric.js limitations for CAD-like operations | Medium | Medium | Evaluate during Sprint 1. Fabric.js has proven CAD use cases. Three.js fallback if performance fails. |
| R7 | OpenCV wall detection pipeline too complex for MVP | High | Medium | Start with Hough lines + manual tracing enhancement. Can integrate GPT-4 Vision or specialized API later. |
