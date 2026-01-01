import { Video, ExposureGrade, ProcessedVideo } from "@/types/video";

/**
 * Calculate contribution score (contribution_score_v1)
 * Measures how well a video performs relative to channel size
 *
 * @param views - Number of video views
 * @param subscribers - Number of channel subscribers
 * @returns Score from 0-10
 */
export function calculateContributionScore(
  views: number,
  subscribers: number
): number {
  const ratio = views / Math.max(1, subscribers);
  const logRatio = Math.log10(ratio + 1);
  return Math.round(Math.min(10, logRatio * 2.5) * 10) / 10;
}

/**
 * Calculate impact score (impact_proxy_score_v1)
 * Measures overall video performance based on views and velocity
 *
 * @param views - Number of video views
 * @param velocity - Views per hour
 * @returns Score from 0-10
 */
export function calculateImpactScore(views: number, velocity: number): number {
  const viewScore = Math.min(10, Math.log10(views + 1) * 1.5);
  const engagementProxy = Math.min(3, velocity / 1000);
  return Math.round(Math.min(10, viewScore * 0.7 + engagementProxy * 0.3) * 10) / 10;
}

/**
 * Calculate exposure grade (exposure_grade_v1)
 * Estimates the probability of YouTube recommending this video
 *
 * @param velocity - Views per hour
 * @param publishedAt - ISO date string of publish date
 * @returns Grade: Great, Good, Normal, or Bad
 */
export function calculateExposureGrade(
  velocity: number,
  publishedAt: string
): ExposureGrade {
  // Velocity score (0-3)
  const velocityScore =
    velocity > 3000 ? 3 : velocity > 1500 ? 2 : velocity > 500 ? 1 : 0;

  // Freshness score (0-3)
  const daysSincePublish =
    (Date.now() - Date.parse(publishedAt)) / (1000 * 60 * 60 * 24);
  const freshnessScore =
    daysSincePublish < 3
      ? 3
      : daysSincePublish < 7
        ? 2
        : daysSincePublish < 14
          ? 1
          : 0;

  // Total score (0-6)
  const totalScore = velocityScore + freshnessScore;

  if (totalScore >= 5) return "Great";
  if (totalScore >= 3) return "Good";
  if (totalScore >= 1) return "Normal";
  return "Bad";
}

/**
 * Process a video to add calculated scores
 *
 * @param video - Raw video data
 * @returns ProcessedVideo with all scores calculated
 */
export function processVideo(video: Video): ProcessedVideo {
  const contributionScore = calculateContributionScore(
    video.views,
    video.channel.subscribers
  );
  const impactScore = calculateImpactScore(video.views, video.velocity);
  const exposureGrade = calculateExposureGrade(video.velocity, video.publishedAt);

  return {
    ...video,
    contributionScore,
    impactScore,
    exposureGrade,
  };
}

/**
 * Process multiple videos
 *
 * @param videos - Array of raw videos
 * @returns Array of ProcessedVideo with all scores calculated
 */
export function processVideos(videos: Video[]): ProcessedVideo[] {
  return videos.map(processVideo);
}

/**
 * Get color class for score display
 *
 * @param score - Score value (0-10)
 * @returns Tailwind color class
 */
export function getScoreColorClass(score: number): string {
  if (score >= 8) return "text-green-600 dark:text-green-400";
  if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
}

/**
 * Get badge variant for exposure grade
 *
 * @param grade - ExposureGrade value
 * @returns Object with background and text color classes
 */
export function getExposureGradeColors(grade: ExposureGrade): {
  bg: string;
  text: string;
} {
  switch (grade) {
    case "Great":
      return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-300" };
    case "Good":
      return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-300" };
    case "Normal":
      return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-300" };
    case "Bad":
      return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-300" };
  }
}

/**
 * Sort exposure grades for comparison
 *
 * @param grade - ExposureGrade value
 * @returns Numeric value for sorting (higher is better)
 */
export function exposureGradeToNumber(grade: ExposureGrade): number {
  switch (grade) {
    case "Great":
      return 4;
    case "Good":
      return 3;
    case "Normal":
      return 2;
    case "Bad":
      return 1;
  }
}
