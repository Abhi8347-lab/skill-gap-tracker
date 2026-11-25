/**
 * AI Skill Gap Analysis, Adaptive Course Mapping, and Progress Engine.
 */
window.SkillPathEngine = (function () {
  function getExperienceOption(expId) {
    const opts = window.SkillPathData.EXPERIENCE_OPTIONS;
    return opts.find((o) => o.id === expId) || opts[0];
  }

  function getWeeklyHoursOption(hoursId) {
    const opts = window.SkillPathData.WEEKLY_HOURS_OPTIONS;
    return opts.find((o) => o.id === hoursId) || opts[1];
  }

  function getRecommendedCoursesForSkill(
    skillId,
    initialLevel,
    requiredLevel,
    courseProgress
  ) {
    const allCourses = window.SkillPathData.COURSES_BY_SKILL[skillId] || [];
    if (allCourses.length === 0) return [];

    // For learners who already have partial knowledge (Needs Improvement),
    // adaptively recommend applied/intermediate courses unless they already
    // started or completed another course for this skill.
    if (initialLevel > 0 && initialLevel < requiredLevel) {
      const targeted = allCourses.filter(
        (c) =>
          c.tier === "applied" ||
          (courseProgress &&
            courseProgress[c.id] &&
            courseProgress[c.id] !== "not_started")
      );
      if (targeted.length > 0) return targeted;
    }

    return allCourses.slice();
  }

  function analyzeProfile(profile, courseProgress) {
    const data = window.SkillPathData;
    const progress = courseProgress || {};

    if (!profile || !profile.targetRole) {
      return null;
    }

    const role = data.ROLE_MAP[profile.targetRole] || data.ROLES_CATALOG[0];
    const expOption = getExperienceOption(profile.experience);
    const hoursOption = getWeeklyHoursOption(profile.weeklyHours);
    const ratings = profile.skillRatings || {};

    let totalRequiredPoints = 0;
    let totalMatchedPoints = 0;
    let totalRemainingHours = 0;

    let strongCount = 0;
    let needsImprovementCount = 0;
    let missingCount = 0;

    let totalGapCourses = 0;
    let completedCoursesCount = 0;
    let inProgressCoursesCount = 0;
    let notStartedCoursesCount = 0;

    const roadmap = role.skills.map((reqSkill, index) => {
      const skillMeta = data.SKILL_MAP[reqSkill.skillId] || {
        id: reqSkill.skillId,
        name: reqSkill.skillId,
        category: "Core",
      };

      const initialLevel = Number(ratings[reqSkill.skillId] || 0);
      const requiredLevel = reqSkill.required;
      const hadGapInitially = initialLevel < requiredLevel;

      const recommendedCourses = getRecommendedCoursesForSkill(
        reqSkill.skillId,
        initialLevel,
        requiredLevel,
        progress
      ).map((course) => ({
        ...course,
        status: progress[course.id] || "not_started",
      }));

      const skillCoursesCompleted = recommendedCourses.filter(
        (c) => c.status === "completed"
      ).length;
      const skillCoursesInProgress = recommendedCourses.filter(
        (c) => c.status === "in_progress"
      ).length;
      const allSkillCoursesDone =
        recommendedCourses.length > 0 &&
        skillCoursesCompleted === recommendedCourses.length;

      let effectiveLevel = initialLevel;
      if (hadGapInitially) {
        if (allSkillCoursesDone) {
          effectiveLevel = requiredLevel;
        } else if (
          (skillCoursesCompleted > 0 || skillCoursesInProgress > 0) &&
          recommendedCourses.length > 0
        ) {
          const weightedDone =
            skillCoursesCompleted + skillCoursesInProgress * 0.4;
          const gain = Math.round(
            ((requiredLevel - initialLevel) * weightedDone) /
              recommendedCourses.length
          );
          effectiveLevel = Math.min(
            requiredLevel - 1,
            Math.max(initialLevel, initialLevel + gain)
          );
        }
      }

      let status = "missing";
      let statusLabel = "Missing";
      if (effectiveLevel >= requiredLevel) {
        status = "strong";
        statusLabel = hadGapInitially ? "Completed ✓" : "Strong";
        strongCount += 1;
      } else if (effectiveLevel > 0) {
        status = "needs_improvement";
        statusLabel = "Needs Improvement";
        needsImprovementCount += 1;
      } else {
        status = "missing";
        statusLabel = "Missing";
        missingCount += 1;
      }

      const completedViaCourses = hadGapInitially && allSkillCoursesDone;

      // Track course stats across skills that had an initial gap (or have active progress)
      const includeInCoursePlan =
        hadGapInitially ||
        skillCoursesCompleted > 0 ||
        skillCoursesInProgress > 0;

      if (includeInCoursePlan) {
        recommendedCourses.forEach((c) => {
          totalGapCourses += 1;
          if (c.status === "completed") completedCoursesCount += 1;
          else if (c.status === "in_progress") inProgressCoursesCount += 1;
          else notStartedCoursesCount += 1;
        });
      }

      const gapRatio = Math.max(
        0,
        (requiredLevel - effectiveLevel) / requiredLevel
      );
      const remainingHours =
        effectiveLevel >= requiredLevel
          ? 0
          : Math.max(
              1,
              Math.round(reqSkill.estHours * gapRatio * expOption.multiplier)
            );

      totalRequiredPoints += requiredLevel;
      totalMatchedPoints += Math.min(effectiveLevel, requiredLevel);
      totalRemainingHours += remainingHours;

      return {
        stepNumber: index + 1,
        skillId: reqSkill.skillId,
        skillName: skillMeta.name,
        category: skillMeta.category,
        why: reqSkill.why,
        initialLevel,
        effectiveLevel,
        requiredLevel,
        gap: Math.max(0, requiredLevel - effectiveLevel),
        status,
        statusLabel,
        hadGapInitially,
        completedViaCourses,
        includeInCoursePlan,
        remainingHours,
        courses: recommendedCourses,
        coursesTotal: recommendedCourses.length,
        coursesCompleted: skillCoursesCompleted,
        coursesInProgress: skillCoursesInProgress,
      };
    });

    const skillMatchPct =
      totalRequiredPoints > 0
        ? Math.round((totalMatchedPoints / totalRequiredPoints) * 100)
        : 0;

    const masteredSkillsCount = roadmap.filter(
      (s) => s.status === "strong"
    ).length;
    const roadmapProgressPct =
      roadmap.length > 0
        ? Math.round((masteredSkillsCount / roadmap.length) * 100)
        : 0;

    const overallCoursePct =
      totalGapCourses > 0
        ? Math.round((completedCoursesCount / totalGapCourses) * 100)
        : 100;

    const estimatedWeeks =
      totalRemainingHours === 0
        ? 0
        : Math.max(1, Math.ceil(totalRemainingHours / hoursOption.avgHours));

    const minWeeks =
      totalRemainingHours === 0
        ? 0
        : Math.max(1, Math.ceil(totalRemainingHours / hoursOption.maxHours));
    const maxWeeks =
      totalRemainingHours === 0
        ? 0
        : Math.max(1, Math.ceil(totalRemainingHours / hoursOption.minHours));

    const remainingSkills = roadmap.filter((s) => s.status !== "strong");
    const completedGapSkills = roadmap.filter((s) => s.completedViaCourses);

    const advisorSummary = buildAdvisorSummary({
      profile,
      role,
      hoursOption,
      roadmap,
      remainingSkills,
      completedGapSkills,
      skillMatchPct,
      estimatedWeeks,
      totalRemainingHours,
    });

    return {
      role,
      expOption,
      hoursOption,
      roadmap,
      skillMatchPct,
      roadmapProgressPct,
      masteredSkillsCount,
      totalSkillsCount: roadmap.length,
      strongCount,
      needsImprovementCount,
      missingCount,
      totalRemainingHours,
      estimatedWeeks,
      minWeeks,
      maxWeeks,
      totalGapCourses,
      completedCoursesCount,
      inProgressCoursesCount,
      notStartedCoursesCount,
      overallCoursePct,
      remainingSkills,
      completedGapSkills,
      advisorSummary,
    };
  }

  function buildAdvisorSummary(ctx) {
    const {
      profile,
      role,
      hoursOption,
      roadmap,
      remainingSkills,
      completedGapSkills,
      skillMatchPct,
      estimatedWeeks,
      totalRemainingHours,
    } = ctx;

    const firstName = (profile.name || "Learner").trim().split(/\s+/)[0];
    const strongSkills = roadmap
      .filter((s) => s.status === "strong")
      .map((s) => s.skillName);

    const bgText = profile.backgroundDetail
      ? `your ${profile.backgroundDetail} background`
      : "your current profile";

    if (remainingSkills.length === 0) {
      return {
        headline: `${firstName}, you are 100% skill-ready for ${role.name}!`,
        message: `Every required skill for ${role.name} is mastered (${skillMatchPct}% match). Keep sharpening your edge with real-world portfolio projects and mock interviews.`,
        nextFocus: [],
      };
    }

    const topFocus = remainingSkills.slice(0, 3);
    const focusNames = topFocus.map((s) => s.skillName).join(" → ");
    const strengthSnippet =
      strongSkills.length > 0
        ? `You already bring strength in ${strongSkills.slice(0, 2).join(" & ")}.`
        : `You are starting with a clean slate — every step is ordered from foundation to mastery.`;

    const progressSnippet =
      completedGapSkills.length > 0
        ? ` Great momentum completing ${completedGapSkills.map((s) => `${s.skillName} ✓`).join(", ")}!`
        : "";

    return {
      headline: `Personalized AI Roadmap for ${firstName} → ${role.name}`,
      message: `${strengthSnippet} Based on ${bgText}, start with ${focusNames} to close ${remainingSkills.length} remaining gap${remainingSkills.length === 1 ? "" : "s"} (${totalRemainingHours} hrs left, ~${estimatedWeeks} week${estimatedWeeks === 1 ? "" : "s"} at ${hoursOption.label}).${progressSnippet}`,
      nextFocus: topFocus,
    };
  }

  return {
    analyzeProfile,
    getExperienceOption,
    getWeeklyHoursOption,
  };
})();
