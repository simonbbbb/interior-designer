# Deployment Plan

## Services

| Service | Platform | Cost (MVP) |
|---|---|---|
| Next.js frontend + API | Vercel (free tier) | $0 |
| Python digitizer | Render / Railway / Fly.io | $5-10/month |
| Cloudinary (image storage) | Cloudinary free tier | $0 (25GB) |
| localStorage persistence | Browser | $0 |
| Domain | TBD | ~$12/year |

## Environment Variables

```
NEXT_PUBLIC_DIGITIZER_API_URL=https://your-digitizer-server.com
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## CI/CD

- GitHub Actions: type check + lint on PR
- Vercel: auto-deploy on push to main
- Digitizer: auto-deploy from /digitizer directory changes

## Scaling Path

P1 additions:
- PostgreSQL + Prisma for cloud persistence
- User authentication (email + OAuth)
- Multi-image upload optimization
- CDN for furniture SVG assets
