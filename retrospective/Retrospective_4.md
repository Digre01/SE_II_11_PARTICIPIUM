RETROSPECTIVE 4 (Team 11)
=========================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 4 estimated stories, 4 committed stories, 4 done stories
- Total points committed vs done : 18 committed and done story points
- Nr of hours planned vs spent (as a team) : 79h 50m hours planned, 82h 45m hours spent

**Remember**  a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
| ------ | ------- | ------ | ---------- | ------------ |
| _#0_ | 14      | -      | 54h 50m    | 58h          |
| 28     | 3       | 1      | 3h         | 3h 15m       |
| 15     | 6       | 1      | 4h         | 3h 45m       |
| 30     | 4       | 3      | 6h 30m     | 7h           |
| 12     | 5       | 13     | 12h 30m    | 10h 45m      |

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)

|            | Mean   | StDev  |
| ---------- | ------ | ------ |
| Actual     | 2h 45m | 3h 22m |
| Estimation | 2h 38m | 3h 23m |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1

  $$
  \frac{\sum_i estimation_{task_i}}{\sum_i spent_{task_i}} - 1 = 0,045263158
  $$
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

  $$
  \frac{1}{n} \sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0,14957672
  $$

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated: 3h
  - Total hours spent: 6h
  - Nr of automated unit test cases: 201
  - Coverage (if available)

    Stmt: 88.64
    Lines: 90.14
- Integration testing:
  - Total hours estimated: 30m
  - Total hours spent: 30m
  - Nr of test cases: 146
- E2E testing:
  - Total hours estimated: 4h
  - Total hours spent: 4h 30m
  - Nr of test cases: 55
- Code review:
  - Total hours estimated: 3h
  - Total hours spent: 3h
- Technical Debt management:
  - Strategy adopted:

    We allocated some hours to the technical debt at the end of the sprint, so that we could showcase a version of the software that met the quality gate during the demo. The strategy for this task was to first address the issues that prevented us from meeting the quality gate and then resolve as many additional issues as possible, starting from those with the highest severity.
  - Total hours estimated estimated at sprint planning: 5h
  - Total hours spent: 5h

## ASSESSMENT

- What caused your errors in estimation (if any)?
  - There was a understimation of the refactor of the tests because we thought that it would not require too much time to uniform already passing tests; also, we missed some scrum meetings because it was difficult to find the right time for every team member, especially during the holiday break, and we did some task together making the scrum meeting not so necessary.
- What lessons did you learn (both positive and negative) in this sprint?
  - The refactoring may need more time that we thought, so it may be better to plan more spefic tasks for it instead of planning only one task for everything.
- Which improvement goals set in the previous retrospective were you able to achieve?
  - We managed to spread evenly the workload during the sprint days, considering that we did not work during the holiday weeks.
- Which ones you were not able to achieve? Why?
  - None.
- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - There will not be a next sprint, but an hypotetical goal would be to manage in a better way the refactoring of the code and the tests, so that it's easier to make the project more clean and structured.
- One thing you are proud of as a Team!!
  - Each team member has always been available and work seriously on the project, there were no arguments or any type of conflicts during the semester because we managed to discuss in a diplomatic way; also, when someone had troubles completing a task, everyone was ready to help him.
