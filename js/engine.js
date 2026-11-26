/**
 * SkillSync AI Engine:
 * - Diagnostic getLevel(easyCorrect, hardCorrect) rules
 * - Verified vs self-rated percentage skill gap analysis
 * - Priority-aware smart ranking & adaptive 6-week re-planning
 * - Explainable course recommendations & organization dashboard metrics
 */
window.SkillPathEngine = (function () {
  const LEVEL_TO_PCT = {
    Beginner: 30,
    Intermediate: 60,
    Expert: 90,
  };

  /**
   * Determine diagnostic skill level from easy (0-3) and hard (0-2) correct counts.
   * Rules:
   * - Expert: all 5 correct.
   * - Intermediate: 3 or 4 correct AND at least 2 of the 3 easy questions correct.
   * - Beginner: everything else (0-2 correct, or failing the easy foundation questions).
   *
   * @param {number} easyCorrect - Number of easy questions answered correctly (0-3).
   * @param {number} hardCorrect - Number of hard questions answered correctly (0-2).
   * @returns {"Beginner" | "Intermediate" | "Expert"}
   */
  function getLevel(easyCorrect, hardCorrect) {
    const easy = Math.max(0, Math.min(3, Math.floor(Number(easyCorrect) || 0)));
    const hard = Math.max(0, Math.min(2, Math.floor(Number(hardCorrect) || 0)));
    const total = easy + hard;

    if (total === 5) {
      return "Expert";
    }
    if ((total === 3 || total === 4) && easy >= 2) {
      return "Intermediate";
    }
    return "Beginner";
  }

  function getLevelPct(level) {
    return LEVEL_TO_PCT[level] || 30;
  }

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
    if (
      Array.isArray(profile.companyPriorities) &&
      profile.companyPriorities.length
    ) {
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
    baselinePct,
    requiredPct,
    courseProgress
  ) {
    const allCourses = window.SkillPathData.COURSES_BY_SKILL[skillId] || [];
    if (allCourses.length === 0) return [];

    if (baselinePct >= 50 && baselinePct < requiredPct) {
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
      window.SkillPathData.ROLE_MAP[profile.targetRole]?.name ||
      "your target role";

    const scoreSourceText = skillItem.isVerified
      ? `verified ${skillItem.verifiedLevel} (${skillItem.baselinePct}%)`
      : `${skillItem.baselinePct}%`;

    if (skillItem.baselinePct >= skillItem.requiredPct) {
      return `Optional refresher: your ${skillItem.skillName} score is already ${scoreSourceText} (target ${skillItem.requiredPct}% for ${roleName}).`;
    }

    if (course.isCapstone) {
      return `Recommended as your Week 6 capstone to apply your SQL (${resolveInitialPct(profile, "sql")}%) and ${skillItem.skillName} (${scoreSourceText}) to a real ${priorityText || "executive"} dashboard.`;
    }

    if (skillItem.isPriorityMatch) {
      const pLabel =
        skillItem.matchedPriorities[0] ||
        priorityText ||
        "organization priority";
      return `Recommended because your ${skillItem.skillName} score is ${scoreSourceText} (target ${skillItem.requiredPct}%) and ${pLabel} is a current company priority.`;
    }

    return `Recommended because your ${skillItem.skillName} score is ${scoreSourceText} (target ${skillItem.requiredPct}%), closing a ${skillItem.requiredPct - skillItem.baselinePct}% gap needed for ${roleName}.`;
  }

  function generateSixWeekPlan(profile, roadmap) {
    const slotsPerWeek = getSlotsPerWeek(profile);
    const priorities = getActivePriorities(profile);

    const powerBi = roadmap.find((s) => s.skillId === "power_bi");
    const stats = roadmap.find((s) => s.skillId === "statistics");
    const sql = roadmap.find((s) => s.skillId === "sql");

    // Preserve Stage 1 6-week template for Junior Data Analyst when Power BI & Statistics
    // are the active gaps and SQL is already >= 80%.
    const isClassicDemoGapShape =
      profile.targetRole === "junior_data_analyst" &&
      powerBi &&
      stats &&
      sql &&
      powerBi.effectivePct < powerBi.requiredPct &&
      stats.effectivePct < stats.requiredPct &&
      sql.effectivePct >= sql.requiredPct &&
      roadmap[0].skillId === "power_bi";

    if (isClassicDemoGapShape) {
      return [
        {
          id: "plan-w1-3",
          weeksLabel: "Weeks 1–3",
          title: "Power BI Essentials",
          skillId: "power_bi",
          skillName: "Power BI",
          slotsLabel: `${slotsPerWeek} learning slots/week (${slotsPerWeek * 3} slots total)`,
          priorityTag: priorities.includes("Dashboards")
            ? "Priority: Dashboards"
            : powerBi.isPriorityMatch
              ? `Org Priority (W${powerBi.priorityWeight})`
              : null,
          targetSummary: `Lift Power BI from ${powerBi.effectivePct}% → ${powerBi.requiredPct}% target`,
          description:
            "Master Power Query transforms, star-schema data modeling, DAX measures, and executive dashboard layouts.",
          status: powerBi.status,
        },
        {
          id: "plan-w4-5",
          weeksLabel: "Weeks 4–5",
          title: "Applied Statistics",
          skillId: "statistics",
          skillName: "Statistics",
          slotsLabel: `${slotsPerWeek} learning slots/week (${slotsPerWeek * 2} slots total)`,
          priorityTag: stats.isPriorityMatch
            ? `Org Priority (W${stats.priorityWeight})`
            : null,
          targetSummary: `Lift Statistics from ${stats.effectivePct}% → ${stats.requiredPct}% target`,
          description:
            "Practice distributions, confidence intervals, hypothesis testing, and KPI variance analysis on business datasets.",
          status: stats.status,
        },
        {
          id: "plan-w6",
          weeksLabel: "Week 6",
          title: "Mini dashboard project",
          skillId: "power_bi",
          skillName: "Mini Dashboard Project",
          slotsLabel: `${slotsPerWeek} learning slots (${slotsPerWeek} slots total)`,
          priorityTag: priorities.includes("Dashboards")
            ? "Capstone · Dashboards"
            : "Capstone",
          targetSummary: `Integrate SQL (${sql.effectivePct}%) + Power BI (${powerBi.effectivePct}%) + Statistics (${stats.effectivePct}%)`,
          description:
            "Build and publish an end-to-end executive KPI dashboard combining SQL warehouse queries, statistical insights, and Power BI visuals.",
          status:
            powerBi.status === "strong" && stats.status === "strong"
              ? "strong"
              : "needs_improvement",
        },
      ];
    }

    // Dynamic adaptive 6-week plan ranked by priority weight & remaining gap size
    const gaps = roadmap
      .filter((s) => s.status !== "strong")
      .sort((a, b) => b.rankScore - a.rankScore);

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
            "Focus on cross-functional deliverables, architecture reviews, and mentoring peers.",
          status: "strong",
        },
      ];
    }

    const phaseOne = gaps[0];
    const phaseTwo = gaps[1] || gaps[0];
    const phaseThreeSkill = gaps[2] || phaseOne;

    return [
      {
        id: "plan-w1-3",
        weeksLabel: "Weeks 1–3",
        title:
          phaseOne.skillId === "power_bi"
            ? "Power BI Essentials"
            : `${phaseOne.skillName} Core Sprint`,
        skillId: phaseOne.skillId,
        skillName: phaseOne.skillName,
        slotsLabel: `${slotsPerWeek} learning slots/week (${slotsPerWeek * 3} slots total)`,
        priorityTag: phaseOne.isPriorityMatch
          ? `Priority: ${phaseOne.matchedPriorities[0] || `Weight ${phaseOne.priorityWeight}`}`
          : null,
        targetSummary: `Lift ${phaseOne.skillName} from ${phaseOne.effectivePct}% → ${phaseOne.requiredPct}%`,
        description: phaseOne.why,
        status: phaseOne.status,
      },
      {
        id: "plan-w4-5",
        weeksLabel: "Weeks 4–5",
        title:
          phaseTwo.skillId === "statistics"
            ? "Applied Statistics"
            : phaseTwo.skillId !== phaseOne.skillId
              ? `Applied ${phaseTwo.skillName}`
              : `Intermediate ${phaseOne.skillName} Practice`,
        skillId: phaseTwo.skillId,
        skillName: phaseTwo.skillName,
        slotsLabel: `${slotsPerWeek} learning slots/week (${slotsPerWeek * 2} slots total)`,
        priorityTag: phaseTwo.isPriorityMatch
          ? `Priority: ${phaseTwo.matchedPriorities[0] || `Weight ${phaseTwo.priorityWeight}`}`
          : null,
        targetSummary: `Lift ${phaseTwo.skillName} from ${phaseTwo.effectivePct}% → ${phaseTwo.requiredPct}%`,
        description: phaseTwo.why,
        status: phaseTwo.status,
      },
      {
        id: "plan-w6",
        weeksLabel: "Week 6",
        title:
          profile.targetRole === "junior_data_analyst"
            ? "Mini dashboard project"
            : `${phaseThreeSkill.skillName} Mini Project`,
        skillId: phaseThreeSkill.skillId,
        skillName: "Capstone Integration",
        slotsLabel: `${slotsPerWeek} learning slots (${slotsPerWeek} slots total)`,
        priorityTag: priorities[0] ? `Capstone · ${priorities[0]}` : "Capstone",
        targetSummary:
          gaps.length > 2
            ? `Apply ${phaseOne.skillName}, ${phaseTwo.skillName} & ${phaseThreeSkill.skillName} (${phaseThreeSkill.effectivePct}% → ${phaseThreeSkill.requiredPct}%)`
            : `Synthesize ${phaseOne.skillName} & ${phaseTwo.skillName} into a live deliverable`,
        description:
          "Build and review a practical capstone project validating your updated skill levels.",
        status: "needs_improvement",
      },
    ];
  }

  /**
   * Core gap analysis integrating self-rated scores, verified diagnostic levels,
   * HR priority weights, and course completion progress.
   */
  function analyzeProfile(profile, courseProgress, extraState) {
    const data = window.SkillPathData;
    const progress = courseProgress || {};

    if (!profile || !profile.targetRole) {
      return null;
    }

    const storedState =
      extraState ||
      (window.SkillPathStorage ? window.SkillPathStorage.readLocal() : {});
    const empId = storedState.currentEmployeeId || "emp_current";
    const verifiedMap =
      extraState && extraState.verifiedLevelsOverride
        ? extraState.verifiedLevelsOverride
        : storedState.verifiedLevels?.[empId] || {};
    const orgPriorities = Array.isArray(storedState.priorities)
      ? storedState.priorities
      : data.DEFAULT_ORG_PRIORITIES || [];
    const orgPriorityMap = Object.fromEntries(
      orgPriorities.map((p) => [p.skillId, Number(p.weight) || 3])
    );

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

    const rawRoadmap = role.skills.map((reqSkill, index) => {
      const skillMeta = data.SKILL_MAP[reqSkill.skillId] || {
        id: reqSkill.skillId,
        name: reqSkill.skillId,
        category: "Core",
      };

      const selfRatedPct = resolveInitialPct(profile, reqSkill.skillId);
      const verifiedRecord = verifiedMap[reqSkill.skillId] || null;
      const isVerified = Boolean(verifiedRecord && verifiedRecord.level);
      const verifiedLevel = isVerified ? verifiedRecord.level : null;
      const verifiedPct = isVerified ? getLevelPct(verifiedLevel) : null;

      // Verified score overrides self-rated score when available.
      const baselinePct = isVerified ? verifiedPct : selfRatedPct;

      const requiredPct =
        reqSkill.requiredPct !== undefined
          ? reqSkill.requiredPct
          : reqSkill.required * 20;
      const requiredLevel = Number((requiredPct / 20).toFixed(1));
      const hadGapInitially = baselinePct < requiredPct;

      const skillTags = data.SKILL_PRIORITY_TAGS[reqSkill.skillId] || [];
      const matchedPriorities = activePriorities.filter((p) =>
        skillTags.includes(p)
      );
      const orgWeight = orgPriorityMap[reqSkill.skillId] || 0;
      const isPriorityMatch = matchedPriorities.length > 0 || orgWeight > 0;
      const priorityWeight = orgWeight
        ? orgWeight
        : matchedPriorities.length > 0
          ? 4
          : 1;

      const rawCourses = getRecommendedCoursesForSkill(
        reqSkill.skillId,
        baselinePct,
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

      let effectivePct = baselinePct;
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
            ((requiredPct - baselinePct) * weightedDone) / rawCourses.length
          );
          effectivePct = Math.min(
            requiredPct - 5,
            Math.max(baselinePct, baselinePct + gain)
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

      const comparisonText = isVerified
        ? selfRatedPct > 0
          ? `Self-rated ${selfRatedPct}% vs Verified ${verifiedLevel} (${verifiedPct}%)`
          : `Verified ${verifiedLevel} (${verifiedPct}%)`
        : `Unverified · Self-rated ${selfRatedPct}%`;

      const skillItemShell = {
        skillId: reqSkill.skillId,
        skillName: skillMeta.name,
        selfRatedPct,
        baselinePct,
        effectivePct,
        requiredPct,
        isVerified,
        verifiedLevel,
        isPriorityMatch,
        matchedPriorities:
          matchedPriorities.length > 0
            ? matchedPriorities
            : orgWeight > 0
              ? [`Org Priority W${orgWeight}`]
              : [],
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

      const rankScore = gapPct * (1 + (priorityWeight - 1) * 0.35);

      return {
        originalIndex: index,
        stepNumber: index + 1,
        skillId: reqSkill.skillId,
        skillName: skillMeta.name,
        category: skillMeta.category,
        why: reqSkill.why,
        selfRatedPct,
        baselinePct,
        initialPct: baselinePct,
        effectivePct,
        requiredPct,
        gapPct,
        isVerified,
        verifiedLevel,
        verifiedPct,
        verifiedUpdatedAt: verifiedRecord?.updatedAt || null,
        comparisonText,
        initialLevel: Number((baselinePct / 20).toFixed(1)),
        effectiveLevel,
        requiredLevel,
        gap: Math.max(0, Number((requiredLevel - effectiveLevel).toFixed(1))),
        isPriorityMatch,
        priorityWeight,
        matchedPriorities: skillItemShell.matchedPriorities,
        rankScore,
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

    // Sort priority-boosted remaining gaps cleanly to the top when HR/org priority weights exist
    const roadmap = rawRoadmap
      .slice()
      .sort((a, b) => {
        const aGap = a.status !== "strong" ? 1 : 0;
        const bGap = b.status !== "strong" ? 1 : 0;
        if (aGap !== bGap) return bGap - aGap;
        if (aGap === 1 && b.rankScore !== a.rankScore) {
          return b.rankScore - a.rankScore;
        }
        return a.originalIndex - b.originalIndex;
      })
      .map((item, idx) => ({
        ...item,
        stepNumber: idx + 1,
      }));

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
            inProgressCoursesCount === 0 &&
            Object.keys(verifiedMap).length === 0
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

  function computeAverageLevelLabel(verifiedMap) {
    const entries = Object.values(verifiedMap || {});
    if (entries.length === 0) return "Unverified";
    const avgPct =
      entries.reduce((acc, item) => acc + getLevelPct(item.level), 0) /
      entries.length;
    if (avgPct >= 78) return "Expert";
    if (avgPct >= 48) return "Intermediate";
    return "Beginner";
  }

  function buildCourseSpendForProgress(courseProgress) {
    const allCourses = Object.values(
      window.SkillPathData.COURSES_BY_SKILL
    ).flat();
    const courseById = Object.fromEntries(allCourses.map((c) => [c.id, c]));
    let spend = 0;
    Object.entries(courseProgress || {}).forEach(([cid, status]) => {
      if (status === "completed" || status === "in_progress") {
        spend += Number(courseById[cid]?.cost || 0);
      }
    });
    return spend;
  }

  /**
   * Build unified employee records (seeded team + active current user) for Manager/HR Dashboard.
   */
  function buildOrganizationDataset(state) {
    const data = window.SkillPathData;
    const activeState = state || {};
    const orgPriorities = Array.isArray(activeState.priorities)
      ? activeState.priorities
      : data.DEFAULT_ORG_PRIORITIES || [];

    const records = (data.SEED_EMPLOYEES || []).map((emp) => {
      const pseudoProfile = {
        name: emp.name,
        status: "employee",
        backgroundDetail: data.ROLE_MAP[emp.targetRole]?.name || "Analyst",
        targetRole: emp.targetRole,
        companyPriority: emp.companyPriority,
        companyPriorities: [emp.companyPriority],
        learningSlotsPerWeek: emp.learningSlotsPerWeek,
        weeklyHours: emp.weeklyHours,
        experience: emp.experience,
        skillScores: emp.selfScores || {},
      };

      const mergedVerified = {
        ...(emp.verifiedLevels || {}),
        ...(activeState.verifiedLevels?.[emp.id] || {}),
      };
      const mergedTests = {
        ...(emp.testResults || {}),
        ...(activeState.testResults?.[emp.id] || {}),
      };

      const analysis = analyzeProfile(pseudoProfile, emp.courseProgress || {}, {
        currentEmployeeId: emp.id,
        verifiedLevelsOverride: mergedVerified,
        priorities: orgPriorities,
      });

      const allAttempts = Object.values(mergedTests).flat();
      const sortedDates = allAttempts
        .map((a) => a.date)
        .filter(Boolean)
        .sort();
      const lastTestDate = sortedDates.length
        ? sortedDates[sortedDates.length - 1].slice(0, 10)
        : "Not tested";

      const verifiedCount = Object.keys(mergedVerified).length;
      const avgLevel = computeAverageLevelLabel(mergedVerified);
      const completionPct = analysis ? analysis.overallCoursePct : 0;

      let status = "On track";
      if (completionPct < 35 || avgLevel === "Beginner") status = "At risk";
      else if (completionPct < 65) status = "Behind";

      const spend = buildCourseSpendForProgress(emp.courseProgress);

      return {
        id: emp.id,
        name: emp.name,
        isCurrentUser: false,
        isSeededDemo: true,
        team: emp.team,
        roleId: emp.targetRole,
        roleName: data.ROLE_MAP[emp.targetRole]?.name || emp.targetRole,
        verifiedLevels: mergedVerified,
        testResults: mergedTests,
        verifiedCount,
        avgLevel,
        completionPct,
        lastTestDate,
        status,
        analysis,
        courseProgress: emp.courseProgress || {},
        replanHistory: emp.replanHistory || [],
        spend,
        levelsGained: emp.levelsGained || 1,
      };
    });

    // Include the active user as one row inside Manager's team
    const currentEmpId = activeState.currentEmployeeId || "emp_current";
    const activeProfile =
      activeState.profile || data.DEMO_EMPLOYEE_PROFILE;
    const currentVerified = activeState.verifiedLevels?.[currentEmpId] || {};
    const currentTests = activeState.testResults?.[currentEmpId] || {};
    const currentProgress = activeState.courseProgress || {};

    const currentAnalysis = analyzeProfile(activeProfile, currentProgress, {
      currentEmployeeId: currentEmpId,
      verifiedLevelsOverride: currentVerified,
      priorities: orgPriorities,
    });

    const userAttempts = Object.values(currentTests).flat();
    const userDates = userAttempts
      .map((a) => a.date)
      .filter(Boolean)
      .sort();
    const userLastDate = userDates.length
      ? userDates[userDates.length - 1].slice(0, 10)
      : "Not tested";
    const userVerifiedCount = Object.keys(currentVerified).length;
    const userAvgLevel = computeAverageLevelLabel(currentVerified);
    const userCompletionPct = currentAnalysis
      ? currentAnalysis.overallCoursePct
      : 0;

    let userStatus = "On track";
    if (userCompletionPct < 35 && userVerifiedCount === 0) {
      userStatus = "Behind";
    } else if (userCompletionPct < 35 || userAvgLevel === "Beginner") {
      userStatus = "At risk";
    } else if (userCompletionPct < 65) {
      userStatus = "Behind";
    }

    const userLevelsGained =
      Object.values(currentVerified).filter((v) => v.level !== "Beginner")
        .length + (currentAnalysis ? currentAnalysis.completedGapSkills.length : 0);

    records.unshift({
      id: currentEmpId,
      name: activeProfile.name || "Current Employee",
      isCurrentUser: true,
      isSeededDemo: Boolean(activeProfile.isDemo),
      team: data.MANAGER_TEAM_NAME,
      roleId: activeProfile.targetRole,
      roleName:
        data.ROLE_MAP[activeProfile.targetRole]?.name ||
        activeProfile.targetRole,
      verifiedLevels: currentVerified,
      testResults: currentTests,
      verifiedCount: userVerifiedCount,
      avgLevel: userAvgLevel,
      completionPct: userCompletionPct,
      lastTestDate: userLastDate,
      status: userStatus,
      analysis: currentAnalysis,
      courseProgress: currentProgress,
      replanHistory: (activeState.replanHistory || []).filter(
        (r) => !r.employeeId || r.employeeId === currentEmpId
      ),
      spend: buildCourseSpendForProgress(currentProgress),
      levelsGained: Math.max(1, userLevelsGained),
    });

    return records;
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
          currentPct: step.baselinePct,
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
    LEVEL_TO_PCT,
    getLevel,
    getLevelPct,
    analyzeProfile,
    buildOrganizationDataset,
    fetchAiExplanations,
    getExperienceOption,
    getWeeklyHoursOption,
    getSlotsPerWeek,
    getActivePriorities,
    resolveInitialPct,
  };
})();
