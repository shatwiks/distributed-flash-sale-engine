---
name: Enforce Taste Skill (Anti-Slop Frontend)
description: Mandatory rule to apply Taste-Skill v2 art direction, anti-slop standards, and layout discipline across all frontend pages and components.
---

# Taste-Skill Anti-Slop Standards

Whenever creating, designing, restyling, or reviewing any frontend page, layout, or component in this repository:

1. **Adhere to Skill Directives:** Follow the art direction rules and curated reference libraries located in [.agents/skills/taste-skill/SKILL.md](file:///d:/PROJECTS/Distributed%20Flash%20Sale%20Engine/.agents/skills/taste-skill/SKILL.md), [references/](file:///d:/PROJECTS/Distributed%20Flash%20Sale%20Engine/.agents/skills/taste-skill/references/), and [library/](file:///d:/PROJECTS/Distributed%20Flash%20Sale%20Engine/.agents/skills/taste-skill/library/).
2. **Anti-Default Discipline:** Eliminate generic AI patterns (e.g. gratuitous purple/indigo mesh gradients, centered 3-card repeating grids, unmotivated glassmorphism on every card, em-dash filler text). Reach for deliberate, concept-driven layout choices.
3. **Harmonize with Design Truth:** Honor the active direction recorded in [.taste-skill/direction.json](file:///d:/PROJECTS/Distributed%20Flash%20Sale%20Engine/.taste-skill/direction.json) and system tokens in [DESIGN.md](file:///d:/PROJECTS/Distributed%20Flash%20Sale%20Engine/DESIGN.md).
4. **Lint & Pre-flight Check:** Run `node .agents/skills/taste-skill/scripts/lint.mjs frontend` on all changes to maintain 0 rule failures, ensuring interface elements keep purposeful borders, surfaces, and typography scales.
5. **Preserve Copy & World:** Maintain original textual copy, factual numbers, and real domain terminology.
