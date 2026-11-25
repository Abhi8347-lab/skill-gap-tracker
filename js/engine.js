/**
 * SkillSync AI Engine: Percentage Skill Gap Analysis, 6-Week Planner,
 * Adaptive Course Mapping, and Explainable Recommendations (with AI + Fallback).
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

  function getSlotsPerWeek(profile) {
    if (profile && Number(profile.learningSlotsPerWeek) > 0) {
      return Number(profile.learningSlotsPerWeek);
    }
    const map = { "2-5": 2, "5-10": 3, "10-20": 5, "20+": 7 };
    return map[profile?.weeklyHours] || 3;
  }

  function getActivePriorities(profile) {
    if (!profile) return [];
    if (Array.isArray(profile.companyPriorities) && profile.companyPriorities.length) {
      return profile.companyPriorities;
    }
    if (profile.companyPriority) return [profile.companyPriority];
    return [];
  }

  function resolveInitialPct(profile, skillId) {
    if (
      profile.skillScores &&
      profile.skillScores[skillId] !== undefined &&
      profile.skillScores[skillId] !== null
    ) {
      return Math.max(0, Math.min(100, Number(profile.skillScores[skillId])));
    }
    const stars = Number(profile.skillRatings?.[skillId] || 0);
    return Math.max(0, Math.min(100, Math.round(stars * 20)));
  }

  function getRecommendedCoursesForSkill(
    skillId,
    initialPct,
    requiredPct,
    courseProgress
  ) {
    const allCourses = window.SkillPathData.COURSES_BY_SKILL[skillId] || [];
    if (allCourses.length === 0) return [];

    // When learner already scores >= 50%, recommend targeted applied/intermediate courses
    // (preserving any foundation course already started/completed).
    if (initialPct >= 50 && initialPct < requiredPct) {
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

  function buildWhyThisCourse(course, skillItem, profile) {
    const priorities = getActivePriorities(profile);
    const priorityText = priorities.join(", ");
    const roleName =
      window.SkillPathData.ROLE_MAP[profile.targetRole]?.name || "your target role";

    if (skillItem.initialPct >= skillItem.requiredPct) {
      return `Optional refresher: your ${skillItem.skillName} score is already ${skillItem.initialPct}% (target ${skillItem.requiredPct}% for ${roleName}).`;
    }

    if (course.isCapstone) {
      return `Recommended as your Week 6 capstone to apply your SQL (${resolveInitialPct(profile, "sql")}%) and new ${skillItem.skillName} skills to a real ${priorityText || "executive"} dashboard.`;
    }

    if (skillItem.isPriorityMatch && priorityText) {
      return `Recommended because your ${skillItem.skillName} score is ${skillItem.initialPct}% (target ${skillItem.requiredPct}%) and ${skillItem.matchedPriorities.join(" & ")} is a current company priority.`;
    }

    return `Recommended because your ${skillItem.skillName} score is ${skillItem.initialPct}% (target ${skillItem.requiredPct}%), closing a ${skillItem.requiredPct - skillItem.initialPct}% gap needed for ${roleName}.`;
  }

  function generateSixWeekPlan(profile, roadmap) {
    const slotsPerWeek = getSlotsPerWeek(profile);
    const priorities = getActivePriorities(profile);

    // Explicit Stage 1 corporate demo plan for Junior Data Analyst
    if (profile.targetRole === "junior_data_analyst") {
      const powerBi = roadmap.find((s) => s.skillId === "power_bi");
      const stats = roadmap.find((s) => s.skillId === "statistics");
      const sql = roadmap.find((s) => s.skillId === "sql");

      return [
        {
          id: "plan-w1-3",
          weeksLabel: "Weeks 1–3",
          title: "Power BI Essentials",
          skillId: "power_bi",
          skillName: "Power BI",
          slotsLabel: `${slotsPerWeek} learning slots/week (${slotsPerWeek * 3} slots total)`,
          priorityTag: priorities.includes("Dashboards") ? "Priority: Dashboards" : null,
          targetSummary: powerBi
            ? `Lift Power BI from ${powerBi.effectivePct}% → ${powerBi.requiredPct}% target`
            : "Build core Power BI reporting proficiency (80% target)",
          description:
            "Master Power Query transforms, star-schema data modeling, DAX measures, and executive dashboard layouts.",
          status: powerBi ? powerBi.status : "needs_improvement",
        },
        {
          id: "plan-w4-5",
          weeksLabel: "Weeks 4–5",
          title: "Applied Statistics",
          skillId: "statistics",
          skillName: "Statistics",
          slotsLabel: `${slotsPerWeek} learning slots/week (${slotsPerWeek * 2} slots total)`,
          priorityTag: null,
          targetSummary: stats
            ? `Lift Statistics from ${stats.effectivePct}% → ${stats.requiredPct}% target`
            : "Strengthen applied statistical inference (80% target)",
          description:
            "Practice distributions, confidence intervals, hypothesis testing, and KPI variance analysis on business datasets.",
          status: stats ? stats.status : "needs_improvement",
        },
        {
          id: "plan-w6",
          weeksLabel: "Week 6",
          title: "Mini dashboard project",
          skillId: "power_bi",
          skillName: "Mini Dashboard Project",
          slotsLabel: `${slotsPerWeek} learning slots (${slotsPerWeek} slots total)`,
          priorityTag: priorities.includes("Dashboards") ? "Capstone · Dashboards" : "Capstone",
          targetSummary: `Integrate SQL (${sql ? sql.effectivePct : 80}%) + Power BI + Applied Statistics`,
          description:
            "Build and publish an end-to-end executive KPI dashboard combining SQL warehouse queries, statistical insights, and Power BI visuals.",
          status:
            powerBi?.status === "strong" && stats?.status === "strong"
              ? "strong"
              : "needs_improvement",
        },
      ];
    }

    // Dynamic 6-week plan for any other role
    const gaps = roadmap.filter((s) => s.status !== "strong");
    if (gaps.length === 0) {
      return [
        {
          id: "plan-w1-6",
          weeksLabel: "Weeks 1–6",
          title: `${window.SkillPathData.ROLE_MAP[profile.targetRole]?.name || "Role"} Mastery & Capstone`,
          skillId: roadmap[0]?.skillId || "",
          skillName: "All Target Skills Strong",
          slotsLabel: `${slotsPerWeek} learning slots/week`,
          priorityTag: priorities[0] ? `Priority: ${priorities[0]}` : null,
          targetSummary: "All required skills meet target proficiency",
          description:
            "Focus on cross-functional portfolio projects, code/architecture reviews, and mentoring peers.",
          status: "strong",
        },
      ];
    }

    const phaseOne = gaps[0];
    const phaseTwo = gaps[1] || gaps[0];
    return [
      {
        id: "plan-w1-3",
        weeksLabel: "Weeks 1–3",
        title: `${phaseOne.skillName} Core Sprint`,
        skillId: phaseOne.skillId,
        skillName: phaseOne.skillName,
        slotsLabel: `${slotsPerWeek} learning slots/week`,
        priorityTag: phaseOne.isPriorityMatch
          ? `Priority: ${phaseOne.matchedPriorities[0]}`
          : null,
        targetSummary: `Lift ${phaseOne.skillName} from ${phaseOne.effectivePct}% → ${phaseOne.requiredPct}%`,
        description: phaseOne.why,
        status: phaseOne.status,
      },
      {
        id: "plan-w4-5",
        weeksLabel: "Weeks 4–5",
        title:
          phaseTwo.skillId !== phaseOne.skillId
            ? `Applied ${phaseTwo.skillName}`
            : `Intermediate ${phaseOne.skillName} Practice`,
        skillId: phaseTwo.skillId,
        skillName: phaseTwo.skillName,
        slotsLabel: `${slotsPerWeek} learning slots/week`,
        priorityTag: phaseTwo.isPriorityMatch
          ? `Priority: ${phaseTwo.matchedPriorities[0]}`
          : null,
        targetSummary: `Lift ${phaseTwo.skillName} from ${phaseTwo.effectivePct}% → ${phaseTwo.requiredPct}%`,
        description: phaseTwo.why,
        status: phaseTwo.status,
      },
      {
        id: "plan-w6",
        weeksLabel: "Week 6",
        title: "Applied Role Mini Project",
        skillId: phaseOne.skillId,
        skillName: "Capstone Integration",
        slotsLabel: `${slotsPerWeek} learning slots`,
        priorityTag: priorities[0] ? `Aligned: ${priorities[0]}` : "Capstone",
        targetSummary: "Synthesize newly learned skills into a demonstrable deliverable",
        description:
          "Ship a focused mini project applying your top two target skills with peer/manager review.",
        status: "needs_improvement",
      },
    ];
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
    const slotsPerWeek = getSlotsPerWeek(profile);
    const activePriorities = getActivePriorities(profile);

    let totalRequiredPct = 0;
    let totalMatchedPct = 0;
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

      const initialPct = resolveInitialPct(profile, reqSkill.skillId);
      const requiredPct =
        reqSkill.requiredPct !== undefined
          ? reqSkill.requiredPct
          : reqSkill.required * 20;
      const requiredLevel = Number((requiredPct / 20).toFixed(1));
      const initialLevel = Number((initialPct / 20).toFixed(1));
      const hadGapInitially = initialPct < requiredPct;

      const skillTags = data.SKILL_PRIORITY_TAGS[reqSkill.skillId] || [];
      const matchedPriorities = activePriorities.filter((p) =>
        skillTags.includes(p)
      );
      const isPriorityMatch = matchedPriorities.length > 0;

      const rawCourses = getRecommendedCoursesForSkill(
        reqSkill.skillId,
        initialPct,
        requiredPct,
        progress
      );

      const skillCoursesCompleted = rawCourses.filter(
        (c) => progress[c.id] === "completed"
      ).length;
      const skillCoursesInProgress = rawCourses.filter(
        (c) => progress[c.id] === "in_progress"
      ).length;
      const allSkillCoursesDone =
        rawCourses.length > 0 && skillCoursesCompleted === rawCourses.length;

      let effectivePct = initialPct;
      if (hadGapInitially) {
        if (allSkillCoursesDone) {
          effectivePct = requiredPct;
        } else if (
          (skillCoursesCompleted > 0 || skillCoursesInProgress > 0) &&
          rawCourses.length > 0
        ) {
          const weightedDone =
            skillCoursesCompleted + skillCoursesInProgress * 0.4;
          const gain = Math.round(
            ((requiredPct - initialPct) * weightedDone) / rawCourses.length
          );
          effectivePct = Math.min(
            requiredPct - 5,
            Math.max(initialPct, initialPct + gain)
          );
        }
      }

      const effectiveLevel = Number((effectivePct / 20).toFixed(1));

      let status = "missing";
      let statusLabel = "Missing";
      if (effectivePct >= requiredPct) {
        status = "strong";
        statusLabel = hadGapInitially ? "Completed ✓" : "Strong";
        strongCount += 1;
      } else if (effectivePct > 0) {
        status = "needs_improvement";
        statusLabel = "Needs Improvement";
        needsImprovementCount += 1;
      } else {
        status = "missing";
        statusLabel = "Missing";
        missingCount += 1;
      }

      const completedViaCourses = hadGapInitially && allSkillCoursesDone;
      const includeInCoursePlan =
        hadGapInitially ||
        skillCoursesCompleted > 0 ||
        skillCoursesInProgress > 0;

      const skillItemShell = {
        skillId: reqSkill.skillId,
        skillName: skillMeta.name,
        initialPct,
        effectivePct,
        requiredPct,
        isPriorityMatch,
        matchedPriorities,
      };

      const recommendedCourses = rawCourses.map((course) => ({
        ...course,
        status: progress[course.id] || "not_started",
        whyRecommended: buildWhyThisCourse(course, skillItemShell, profile),
      }));

      if (includeInCoursePlan) {
        recommendedCourses.forEach((c) => {
          totalGapCourses += 1;
          if (c.status === "completed") completedCoursesCount += 1;
          else if (c.status === "in_progress") inProgressCoursesCount += 1;
          else notStartedCoursesCount += 1;
        });
      }

      const gapPct = Math.max(0, requiredPct - effectivePct);
      const gapRatio = requiredPct > 0 ? gapPct / requiredPct : 0;
      const remainingHours =
        effectivePct >= requiredPct
          ? 0
          : Math.max(
              1,
              Math.round(reqSkill.estHours * gapRatio * expOption.multiplier)
            );

      totalRequiredPct += requiredPct;
      totalMatchedPct += Math.min(effectivePct, requiredPct);
      totalRemainingHours += remainingHours;

      return {
        stepNumber: index + 1,
        skillId: reqSkill.skillId,
        skillName: skillMeta.name,
        category: skillMeta.category,
        why: reqSkill.why,
        initialPct,
        effectivePct,
        requiredPct,
        gapPct,
        initialLevel,
        effectiveLevel,
        requiredLevel,
        gap: Math.max(0, Number((requiredLevel - effectiveLevel).toFixed(1))),
        isPriorityMatch,
        matchedPriorities,
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
      totalRequiredPct > 0
        ? Math.round((totalMatchedPct / totalRequiredPct) * 100)
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
        : profile.targetRole === "junior_data_analyst" &&
            completedCoursesCount === 0 &&
            inProgressCoursesCount === 0
          ? 6
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
    const sixWeekPlan = generateSixWeekPlan(profile, roadmap);

    const advisorSummary = buildAdvisorSummary({
      profile,
      role,
      hoursOption,
      slotsPerWeek,
      activePriorities,
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
      slotsPerWeek,
      activePriorities,
      roadmap,
      sixWeekPlan,
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
      slotsPerWeek,
      activePriorities,
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
      .map((s) => `${s.skillName} (${s.effectivePct}%)`);

    const bgText = profile.backgroundDetail
      ? `your ${profile.backgroundDetail} background`
      : "your current profile";

    const priorityText = activePriorities.length
      ? ` aligned with company priority: ${activePriorities.join(", ")}`
      : "";

    if (remainingSkills.length === 0) {
      return {
        headline: `${firstName}, you are 100% skill-ready for ${role.name}!`,
        message: `Every required skill for ${role.name} meets or exceeds target proficiency (${skillMatchPct}% match).`,
        nextFocus: [],
      };
    }

    const topFocus = remainingSkills.slice(0, 3);
    const focusNames = topFocus
      .map((s) => `${s.skillName} (${s.effectivePct}%→${s.requiredPct}%)`)
      .join(" → ");
    const strengthSnippet =
      strongSkills.length > 0
        ? `You already meet target in ${strongSkills.slice(0, 2).join(" & ")}.`
        : `You are starting with a clean slate — every step is ordered from foundation to mastery.`;

    const progressSnippet =
      completedGapSkills.length > 0
        ? ` Great momentum completing ${completedGapSkills.map((s) => `${s.skillName} ✓`).join(", ")}!`
        : "";

    return {
      headline: `SkillSync AI Agent Plan for ${firstName} → ${role.name}`,
      message: `${strengthSnippet} Based on ${bgText}${priorityText}, focus on ${focusNames} across ${slotsPerWeek} learning slots/week (~${estimatedWeeks} week${estimatedWeeks === 1 ? "" : "s"}, ${totalRemainingHours} hrs left).${progressSnippet}`,
      nextFocus: topFocus,
    };
  }

  /**
   * Calls stateless /api/ai-explain when running on HTTP; falls back smoothly
   * to deterministic template explanations when offline or without an API key.
   */
  async function fetchAiExplanations(profile, analysis) {
    if (!profile || !analysis) return { source: "fallback", explanations: {} };

    const flatCourses = [];
    analysis.roadmap.forEach((step) => {
      if (!step.includeInCoursePlan) return;
      step.courses.forEach((c) => {
        flatCourses.push({
          courseId: c.id,
          title: c.title,
          skillName: step.skillName,
          currentPct: step.initialPct,
          targetPct: step.requiredPct,
          isPriorityMatch: step.isPriorityMatch,
        });
      });
    });

    if (flatCourses.length === 0) {
      return { source: "fallback", explanations: {} };
    }

    const canCallApi =
      window.location.protocol === "http:" ||
      window.location.protocol === "https:";

    if (!canCallApi) {
      return { source: "fallback", explanations: {} };
    }

    try {
      const resp = await window.fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: analysis.role.name,
          companyPriority: (analysis.activePriorities || [])[0] || "",
          courses: flatCourses,
        }),
      });
      if (!resp.ok) {
        return { source: "fallback", explanations: {} };
      }
      return await resp.json();
    } catch (_err) {
      return { source: "fallback", explanations: {} };
    }
  }

  return {
    analyzeProfile,
    fetchAiExplanations,
    getExperienceOption,
    getWeeklyHoursOption,
    getSlotsPerWeek,
    getActivePriorities,
    resolveInitialPct,
  };
})();
