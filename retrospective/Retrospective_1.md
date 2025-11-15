TEMPLATE FOR RETROSPECTIVE (Team 11)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done: 6 estimated stories, 5 committed stories, 5 done stories
- Total points committed vs. done: 14 committed and done story points
- Nr of hours planned vs. spent (as a team): 80 hours planned, 81h 15m hours spent

**Remember** a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _Uncategorized_   |    14     |       |     50h 20m       |    51h 15m          |
| 1      |     7    |  3      |       4h 30m     |   7h           |  
| 2      |     5    |  2      |       3h 30m     |   4h 10m          | 
| 3     |     5  |  1  |       2h 30m     |   6h 20m           | 
| 4      |     5    |  3      |       5h     |   7h           | 
| 5      |     6    |  5      |       7h 30m     |   7h           | 
| 6      |     5    |  3      |       4h     |   0h           | 

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation |  1h 45m    |   2h 46m    | 
| Actual     |   1h 59m   |   2h 34m    |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = \frac{81,25}{80}-1 = 0,015625$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0,300670638
     $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 6h
  - Total hours spent: 4h 45m  
  - Nr of automated unit test cases: 25
  - Coverage:
  
    > Stmt: 76,92

    > Lines: 77,7
- E2E testing:
  - Total hours estimated: 8h 30m
  - Total hours spent: 9h 25m
  - Nr of test cases: 44
- Code review 
  - Total hours estimated: 5h
  - Total hours spent: 2h
  


## ASSESSMENT

- What did go wrong in the sprint? In general, we under-estimated single tasks in some stories (especially story 1) and we didn't reserve enough time for bug fixes.

- What caused your errors in estimation (if any)? We tried to fix the over-estimation of the previous sprint and, in general, we has been overconfident about the libraries we used (especially passport).

- What lessons did you learn (both positive and negative) in this sprint? Positive lesson: we did a great task assignment (everybody worked on a story development and a different story test: this method works very well). Negative lesson: we have to consider that every story could present some bugs, so we should estimate more time in this sense. 

- Which improvement goals set in the previous retrospective were you able to achieve?
  > Improve in task division and task assignments

  > Use YouTrack more efficiently to correctly track the time
  
- Which ones you were not able to achieve? Why?

  > None

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > We have to consider that every story could present some bugs, so we should estimate more time in this sense.

- One thing you are proud of as a Team!! For the demo we preferred to test thoroughfully than to leave some stories uncompleted. 