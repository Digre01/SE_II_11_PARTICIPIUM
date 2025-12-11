RETROSPECTIVE 3 (Team 11)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs done : 5 estimated stories, 5 committed stories, 5 done stories
- Total points committed vs done : 31 committed and done story points
- Nr of hours planned vs spent (as a team) : 79h 50m hours planned, 78h 45m hours spent

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _#0_   | 18      |    -   | 35h 50m    | 35h 5m       |
| 24     | 7       | 3      | 7h         | 6h 25m       |
| 25     | 5       | 2      | 5h         | 5h           |
| 26     | 7       | 8      | 9h 30m     | 9h           |
| 27     | 8       | 13     | 13h 30m    | 13h 45m      |
| 10     | 6       | 5      | 9h         | 9h 30m       |
   

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)

|            | Mean   | StDev  |
|------------|--------|--------|
| Actual     | 1h 32m | 2h 4m  |
| Estimation | 1h 33m | 2h 4m  |


- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1

    $$\frac{\sum_i estimation_{task_i}}{\sum_i spent_{task_i}} - 1 = 0,013756614$$

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0,148443822$$

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 6h
  - Total hours spent: 5h 15m
  - Nr of automated unit test cases: 207
  - Coverage (if available)
        
        Stmt: 88.09
        Lines: 89.40
- Integration testing:
  - Total hours estimated: 6h 30m
  - Total hours spent: 6h 30m
  - Nr of test cases: 154
- E2E testing:
  - Total hours estimated: 6h 30m
  - Total hours spent: 6h 40m
  - Nr of test cases: 54
- Code review: 
  - Total hours estimated: 4h
  - Total hours spent: 4h
- Technical Debt management:
  - Strategy adopted:

    First, we added a 30-minute task to the sprint planning to be completed at the beginning of the sprint, ensuring that we could start writing code with the quality gate already passed. The remaining hours allocated to technical debt management were instead grouped into a task to be completed at the end of the sprint, so that we could showcase a version of the software that met the quality gate during the demo. The strategy for this task was to first address the issues that prevented us from meeting the quality gate and then resolve as many additional issues as possible, starting from those with the highest severity.
    
  - Total hours estimated estimated at sprint planning: 5h 30m
  - Total hours spent: 4h 30m
  


## ASSESSMENT

- What caused your errors in estimation (if any)?

- What lessons did you learn (both positive and negative) in this sprint?

- Which improvement goals set in the previous retrospective were you able to achieve? 
  
- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

> Propose one or two

- One thing you are proud of as a Team!!