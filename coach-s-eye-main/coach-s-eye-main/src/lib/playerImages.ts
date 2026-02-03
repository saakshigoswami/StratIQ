/**
 * Player ID → image URL for avatars.
 * Assigned from assets in src/asset/players/ (VALORANT + LoL demo roster).
 */

import img1 from "@/asset/players/061020-Valorant-Sage.jpeg";
import img2 from "@/asset/players/valorant-characters-viper.jpg";
import img3 from "@/asset/players/KQhpbDwhPAWj6ocARUJ3AG.jpg";
import img4 from "@/asset/players/original-14c42bc08fcc09af90b22be15880ef3a.webp";
import img5 from "@/asset/players/download.jpg";
import img6 from "@/asset/players/valorant-characters-agents-abilities.jpg";
import img7 from "@/asset/players/Valorant.webp";
import img8 from "@/asset/players/valorant-player-count.avif";

const playerImages: Record<string, string> = {
  // VALORANT
  oxy: img1,
  leaf: img2,
  jake: img3,
  vanity: img4,
  zombs: img5,
  // LoL
  fudge: img6,
  blaber: img7,
  jojo: img8,
  berserker: img1,
  vulcan: img2,
};

export function getPlayerImageUrl(playerId: string): string | undefined {
  return playerImages[playerId];
}

export default playerImages;
