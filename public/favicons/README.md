# Holiday Seekie Spark Favicon Collection

This directory contains the rotating holiday favicon variants.

## Required Files

Place your 32×32 transparent PNG files here:

- `spark-1.png` - First variant
- `spark-2.png` - Second variant  
- `spark-3.png` - Third variant
- `spark-4.png` - Fourth variant

## Rotation Logic

The favicon automatically rotates once per hour based on the current hour:
- Hour % 4 = 0 → spark-1.png
- Hour % 4 = 1 → spark-2.png
- Hour % 4 = 2 → spark-3.png
- Hour % 4 = 3 → spark-4.png

Rotation is handled by `src/utils/faviconRotation.ts`.
