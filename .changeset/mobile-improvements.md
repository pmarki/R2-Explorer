---
"r2-explorer": patch
---

Mobile UI improvements and file type icons

- File list on mobile now stacks icon+name on one row and metadata+actions below it
- All dialogs (create file/folder, share, metadata editor, file preview) now fit full-screen on mobile
- Added file type icons with colors for image, PDF, text/code, video, audio, archive, and executable files
- Multipart upload chunk size reduced to 10 MB for better progress granularity and resilience on slow connections
- Moved "Manage Shares" button to the sidebar
- Added `shares: false` config option (and `SHARES=false` env var) to disable the shares feature
