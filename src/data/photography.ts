import type { Img } from "./types";

/** Photos shown on the wall frames (high-res versions). */
export const WALL_PHOTOS: Record<string, Img> = {
  "frame-photo": { src: "assets/photos/graduation.webp", alt: "Joseph at graduation in cap, gown and kente stole", caption: "Graduation" },
  "frame-award": { src: "assets/photos/best-drummer.webp", alt: "Joseph holding a gold award and a Best Drummer card", caption: "Best Drummer" },
  "frame-drums": { src: "assets/photos/drums.webp", alt: "Joseph playing a djembe in traditional attire", caption: "Djembe" },
};

/**
 * Photography gallery opened from the camera on the wall (no captions).
 * Full images + thumbnails live in public/assets/photos/gallery/.
 */
export const PHOTOGRAPHY: Img[] = [
  { src: "assets/photos/gallery/photo-01.webp", thumb: "assets/photos/gallery/photo-01-thumb.webp", alt: "Graduate in cap and gown facing the Michael J. Coles College of Business entrance" },
  { src: "assets/photos/gallery/photo-02.webp", thumb: "assets/photos/gallery/photo-02-thumb.webp", alt: "Graduate in a cap and white stole smiling with peace signs" },
  { src: "assets/photos/gallery/photo-03.webp", thumb: "assets/photos/gallery/photo-03-thumb.webp", alt: "Overhead shot of a graduate on a staircase lined with balloons" },
  { src: "assets/photos/gallery/photo-04.webp", thumb: "assets/photos/gallery/photo-04-thumb.webp", alt: "Graduate standing on a large KS logo, shot from above" },
  { src: "assets/photos/gallery/photo-05.webp", thumb: "assets/photos/gallery/photo-05-thumb.webp", alt: "Two women smiling together at an evening event" },
  { src: "assets/photos/gallery/photo-06.webp", thumb: "assets/photos/gallery/photo-06-thumb.webp", alt: "Man speaking into a microphone holding an award, beside a woman" },
  { src: "assets/photos/gallery/photo-07.webp", thumb: "assets/photos/gallery/photo-07-thumb.webp", alt: "Graduate in gown checking a phone among rows of chairs" },
  { src: "assets/photos/gallery/photo-08.webp", thumb: "assets/photos/gallery/photo-08-thumb.webp", alt: "Graduate walking along a path past a tent and gown on a chair" },
  { src: "assets/photos/gallery/photo-09.webp", thumb: "assets/photos/gallery/photo-09-thumb.webp", alt: "Smiling graduate in cap and gown in front of greenery" },
  { src: "assets/photos/gallery/photo-10.webp", thumb: "assets/photos/gallery/photo-10-thumb.webp", alt: "Graduate in a kente stole posing in front of a large KS sign" },
  { src: "assets/photos/gallery/photo-11.webp", thumb: "assets/photos/gallery/photo-11-thumb.webp", alt: "Two women in colourful African print outfits laughing together" },
  { src: "assets/photos/gallery/photo-12.webp", thumb: "assets/photos/gallery/photo-12-thumb.webp", alt: "Man posing in an elevator in a graphic tee and cargo pants" },
  { src: "assets/photos/gallery/photo-13.webp", thumb: "assets/photos/gallery/photo-13-thumb.webp", alt: "Low-angle shot of a man stepping out of an elevator" },
  { src: "assets/photos/gallery/photo-14.webp", thumb: "assets/photos/gallery/photo-14-thumb.webp", alt: "Graduate in gown beside a giant KS sign" },
  { src: "assets/photos/gallery/photo-15.webp", thumb: "assets/photos/gallery/photo-15-thumb.webp", alt: "Man in a blue and white traditional outfit at an outdoor event" },
  { src: "assets/photos/gallery/photo-16.webp", thumb: "assets/photos/gallery/photo-16-thumb.webp", alt: "Family of four smiling outdoors in white outfits" },
  { src: "assets/photos/gallery/photo-17.webp", thumb: "assets/photos/gallery/photo-17-thumb.webp", alt: "Graduate in gown and hood seen from behind on a walkway" },
  { src: "assets/photos/gallery/photo-18.webp", thumb: "assets/photos/gallery/photo-18-thumb.webp", alt: "Graduate holding two young children on a garden bench" },
  { src: "assets/photos/gallery/photo-19.webp", thumb: "assets/photos/gallery/photo-19-thumb.webp", alt: "Smiling graduate leaning on a post in an amphitheatre" },
  { src: "assets/photos/gallery/photo-20.webp", thumb: "assets/photos/gallery/photo-20-thumb.webp", alt: "Man in a cream sweater next to a glowing lamp post at night" },
  { src: "assets/photos/gallery/photo-21.webp", thumb: "assets/photos/gallery/photo-21-thumb.webp", alt: "Man in a cream sweater checking his phone at night" },
  { src: "assets/photos/gallery/photo-22.webp", thumb: "assets/photos/gallery/photo-22-thumb.webp", alt: "Man leaning back on a stair railing in a stairwell" },
  { src: "assets/photos/gallery/photo-23.webp", thumb: "assets/photos/gallery/photo-23-thumb.webp", alt: "Man posing in front of an engraved stone monument" },
  { src: "assets/photos/gallery/photo-24.webp", thumb: "assets/photos/gallery/photo-24-thumb.webp", alt: "Man standing inside a hollow tree at night" },
  { src: "assets/photos/gallery/photo-25.webp", thumb: "assets/photos/gallery/photo-25-thumb.webp", alt: "Man in a puffer jacket under a stop sign with autumn trees" },
];
