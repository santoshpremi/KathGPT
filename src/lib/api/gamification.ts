import {
  ApiCreateCompletedCourse,
} from "../../../packages/apiTypes/src/CompletedCourse";
import {
  calcLevelProgress,
  normalizeCurrentProgress,
} from "../../../packages/apiTypes/src/academy/calcLevelProgress";

export type UserXP = {
  xp: number;
  currentLevel: number;
  currentLevelProgress: number;
  xpNeededForNextLevel: number;
  normalizedProgress: number;
  isNewLevel: boolean;
  normalizedProgressBefore: number;
};

export type FinishCourseResponse = {
  data: {
    completedCourse?: {
      awardedXp: number;
    };
    userXp?: number;
  };
  status?: number;
};

export function useXP() {
  return { xp: 0 };
}

export function useMutateXP() {
  return async () => undefined;
}

export function useFinishCourse() {
  return async (_request: ApiCreateCompletedCourse) => ({ data: {} });
}

export function calcUserXP(xp: number, awardedXP: number) {
  const userLevel = calcLevelProgress(xp);
  const userLevelBefore = calcLevelProgress(xp - awardedXP);

  const isNewLevel = userLevelBefore.currentLevel < userLevel.currentLevel;
  const normalized = normalizeCurrentProgress(
    userLevel.currentLevelProgress,
    userLevel.currentLevel,
  );
  let normalizedBefore = normalizeCurrentProgress(
    userLevelBefore.currentLevelProgress,
    userLevelBefore.currentLevel,
  );
  if (normalizedBefore >= normalized) {
    normalizedBefore = 0;
  }

  const userData: UserXP = {
    xp: xp,
    currentLevel: userLevel.currentLevel,
    currentLevelProgress: userLevel.currentLevelProgress,
    xpNeededForNextLevel: userLevel.xpNeededForNextLevel,
    normalizedProgress: normalized,
    isNewLevel: isNewLevel,
    normalizedProgressBefore: normalizedBefore,
  };
  return userData;
}
