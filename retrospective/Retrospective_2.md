TEMPLATE FOR RETROSPECTIVE (Team 11)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs. done: 5 estimated stories, 5 committed stories, 5 done stories
- Total points committed vs. done: 36 committed and done story points
- Nr of hours planned vs. spent (as a team): 80h 20m planned, 84h 05m hours spent

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!)

### Detailed statistics

| Story           | # Tasks | Points | Hours est. | Hours actual |
|-----------------|---------|--------|------------|--------------|
| _Uncategorized_ | 11      |        | 40h 20m    | 40h 05m      |
| 6               | 6       | 3      | 6h 30m     | 7h 15m       |  
| 7               | 7       | 8      | 9h         | 8h           | 
| 8               | 6       | 1      | 6h 30m     | 7h 15m       | 
| 9               | 6       | 3      | 7h         | 6h 45m       | 
| 11              | 15      | 21     | 19h        | 22h 45m      | 

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean   | StDev  |
|------------|--------|--------|
| Estimation | 1h 34m | 2h 8m  | 
| Actual     | 1h 38m | 2h 12m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

  $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = 0,046680498$$

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

  $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0,127980081$$

## QUALITY MEASURES

- Unit Testing:
    - Total hours estimated: 7h
    - Total hours spent: 6h 30m
    - Nr of automated unit test cases: 99
    - Coverage:

      > Stmt: 91.18

      > Lines: 91.55
- E2E testing:
    - Total hours estimated: 10h
    - Total hours spent: 10h 25m
    - Nr of test cases: 70
- Code review
    - Total hours estimated: 3h
    - Total hours spent: 2h 30m



## ASSESSMENT

- What did go wrong in the sprint? 
  - We underestimated the number of story points for story 8.
  - Story 11 was complex and led to some bugs during the testing phase.
  - We underestimated the number of hours for story 11

- What caused your errors in estimation (if any)?
  - We had some issues with understanding the product owner's requests for story 10 and 11.
  - We estimated story 11 as last story, so we had to fit it in a limited amount of time budget
    (it was more than the time budget available)

- What lessons did you learn (both positive and negative) in this sprint?
  - Negative lesson: we must check (and possibly update) tests every time we do some changes in the code
  - Positive lesson: we achieved a better code quality thanks to code review tasks in every story
  
- Which improvement goals set in the previous retrospective were you able to achieve?
    - We added code review for every story and reserved time for bug fixing

- Which ones you were not able to achieve? Why?
    - None

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - We want to improve in estimating story points

- One thing you are proud of as a Team!!
  - We managed to complete story 11, which required a lot of effort. 