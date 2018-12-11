# CS3733 Team Rana
Nick Benoit, Eamon Oldridge, Nathan Rosenberg, and Yil Verdeja

## Rana-Scheduler
The [Rana-Scheduler](http://rana-scheduler.s3-website.us-east-2.amazonaws.com/) website uses one page for all its views. The main page is the create schedule view, while the review schedule view is determined by a schedule ID query.

This is an example link that **will not work** where "scheduleID" is a number that represents an actual scheduleID
http://rana-scheduler.s3-website.us-east-2.amazonaws.com/?scheduleID

### Create Schedule
In the create schedule view, an Organizer must enter to proceed.
1. A schedule name
2. A start and end date
3. A start and end time
4. A timeslot duration
5. A username and email

After successfully creating a schedule, the link is changed. As shown in the example above, it appends a scheduleID to the end of the main link. It automatically enters the organizers view.

### Review Schedule
By sharing the link provided after creating a schedule (*see example link above*), anyone with the link can enter and view the schedule.

On the left, the viewer will see the organizers schedule. On the top of the schedule is the week of the schedule. If available, a user can move through different weeks using the *left* (<) and *right* (>) buttons. To understand the schedule, green slots are open slots, and grey slots are closed slots.

On the right, the viewer will see multiple user options. A user initially enters as a participant.

Instead of refreshing the page, a user can click the *refresh schedule* button to refresh the schedule.

#### Participant
A participant can only make a meeting in an opened slot and must enter their user details. After selecting a slot on the schedule with their mouse, and successfully creating a meeting, they will be provided a secret code to access their meeting and cancel it if need be.

A returning participant can view their meeting and cancel it if they enter their secret code in the input text provided.

#### Organizer
An organizer can enter the organizer view by using his secret code. Unlike a participants view, an organizer can see open slots (green), closed slots (grey) and meeting slots (yellow) with the users names.

By clicking on an open slot or closed slot, the organizer can toggle his availability at that timeslot. By clicking on a meeting, the organizer is prompted to cancel the meeting. If yes, the meeting will be deleted and the schedule will be updated.

### SysAdmin Page
Once entering the [SysAdmin](http://rana-scheduler.s3-website.us-east-2.amazonaws.com/?sysadmin) page, the user will be prompted to enter the secret code in order to access administrative details.

### Disabled options
All the disabled options are parts that have not been implemented yet and that are not required for the deliverable on the 12/10/2018 deadline.

## Step Summary
Organizer:
1. Enter main site
2. Create schedule and save secret code
3. Edit schedule
4. Copy link and share to participants

Participant:
1. Enter review site provided by organizer
2. Create meeting and save secret code
