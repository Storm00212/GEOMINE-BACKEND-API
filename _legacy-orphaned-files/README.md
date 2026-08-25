# Legacy orphaned files

These files were found sitting outside the real `geomine-backend/` project
root (at `geomine-backend/lib/modules/...` before the folder cleanup, one
level above where the actual backend project lives). They aren't imported
or referenced by either app, aren't part of the buildable project, and one
of them (`readings/readings.service.ts`) is not even valid TypeScript — its
entire content is the single character `S`.

They were moved here rather than deleted, so nothing is lost. If nobody
recognizes a need for them, they're safe to delete.
